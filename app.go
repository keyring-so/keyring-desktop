package main

import (
	"context"
	"errors"
	"keyring-desktop/database"
	"keyring-desktop/services"
	"keyring-desktop/utils"
	"os"

	"keyring-desktop/crosschain"
	"keyring-desktop/crosschain/chain/evm"
	"keyring-desktop/crosschain/factory"

	"github.com/jmoiron/sqlx"
	"github.com/status-im/keycard-go/types"
	"github.com/wailsapp/wails/v2/pkg/runtime"
)

// App struct
type App struct {
	ctx          context.Context
	chainConfigs []utils.ChainConfig
	initConfig   utils.InitConfig
	sqlite       *sqlx.DB
}

// NewApp creates a new App application struct
func NewApp() *App {
	return &App{}
}

// startup is called when the app starts. The context is saved
// so we can call the runtime methods
func (a *App) startup(ctx context.Context) {
	utils.SetupLog()
	utils.Sugar.Info("starting app...")

	a.ctx = ctx

	DbMigrate()

	sqlDbPath, err := utils.SQLiteDatabasePath()
	if err != nil {
		utils.Sugar.Fatal(err)
	}
	sqlDb, err := sqlx.Connect("sqlite", sqlDbPath)
	if err != nil {
		utils.Sugar.Fatal(err)
	}
	a.sqlite = sqlDb

	registryConfig, err := resources.ReadFile("resources/registry.json")
	if err != nil {
		utils.Sugar.Fatal(err)
	}
	a.chainConfigs = utils.ReadChainConfigs(registryConfig)

	initConfigBytes, err := resources.ReadFile("resources/init.json")
	if err != nil {
		utils.Sugar.Fatal(err)
	}
	initConfig, err := utils.ReadInitConfig(initConfigBytes)
	if err != nil {
		utils.Sugar.Fatal(err)
	}
	a.initConfig = *initConfig

	a.DataMigrate()
}

// shutdown is called when app quits
func (a *App) shutdown(ctx context.Context) {
	utils.Logger.Sync()
}

// start to pair a new card
func (a *App) Pair(pin, puk, code, cardName string) (*CardInfo, error) {
	utils.Sugar.Info("Pairing with smart card")

	if pin == "" || cardName == "" {
		return nil, errors.New("pin or card name can not be empty")
	}

	puk, err := utils.Decrypt(pin, puk)
	if err != nil {
		utils.Sugar.Error(err)
		return nil, errors.New("failed to decrypt PUK")
	}
	code, err = utils.Decrypt(pin, code)
	if err != nil {
		utils.Sugar.Error(err)
		return nil, errors.New("failed to decrypt Pairing Code")
	}

	// connect to card
	keyringCard, err := services.NewKeyringCard()
	if err != nil {
		utils.Sugar.Error(err)
		return nil, errors.New("failed to connect to card")
	}
	defer keyringCard.Release()

	// pair with card
	pairingInfo, err := keyringCard.Pair(pin, puk, code)
	if err != nil {
		utils.Sugar.Error(err)
		return nil, errors.New("failed to pair with card")
	}

	err = a.encryptAndSaveCredential(cardName, pin, puk, code, pairingInfo)
	if err != nil {
		utils.Sugar.Error(err)
		err = keyringCard.Unpair(pin, pairingInfo)
		if err != nil {
			utils.Sugar.Error(err)
		}
		return nil, err
	}

	return a.CurrentAccount()
}

func (a *App) encryptAndSaveCredential(cardName, pin, puk, code string, pairingInfo *types.PairingInfo) error {
	encryptedPuk, err := utils.Encrypt(pin, puk)
	if err != nil {
		utils.Sugar.Error(err)
		return errors.New("failed to encrypt PUK")
	}

	enryptedCode, err := utils.Encrypt(pin, code)
	if err != nil {
		utils.Sugar.Error(err)
		return errors.New("failed to encrypt Pairing Code")
	}

	encryptedPairingKey, err := utils.Encrypt(pin, string(pairingInfo.Key))
	if err != nil {
		utils.Sugar.Error(err)
		return errors.New("failed to encrypt Pairing Key")
	}

	encryptedPairingIndex, err := utils.Encrypt(pin, string([]byte{byte(pairingInfo.Index)}))
	if err != nil {
		utils.Sugar.Error(err)
		return errors.New("failed to encrypt Pairing Index")
	}

	err = database.SaveCard(a.sqlite, encryptedPuk, enryptedCode, encryptedPairingKey, encryptedPairingIndex, cardName)
	if err != nil {
		utils.Sugar.Error(err)
		return err
	}

	return nil
}

// add a new chain if not exist
func (a *App) GetChains(cardId int) (*CardChainInfo, error) {
	utils.Sugar.Info("Check if there is chain added already")

	accounts, err := database.QeuryAccounts(a.sqlite, cardId)
	if err != nil {
		utils.Sugar.Error(err)
		return nil, errors.New("failed to query accounts")
	}

	utils.Sugar.Infof("The chains are: %v", accounts)

	chains := []ChainDetail{}
	var lastSelectedChain string

	for _, account := range accounts {
		if sc, _ := account.SelectedAccount.Value(); sc == true {
			lastSelectedChain = account.ChainName
		}
		chainConfig := utils.GetChainConfig(a.chainConfigs, account.ChainName)
		chainDetail := ChainDetail{
			Name:    chainConfig.Name,
			Symbol:  chainConfig.Symbol,
			Img:     chainConfig.Img,
			Testnet: chainConfig.Testnet,
		}
		chains = append(chains, chainDetail)
	}

	res := CardChainInfo{
		Chains:            chains,
		LastSelectedChain: lastSelectedChain,
	}
	return &res, nil
}

// generate a new address for the selected account and chain
func (a *App) AddLedger(cardId int, chain string, pin string) (string, error) {
	utils.Sugar.Infow("Generate account address",
		"card", cardId,
		"chain", chain,
	)

	address, err := a.getAddrFromCard(cardId, chain, pin)
	if err != nil {
		utils.Sugar.Error(err)
		return "", errors.New("failed to get address from card")
	}

	// save slected chain and address
	err = database.SaveChainAccount(a.sqlite, cardId, chain, address)
	if err != nil {
		utils.Sugar.Error(err)
		return "", errors.New("failed to save chain to database")
	}

	return address, nil
}

func (a *App) VerifyAddress(cardId int, chain string, pin string) (string, error) {
	utils.Sugar.Infow("Verify account address",
		"card", cardId,
		"chain", chain,
	)

	address, err := a.getAddrFromCard(cardId, chain, pin)
	if err != nil {
		utils.Sugar.Error(err)
		return "", errors.New("failed to get address from card")
	}

	return address, nil
}

func (a *App) getAddrFromCard(cardId int, chain, pin string) (string, error) {
	if cardId < 0 || chain == "" {
		return "", errors.New("invalid card or chain")
	}
	chainConfig := utils.GetChainConfig(a.chainConfigs, chain)
	if chainConfig == nil {
		return "", errors.New("chain configuration not found")
	}

	// connect to card
	keyringCard, err := services.NewKeyringCard()
	if err != nil {
		utils.Sugar.Error(err)
		return "", errors.New("failed to connect to card")
	}
	defer keyringCard.Release()

	// get pairing info
	pairingInfo, err := a.getPairingInfo(pin, cardId)
	if err != nil {
		utils.Sugar.Error(err)
		return "", err
	}

	pubkey, err := keyringCard.ChainAddress(pin, pairingInfo, chainConfig)
	if err != nil {
		utils.Sugar.Error(err)
		return "", errors.New("failed to get public key")
	}

	assetConfig, err := utils.ConvertAssetConfig(a.chainConfigs, "", chain)
	if err != nil {
		utils.Sugar.Error(err)
		return "", errors.New("unsupported asset")
	}
	address, err := factory.GetAddressFromPublicKey(assetConfig, pubkey)
	if err != nil {
		utils.Sugar.Error(err)
		return "", errors.New("failed to get address from public key")
	}

	utils.Sugar.Infof("chain: %s, address: %s", chain, address)
	return string(address), nil
}

func (a *App) getPairingInfo(pin string, cardId int) (*types.PairingInfo, error) {
	card, err := database.QueryCard(a.sqlite, cardId)
	if err != nil {
		utils.Sugar.Error(err)
		return nil, errors.New("failed to read pairing info")
	}
	pairingKey, err := utils.Decrypt(pin, card.PairingKey)
	if err != nil {
		utils.Sugar.Error(err)
		return nil, errors.New("failed to decrypt pairing key")
	}

	pairingIndex, err := utils.Decrypt(pin, card.PairingIdx)
	if err != nil {
		utils.Sugar.Error(err)
		return nil, errors.New("failed to decrypt pairing index")
	}

	pairingInfo := types.PairingInfo{
		Key:   []byte(pairingKey),
		Index: int([]byte(pairingIndex)[0]),
	}

	return &pairingInfo, nil
}

func (a *App) CalculateFee(
	contract string,
	chainName string,
) (*FeeInfo, error) {
	utils.Sugar.Infof("Calculate fee for contract %s on %s network", contract, chainName)

	chainConfig := utils.GetChainConfig(a.chainConfigs, chainName)
	if chainConfig == nil {
		return nil, errors.New("chain configuration not found")
	}

	ctx := context.Background()

	assetConfig, err := utils.ConvertAssetConfig(a.chainConfigs, contract, chainName)
	if err != nil {
		utils.Sugar.Error(err)
		return nil, errors.New("unsupported asset")
	}

	client, _ := factory.NewClient(assetConfig)
	if err != nil {
		utils.Sugar.Error(err)
		return nil, errors.New("failed to create a client")
	}

	fee, err := client.(crosschain.GasEstimator).EstimateGas(ctx)
	if err != nil {
		utils.Sugar.Error(err)
		return nil, errors.New("failed to estimate gas fee")
	}

	gasFee, err := factory.ConvertAmountToHuman(assetConfig, fee)
	if err != nil {
		utils.Sugar.Error(err)
		return nil, errors.New("failed to convert amount to human readable format")
	}

	feeInfo := &FeeInfo{
		Gas: gasFee.String(),
	}

	return feeInfo, nil
}

func (a *App) Transfer(
	asset string,
	contract string,
	chainName string,
	from string,
	to string,
	amount string,
	gas string,
	pin string,
	cardId int,
) (crosschain.TxHash, error) {
	utils.Sugar.Infof("Transfer %s %s %s from %s to %s on %s network", amount, asset, contract, from, to, chainName)
	if from == "" || to == "" || amount == "" || pin == "" {
		return "", errors.New("input can not be empty")
	}

	chainConfig := utils.GetChainConfig(a.chainConfigs, chainName)
	if chainConfig == nil {
		return "", errors.New("chain configuration not found")
	}

	ctx := context.Background()

	assetConfig, err := utils.ConvertAssetConfig(a.chainConfigs, contract, chainName)
	if err != nil {
		utils.Sugar.Error(err)
		return "", errors.New("unsupported asset")
	}

	fromAddress := crosschain.Address(from)
	toAddress := crosschain.Address(to)
	amountInteger, err := factory.ConvertAmountStrToBlockchain(assetConfig, amount)
	if err != nil {
		utils.Sugar.Error(err)
		return "", errors.New("failed to convert the input amount")
	}

	client, _ := factory.NewClient(assetConfig)
	if err != nil {
		utils.Sugar.Error(err)
		return "", errors.New("failed to create a client")
	}

	input, err := client.FetchTxInput(ctx, fromAddress, toAddress)
	// TODO disable custom gas fee
	if gas != "" && false {
		gasInteger, err := factory.ConvertAmountStrToBlockchain(assetConfig, gas)
		if err != nil {
			utils.Sugar.Error(err)
			return "", errors.New("failed to convert the gas amount")
		}
		input.(*evm.TxInput).GasTipCap = gasInteger
	}
	if err != nil {
		utils.Sugar.Error(err)
		return "", errors.New("failed to fetch tx input")
	}

	// connect to card
	keyringCard, err := services.NewKeyringCard()
	if err != nil {
		utils.Sugar.Error(err)
		return "", errors.New("failed to connect to card")
	}
	defer keyringCard.Release()

	// get pairing info
	pairingInfo, err := a.getPairingInfo(pin, cardId)
	if err != nil {
		utils.Sugar.Error(err)
		return "", errors.New("failed to get pairing info")
	}

	// only for Cosmos-based chains
	if inputWithPublicKey, ok := input.(crosschain.TxInputWithPublicKey); ok {
		pubkey, err := keyringCard.ChainAddress(pin, pairingInfo, chainConfig)
		if err != nil {
			utils.Sugar.Error(err)
			return "", errors.New("failed to get public key")
		}
		inputWithPublicKey.SetPublicKey(pubkey)
	}
	utils.Sugar.Infof("input: %+v", input)

	// build tx
	builder, err := factory.NewTxBuilder(assetConfig)
	if err != nil {
		utils.Sugar.Error(err)
		return "", errors.New("failed to create transaction builder")
	}
	tx, err := builder.NewTransfer(fromAddress, toAddress, amountInteger, input)
	if err != nil {
		utils.Sugar.Error(err)
		return "", errors.New("failed to create transaction")
	}
	utils.Sugar.Infof("tx: %s", tx)
	sighashes, err := tx.Sighashes()
	if err != nil {
		utils.Sugar.Error("Error: %s", err)
		return "", errors.New("failed to get transaction hash")
	}
	sighash := sighashes[0]
	utils.Sugar.Infof("transaction: %+v", tx)
	utils.Sugar.Infof("signing: %x", sighash)

	signature, err := keyringCard.Sign(sighash, chainConfig, pin, pairingInfo)
	if err != nil {
		utils.Sugar.Error(err)
		return "", errors.New("failed to sign transaction hash")
	}
	utils.Sugar.Infof("signature: %x", signature)

	// complete the tx by adding signature
	err = tx.AddSignatures(signature)
	if err != nil {
		utils.Sugar.Error(err)
		return "", errors.New("failed to add signature")
	}

	// submit the tx
	txId := tx.Hash()
	utils.Sugar.Infof("Submitting tx id: %s", txId)
	err = client.SubmitTx(ctx, tx)
	if err != nil {
		utils.Sugar.Error(err)
		return "", errors.New("failed to submit transaction")
	}

	return txId, nil
}

func (a *App) CheckCardConnection() bool {
	keyringCard, err := services.NewKeyringCard()
	if err != nil {
		utils.Sugar.Error(err)
		return false
	}
	defer keyringCard.Release()

	return true
}

func (a *App) CheckCardInitialized() (bool, error) {
	// connect to card
	keyringCard, err := services.NewKeyringCard()
	if err != nil {
		utils.Sugar.Error(err)
		return false, errors.New("failed to connect to card")
	}
	defer keyringCard.Release()

	// check if card is initialized
	initialized, err := keyringCard.IsInitialized()
	if err != nil {
		utils.Sugar.Error(err)
		return false, errors.New("failed to check card status")
	}
	return initialized, nil
}

// start to init a new card
// 1. init card with storage allocated not not filled on the card
// 2. pair with credentials
// 3. generate mnemonic
// 4. load key with mnemonic and fill the private key on the card
func (a *App) Initialize(pin string, cardName string, checkSumSize int) (*InitCardResponse, error) {
	utils.Sugar.Info("Initialize card")

	if pin == "" || cardName == "" {
		return nil, errors.New("pin or card name can not be empty")
	}

	puk := utils.GenPuk()
	code := utils.GenPairingCode()

	// connect to card
	keyringCard, err := services.NewKeyringCard()
	if err != nil {
		utils.Sugar.Error(err)
		return nil, errors.New("failed to connect to card")
	}
	defer keyringCard.Release()

	// initialize card
	err = keyringCard.Init(pin, puk, code)
	if err != nil {
		utils.Sugar.Error(err)
		return nil, errors.New("failed to init card")
	}

	res, err := keyringCard.GenerateKey(pin, puk, code, checkSumSize)
	if err != nil {
		utils.Sugar.Error(err)
		return nil, errors.New("failed to generate key")
	}

	err = a.encryptAndSaveCredential(cardName, pin, puk, code, res.PairingInfo)
	if err != nil {
		utils.Sugar.Error(err)
		err = keyringCard.Reset(res.PairingInfo)
		if err != nil {
			utils.Sugar.Error(err)
		}

		return nil, errors.New("failed to save credential")
	}

	currentCard, err := a.CurrentAccount()
	if err != nil {
		utils.Sugar.Error(err)
		return nil, err
	}

	initCardRes := InitCardResponse{
		Mnemonic: res.Mnemonic,
		CardInfo: *currentCard,
	}

	return &initCardRes, nil
}

func (a *App) LoadSecrePhrase(pin string, cardName string, mnemonic string) (*InitCardResponse, error) {
	utils.Sugar.Info("Load secret phrase")

	if pin == "" || cardName == "" || mnemonic == "" {
		return nil, errors.New("pin, card name, secret phrase can not be empty")
	}

	puk := utils.GenPuk()
	code := utils.GenPairingCode()

	// connect to card
	keyringCard, err := services.NewKeyringCard()
	if err != nil {
		utils.Sugar.Error(err)
		return nil, errors.New("failed to connect to card")
	}
	defer keyringCard.Release()

	// initialize card
	err = keyringCard.Init(pin, puk, code)
	if err != nil {
		utils.Sugar.Error(err)
		return nil, errors.New("failed to init card")
	}

	res, err := keyringCard.LoadMnemonic(pin, puk, code, mnemonic)
	if err != nil {
		utils.Sugar.Error(err)
		return nil, errors.New("failed to generate key")
	}

	err = a.encryptAndSaveCredential(cardName, pin, puk, code, res.PairingInfo)
	if err != nil {
		utils.Sugar.Error(err)
		err = keyringCard.Reset(res.PairingInfo)
		if err != nil {
			utils.Sugar.Error(err)
		}

		return nil, errors.New("failed to save credential")
	}

	currentCard, err := a.CurrentAccount()
	if err != nil {
		utils.Sugar.Error(err)
		return nil, err
	}

	initCardRes := InitCardResponse{
		Mnemonic: res.Mnemonic,
		CardInfo: *currentCard,
	}

	return &initCardRes, nil
}

// Remove existing applet, and install the selected applet.
func (a *App) Install() error {
	utils.Sugar.Info("Start to install applets on card")

	// open the cap file
	file, err := runtime.OpenFileDialog(a.ctx, runtime.OpenDialogOptions{})
	if err != nil {
		utils.Sugar.Error(err)
		return errors.New("failed to open file dialog")
	}
	capFile, err := os.Open(file)
	if err != nil {
		utils.Sugar.Error(err)
		return errors.New("failed to open file")
	}

	// connect to card
	keyringCard, err := services.NewKeyringCard()
	if err != nil {
		utils.Sugar.Error(err)
		return errors.New("failed to connect to card")
	}
	defer keyringCard.Release()

	// install card
	err = keyringCard.Install(capFile)
	if err != nil {
		utils.Sugar.Error(err)
		return errors.New("failed to install applet on card")
	}
	return nil
}
