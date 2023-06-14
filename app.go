package main

import (
	"context"
	"errors"
	"keyring-desktop/services"
	"keyring-desktop/utils"

	"github.com/ebfe/scard"
	"github.com/jumpcrypto/crosschain"
	"github.com/jumpcrypto/crosschain/factory"

	bolt "go.etcd.io/bbolt"
)

// App struct
type App struct {
	ctx          context.Context
	chainConfigs []utils.ChainConfig
	db           *bolt.DB
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
	a.chainConfigs = utils.GetChainConfig()
	a.db = utils.InitDb()
}

func (a *App) shutdown(ctx context.Context) {
	a.db.Close()
	utils.Logger.Sync()
}

func (a *App) Connect() (string, error) {
	utils.Sugar.Info("Check if there is smart card wired")

	var account string
	err := a.db.View(func(tx *bolt.Tx) error {
		b := tx.Bucket([]byte(utils.BucketName))
		account = string(b.Get([]byte(utils.DbCurrentAccountKey)))
		return nil
	})
	if err != nil {
		utils.Sugar.Error(err)
		return "", err
	}

	utils.Sugar.Infof("The current account is: %s", account)
	return account, nil
}

func (a *App) Pair(pin string, puk string, code string, accountName string) (string, error) {
	utils.Sugar.Info("Pairing with smart card")

	// read smart card
	cardContext, err := scard.EstablishContext()
	if err != nil {
		utils.Sugar.Error(err)
		return "", errors.New("failed to establish card context")
	}
	defer func() {
		if err := cardContext.Release(); err != nil {
			utils.Sugar.Errorf("Failed releasing card context: %v", err)
		}
	}()

	card, err := readCard(cardContext)
	if err != nil {
		utils.Sugar.Error(err)
		return "", errors.New("failed to read card")
	}
	defer func() {
		if err := card.Disconnect(scard.ResetCard); err != nil {
			utils.Sugar.Errorf("Failed disconnecting card: %v", err)
		}
	}()

	// sign with card
	cardSigner := services.NewCardSigner(card)
	err = cardSigner.Pair(pin, puk, code)
	if err != nil {
		utils.Sugar.Error(err)
		return "", errors.New("failed to pair with card")
	}

	// TODO encrypt the puk and code, do not save pin, probably read others from QR code
	err = a.db.Update(func(tx *bolt.Tx) error {
		b := tx.Bucket([]byte(utils.BucketName))
		b.Put([]byte(utils.DbCurrentAccountKey), []byte(accountName))
		b.Put([]byte(accountName+"_pin"), []byte(pin))
		b.Put([]byte(accountName+"_puk"), []byte(puk))
		b.Put([]byte(accountName+"_code"), []byte(code))
		return nil
	})
	if err != nil {
		utils.Sugar.Error(err)
		return "", errors.New("failed to update database")
	}

	return accountName, nil
}

type SelectResponse struct {
	Chain   string `json:"chain"`
	Address string `json:"address"`
}

func (a *App) Select(account string) (*SelectResponse, error) {
	utils.Sugar.Infof("Selecting account address, %s", account)

	var address string
	var chain string
	err := a.db.View(func(tx *bolt.Tx) error {
		b := tx.Bucket([]byte(utils.BucketName))
		chain = string(b.Get([]byte(account + "last_selected_chain")))
		utils.Sugar.Infof("last_selected_chain: %s", chain)
		address = string(b.Get([]byte(account + "_" + chain + "_address")))
		utils.Sugar.Infof("chain _address: %s", address)
		return nil
	})
	if err != nil {
		utils.Sugar.Fatal(err)
		return nil, errors.New("failed to read database")
	}

	if chain != "" {
		resp := &SelectResponse{
			Chain:   chain,
			Address: address,
		}
		return resp, nil
	}

	chain = "ETH"
	var chainConfig *utils.ChainConfig
	for _, c := range a.chainConfigs {
		if c.Symbol == chain {
			chainConfig = &c
			break
		}
	}
	if chainConfig == nil {
		return nil, errors.New("chain configuration not found")
	}

	// read smart card TODO lock the card reader if alrady reading
	cardContext, err := scard.EstablishContext()
	if err != nil {
		utils.Sugar.Error(err)
		return nil, errors.New("failed to establish card context")
	}
	defer func() {
		if err := cardContext.Release(); err != nil {
			utils.Sugar.Errorf("Failed releasing card context: %v", err)
		}
	}()

	card, err := readCard(cardContext)
	if err != nil {
		utils.Sugar.Error(err)
		return nil, errors.New("failed to read card")
	}
	defer func() {
		if err := card.Disconnect(scard.ResetCard); err != nil {
			utils.Sugar.Errorf("Failed disconnecting card: %v", err)
		}
	}()

	// sign with card
	cardSigner := services.NewCardSigner(card)
	var pin string
	var puk string
	var pairing string
	err = a.db.View(func(tx *bolt.Tx) error {
		b := tx.Bucket([]byte(utils.BucketName))
		pin = string(b.Get([]byte(account + "_pin")))
		puk = string(b.Get([]byte(account + "_puk")))
		pairing = string(b.Get([]byte(account + "_code")))
		return nil
	})
	if err != nil {
		utils.Sugar.Fatal(err)
		return nil, errors.New("failed to read database")
	}
	address, err = cardSigner.Address(pin, puk, pairing, chainConfig)
	if err != nil {
		utils.Sugar.Infof("Error: %s", err)
		return nil, errors.New("failed to sign transaction hash")
	}
	utils.Sugar.Infof("chain: %s, address: %s", chain, address)

	err = a.db.Update(func(tx *bolt.Tx) error {
		b := tx.Bucket([]byte(utils.BucketName))
		b.Put([]byte(account+"last_selected_chain"), []byte(chain))
		b.Put([]byte(account+"_"+chain+"_address"), []byte(address))
		return nil
	})
	if err != nil {
		utils.Sugar.Fatal(err)
		return nil, errors.New("failed to update database")
	}

	resp := &SelectResponse{
		Chain:   chain,
		Address: address,
	}
	return resp, nil
}

func (a *App) Transfer(
	asset string,
	nativeAsset string,
	from string,
	to string,
	amount string,
) (crosschain.TxHash, error) {
	utils.Sugar.Infof("Transfer %s %s from %s to %s", amount, asset, from, to)
	var chainConfig *utils.ChainConfig
	for _, c := range a.chainConfigs {
		if c.Symbol == nativeAsset {
			chainConfig = &c
			break
		}
	}
	if chainConfig == nil {
		return "", errors.New("chain configuration not found")
	}
	utils.Sugar.Infof("chain: %s", chainConfig)

	xc := factory.NewDefaultFactory()
	ctx := context.Background()

	assetConfig, err := xc.GetAssetConfig(asset, nativeAsset)
	if err != nil {
		utils.Sugar.Infof("Error: %s", err)
		return "", errors.New("unsupported asset")
	}

	fromAddress := xc.MustAddress(assetConfig, from)
	toAddress := xc.MustAddress(assetConfig, to)
	amountInteger := xc.MustAmountBlockchain(assetConfig, amount)

	client, _ := xc.NewClient(assetConfig)
	if err != nil {
		utils.Sugar.Infof("Error: %s", err)
		return "", errors.New("failed to create a client")
	}

	input, err := client.FetchTxInput(ctx, fromAddress, toAddress)
	if err != nil {
		utils.Sugar.Infof("Error: %s", err)
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
		utils.Sugar.Infof("Error: %s", err)
		return "", errors.New("failed to create transaction builder")
	}
	tx, err := builder.NewTransfer(fromAddress, toAddress, amountInteger, input)
	if err != nil {
		utils.Sugar.Infof("Error: %s", err)
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

	// read smart card
	cardContext, err := scard.EstablishContext()
	if err != nil {
		utils.Sugar.Infof("Error: %s", err)
		return "", errors.New("failed to establish card context")
	}
	defer func() {
		if err := cardContext.Release(); err != nil {
			utils.Sugar.Infof("Failed releasing card context: %v", err)
		}
	}()

	card, err := readCard(cardContext)
	if err != nil {
		utils.Sugar.Infof("Error: %s", err)
		return "", errors.New("failed to read card")
	}
	defer func() {
		if err := card.Disconnect(scard.ResetCard); err != nil {
			utils.Sugar.Infof("Failed disconnecting card: %v", err)
		}
	}()

	// sign with card
	cardSigner := services.NewCardSigner(card)
	var pin string
	var puk string
	var pairing string
	err = a.db.View(func(tx *bolt.Tx) error {
		b := tx.Bucket([]byte(utils.BucketName))
		account := string(b.Get([]byte(utils.DbCurrentAccountKey)))
		pin = string(b.Get([]byte(account + "_pin")))
		puk = string(b.Get([]byte(account + "_puk")))
		pairing = string(b.Get([]byte(account + "_code")))
		return nil
	})
	if err != nil {
		utils.Sugar.Fatal(err)
		return "", errors.New("failed to read database")
	}
	signature, err := cardSigner.Sign(sighash, chainConfig, pin, puk, pairing)
	if err != nil {
		utils.Sugar.Infof("Error: %s", err)
		return "", errors.New("failed to sign transaction hash")
	}
	utils.Sugar.Infof("signature: %x", signature)

	// complete the tx by adding signature
	err = tx.AddSignatures(signature)
	if err != nil {
		utils.Sugar.Infof("Error: %s", err)
		return "", errors.New("failed to add signature")
	}

	// submit the tx
	txId := tx.Hash()
	utils.Sugar.Infof("Submitting tx id: %s", txId)
	err = client.SubmitTx(ctx, tx)
	if err != nil {
		utils.Sugar.Infof("Error: %s", err)
		return "", errors.New("failed to submit transaction")
	}

	return txId, nil
}
