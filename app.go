package main

import (
	"bytes"
	"context"
	"errors"
	"keyring-desktop/database"
	"keyring-desktop/services"
	"keyring-desktop/utils"
	"os"

	"keyring-desktop/crosschain"
	"keyring-desktop/crosschain/chain/evm"
	"keyring-desktop/crosschain/factory"

	"github.com/spf13/viper"
	"github.com/status-im/keycard-go/types"
	"github.com/wailsapp/wails/v2/pkg/runtime"

	bolt "go.etcd.io/bbolt"
)

// App struct
type App struct {
	ctx              context.Context
	chainConfigs     []utils.ChainConfig
	db               *bolt.DB
	crosschainConfig []byte
}

// NewApp creates a new App application struct
func NewApp() *App {
	return &App{}
}

// startup is called when the app starts. The context is saved
// so we can call the runtime methods
func (a *App) startup(ctx context.Context) {
	utils.SetupLog()

	a.ctx = ctx
	a.db = utils.InitDb()

	network, err := database.QueryNetwork(a.db)
	if err != nil {
		utils.Sugar.Fatal(err)
	}
	var crosschainConfigPath string
	if network == utils.Testnet {
		crosschainConfigPath = "resources/crosschain-testnet.yaml"
	} else {
		crosschainConfigPath = "resources/crosschain-mainnet.yaml"
	}
	crosschainConfig, err := resources.ReadFile(crosschainConfigPath)
	if err != nil {
		utils.Sugar.Fatal(err)
	}
	a.crosschainConfig = crosschainConfig

	registryConfig, err := resources.ReadFile("resources/registry.json")
	if err != nil {
		utils.Sugar.Fatal(err)
	}
	a.chainConfigs = utils.GetChainConfigs(registryConfig)
}

// shutdown is called when app quits
func (a *App) shutdown(ctx context.Context) {
	a.db.Close()
	utils.Logger.Sync()
}

// start to pair a new card
func (a *App) Pair(pin, puk, code, accountName string) (*AccountInfo, error) {
	utils.Sugar.Info("Pairing with smart card")

	if pin == "" || accountName == "" {
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

	err = a.encryptAndSaveCredential(accountName, pin, puk, code, pairingInfo)
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

func (a *App) encryptAndSaveCredential(account, pin, puk, code string, pairingInfo *types.PairingInfo) error {
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

	err = database.SaveCredential(a.db, encryptedPuk, enryptedCode, encryptedPairingKey, encryptedPairingIndex, account)
	if err != nil {
		utils.Sugar.Error(err)
		return err
	}

	return nil
}

// add a new chain if not exist
func (a *App) GetChains(account string) (*database.AccountChainInfo, error) {
	utils.Sugar.Info("Check if there is chain added already")

	chains, err := database.QueryChains(a.db, account)
	if err != nil {
		utils.Sugar.Error(err)
		return nil, errors.New("failed to query current account")
	}

	utils.Sugar.Infof("The chains are: %s", chains)
	return chains, nil
}

// generate a new address for the selected account and chain
func (a *App) AddLedger(account string, chain string, pin string) (string, error) {
	utils.Sugar.Infow("Generate account address",
		"account", account,
		"chain", chain,
	)

	address, err := a.getAddrFromCard(account, chain, pin)
	if err != nil {
		utils.Sugar.Error(err)
		return "", errors.New("failed to get address from card")
	}

	// save slected chain and address
	err = database.SaveChainAddress(a.db, account, chain, address)
	if err != nil {
		utils.Sugar.Error(err)
		return "", errors.New("failed to update database")
	}

	return address, nil
}

func (a *App) VerifyAddress(account string, chain string, pin string) (string, error) {
	utils.Sugar.Infow("Verify account address",
		"account", account,
		"chain", chain,
	)

	address, err := a.getAddrFromCard(account, chain, pin)
	if err != nil {
		utils.Sugar.Error(err)
		return "", errors.New("failed to get address from card")
	}

	return address, nil
}

func (a *App) getAddrFromCard(account, chain, pin string) (string, error) {
	if account == "" || chain == "" {
		return "", errors.New("invalid account or chain")
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
	pairingInfo, err := a.getPairingInfo(pin, account)
	if err != nil {
		utils.Sugar.Error(err)
		return "", errors.New("failed to get pairing info")
	}

	address, err := keyringCard.ChainAddress(pin, pairingInfo, chainConfig)
	if err != nil {
		utils.Sugar.Error(err)
		return "", errors.New("failed to get chain address")
	}

	utils.Sugar.Infof("chain: %s, address: %s", chain, address)
	return address, nil
}

func (a *App) getPairingInfo(pin, account string) (*types.PairingInfo, error) {
	enPairingInfo, err := database.QueryPairingInfo(a.db, account)
	if err != nil {
		utils.Sugar.Error(err)
		return nil, errors.New("failed to read pairing info")
	}
	pairingKey, err := utils.Decrypt(pin, enPairingInfo.Key)
	if err != nil {
		utils.Sugar.Error(err)
		return nil, errors.New("failed to decrypt pairing key")
	}

	pairingIndex, err := utils.Decrypt(pin, enPairingInfo.Index)
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
	asset string,
	nativeAsset string,
	from string,
	to string,
	amount string,
) (*FeeInfo, error) {
	utils.Sugar.Infof("Calculate fee for %s %s from %s to %s on %s network", amount, asset, from, to, nativeAsset)

	chainConfig := utils.GetChainConfig(a.chainConfigs, nativeAsset)
	if chainConfig == nil {
		return nil, errors.New("chain configuration not found")
	}

	v := viper.New()
	v.SetConfigType("yaml")
	err := v.ReadConfig(bytes.NewReader(a.crosschainConfig))
	if err != nil {
		utils.Sugar.Error(err)
		return nil, errors.New("failed to read crosschain configurate")
	}
	xc := factory.NewDefaultFactoryWithConfig(v.GetStringMap("crosschain"))
	ctx := context.Background()

	assetConfig, err := xc.GetAssetConfig(asset, nativeAsset)
	if err != nil {
		utils.Sugar.Error(err)
		return nil, errors.New("unsupported asset")
	}

	fromAddress := xc.MustAddress(assetConfig, from)
	toAddress := xc.MustAddress(assetConfig, to)

	client, _ := xc.NewClient(assetConfig)
	if err != nil {
		utils.Sugar.Error(err)
		return nil, errors.New("failed to create a client")
	}

	input, err := client.FetchTxInput(ctx, fromAddress, toAddress)
	if err != nil {
		utils.Sugar.Error(err)
		return nil, errors.New("failed to fetch tx input")
	}

	feeInfo := &FeeInfo{
		Base: input.(*evm.TxInput).BaseFee.String(),
		Tip:  input.(*evm.TxInput).GasTipCap.String(),
	}

	return feeInfo, nil
}

func (a *App) Transfer(
	asset string,
	nativeAsset string,
	from string,
	to string,
	amount string,
	tip string,
	pin string,
	account string,
) (crosschain.TxHash, error) {
	utils.Sugar.Infof("Transfer %s %s from %s to %s on %s network", amount, asset, from, to, nativeAsset)
	if from == "" || to == "" || amount == "" || pin == "" {
		return "", errors.New("input can not be empty")
	}

	chainConfig := utils.GetChainConfig(a.chainConfigs, nativeAsset)
	if chainConfig == nil {
		return "", errors.New("chain configuration not found")
	}

	v := viper.New()
	v.SetConfigType("yaml")
	err := v.ReadConfig(bytes.NewReader(a.crosschainConfig))
	if err != nil {
		utils.Sugar.Error(err)
		return "", errors.New("failed to read crosschain configurate")
	}
	xc := factory.NewDefaultFactoryWithConfig(v.GetStringMap("crosschain"))
	ctx := context.Background()

	assetConfig, err := xc.GetAssetConfig(asset, nativeAsset)
	if err != nil {
		utils.Sugar.Error(err)
		return "", errors.New("unsupported asset")
	}

	fromAddress := xc.MustAddress(assetConfig, from)
	toAddress := xc.MustAddress(assetConfig, to)
	amountInteger, err := xc.ConvertAmountStrToBlockchain(assetConfig, amount)
	if err != nil {
		utils.Sugar.Error(err)
		return "", errors.New("failed to convert the input amount")
	}

	client, _ := xc.NewClient(assetConfig)
	if err != nil {
		utils.Sugar.Error(err)
		return "", errors.New("failed to create a client")
	}

	input, err := client.FetchTxInput(ctx, fromAddress, toAddress)
	if tip != "" {
		input.(*evm.TxInput).GasTipCap = crosschain.NewAmountBlockchainFromStr(tip)
	}
	if err != nil {
		utils.Sugar.Error(err)
		return "", errors.New("failed to fetch tx input")
	}

	// only for Cosmos-based chains
	if inputWithPublicKey, ok := input.(crosschain.TxInputWithPublicKey); ok {
		inputWithPublicKey.SetPublicKeyFromStr("unimplemented")
	}
	utils.Sugar.Infof("input: %+v", input)

	// build tx
	builder, err := xc.NewTxBuilder(assetConfig)
	if err != nil {
		utils.Sugar.Error(err)
		return "", errors.New("failed to create transaction builder")
	}
	tx, err := builder.NewTransfer(fromAddress, toAddress, amountInteger, input)
	if err != nil {
		utils.Sugar.Error(err)
		return "", errors.New("failed to create transaction")
	}
	sighashes, err := tx.Sighashes()
	if err != nil {
		utils.Sugar.Infof("Error: %s", err)
		return "", errors.New("failed to get transaction hash")
	}
	sighash := sighashes[0]
	utils.Sugar.Infof("transaction: %+v", tx)
	utils.Sugar.Infof("signing: %x", sighash)

	// connect to card
	keyringCard, err := services.NewKeyringCard()
	if err != nil {
		utils.Sugar.Error(err)
		return "", errors.New("failed to connect to card")
	}
	defer keyringCard.Release()

	// get pairing info
	pairingInfo, err := a.getPairingInfo(pin, account)
	if err != nil {
		utils.Sugar.Error(err)
		return "", errors.New("failed to get pairing info")
	}

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
func (a *App) Initialize(pin string, accountName string, checkSumSize int) (string, error) {
	utils.Sugar.Info("Initialize card")

	if pin == "" || accountName == "" {
		return "", errors.New("pin or card name can not be empty")
	}

	puk := utils.GenPuk()
	code := utils.GenPairingCode()

	// connect to card
	keyringCard, err := services.NewKeyringCard()
	if err != nil {
		utils.Sugar.Error(err)
		return "", errors.New("failed to connect to card")
	}
	defer keyringCard.Release()

	// initialize card
	err = keyringCard.Init(pin, puk, code)
	if err != nil {
		utils.Sugar.Error(err)
		return "", errors.New("failed to init card")
	}

	res, err := keyringCard.GenerateKey(pin, puk, code, checkSumSize)
	if err != nil {
		utils.Sugar.Error(err)
		return "", errors.New("failed to generate key")
	}

	err = a.encryptAndSaveCredential(accountName, pin, puk, code, res.PairingInfo)
	if err != nil {
		utils.Sugar.Error(err)
		errUnpair := keyringCard.Unpair(pin, res.PairingInfo)
		if errUnpair != nil {
			utils.Sugar.Error(errUnpair)
		}

		// TODO uninit the card, and remove the key
		return "", err
	}

	return res.Mnemonic, nil
}

// Now to remove the key from the card, we need to reinstall the applet
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
