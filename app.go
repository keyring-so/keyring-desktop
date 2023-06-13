package main

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io/ioutil"
	"keyring-desktop/utils"
	"log"
	"os"
	"time"

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
	a.ctx = ctx

	file, err := os.Open("registry.json")
	if err != nil {
		log.Fatal(err)
		return
	}
	defer file.Close()

	bytes, err := ioutil.ReadAll(file)
	if err != nil {
		log.Fatal(err)
		return
	}

	var chainConfigs []utils.ChainConfig
	err = json.Unmarshal(bytes, &chainConfigs)
	if err != nil {
		log.Fatal(err)
		return
	}

	a.chainConfigs = chainConfigs

	dbPath, err := utils.DatabasePath()
	if err != nil {
		log.Fatal(err)
		return
	}
	db, err := bolt.Open(dbPath, 0600, &bolt.Options{Timeout: 1 * time.Second})
	if err != nil {
		log.Fatal(err)
		return
	}
	err = db.Update(func(tx *bolt.Tx) error {
		_, err = tx.CreateBucket([]byte(utils.BucketName))
		return nil
	})
	if err != nil {
		log.Fatal(err)
		return
	}
	a.db = db
}

func (a *App) shutdown(ctx context.Context) {
	a.db.Close()
}

func (a *App) Connect() (string, error) {
	log.Printf("Check if there is smart card wired\n")

	var account string
	err := a.db.View(func(tx *bolt.Tx) error {
		b := tx.Bucket([]byte(utils.BucketName))
		account = string(b.Get([]byte("current_account")))
		return nil
	})
	if err != nil {
		log.Fatal(err)
		return "", err
	}

	fmt.Printf("The current account is: %s\n", account)
	return account, nil
}

func (a *App) Pair(pin string, puk string, code string, accountName string) (string, error) {
	log.Printf("Pairing with smart card\n")

	// read smart card
	cardContext, err := scard.EstablishContext()
	if err != nil {
		log.Printf("Error: %s\n", err)
		return "", errors.New("failed to establish card context")
	}
	defer func() {
		if err := cardContext.Release(); err != nil {
			log.Printf("Failed releasing card context: %v\n", err)
		}
	}()

	card, err := readCard(cardContext)
	if err != nil {
		log.Printf("Error: %s\n", err)
		return "", errors.New("failed to read card")
	}
	defer func() {
		if err := card.Disconnect(scard.ResetCard); err != nil {
			log.Printf("Failed disconnecting card: %v\n", err)
		}
	}()

	// sign with card
	cardSigner := NewCardSigner(card)
	err = cardSigner.Pair(pin, puk, code)
	if err != nil {
		log.Printf("Error: %s\n", err)
		return "", errors.New("failed to pair with card")
	}

	// TODO encrypt the puk and code, do not save pin, probably read others from QR code
	err = a.db.Update(func(tx *bolt.Tx) error {
		b := tx.Bucket([]byte(utils.BucketName))
		b.Put([]byte("current_account"), []byte(accountName))
		b.Put([]byte(accountName+"_pin"), []byte(pin))
		b.Put([]byte(accountName+"_puk"), []byte(puk))
		b.Put([]byte(accountName+"_code"), []byte(code))
		return nil
	})
	if err != nil {
		log.Fatal(err)
		return "", errors.New("failed to update database")
	}

	return accountName, nil
}

func (a *App) Transfer(
	asset string,
	nativeAsset string,
	from string,
	to string,
	amount string,
) (crosschain.TxHash, error) {
	log.Printf("Transfer %s %s from %s to %s\n", amount, asset, from, to)
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
	log.Printf("chain: %s\n", chainConfig)

	xc := factory.NewDefaultFactory()
	ctx := context.Background()

	assetConfig, err := xc.GetAssetConfig(asset, nativeAsset)
	if err != nil {
		log.Printf("Error: %s\n", err)
		return "", errors.New("unsupported asset")
	}

	fromAddress := xc.MustAddress(assetConfig, from)
	toAddress := xc.MustAddress(assetConfig, to)
	amountInteger := xc.MustAmountBlockchain(assetConfig, amount)

	client, _ := xc.NewClient(assetConfig)
	if err != nil {
		log.Printf("Error: %s\n", err)
		return "", errors.New("failed to create a client")
	}

	input, err := client.FetchTxInput(ctx, fromAddress, toAddress)
	if err != nil {
		log.Printf("Error: %s\n", err)
		return "", errors.New("failed to fetch tx input")
	}

	// only for Cosmos-based chains
	if inputWithPublicKey, ok := input.(crosschain.TxInputWithPublicKey); ok {
		inputWithPublicKey.SetPublicKeyFromStr("unimplemented")
	}
	log.Printf("input: %+v\n", input)

	// build tx
	builder, err := xc.NewTxBuilder(assetConfig)
	if err != nil {
		log.Printf("Error: %s\n", err)
		return "", errors.New("failed to create transaction builder")
	}
	tx, err := builder.NewTransfer(fromAddress, toAddress, amountInteger, input)
	if err != nil {
		log.Printf("Error: %s\n", err)
		return "", errors.New("failed to create transaction")
	}
	sighashes, err := tx.Sighashes()
	if err != nil {
		log.Printf("Error: %s\n", err)
		return "", errors.New("failed to get transaction hash")
	}
	sighash := sighashes[0]
	log.Printf("transaction: %+v\n", tx)
	log.Printf("signing: %x\n", sighash)

	// read smart card
	cardContext, err := scard.EstablishContext()
	if err != nil {
		log.Printf("Error: %s\n", err)
		return "", errors.New("failed to establish card context")
	}
	defer func() {
		if err := cardContext.Release(); err != nil {
			log.Printf("Failed releasing card context: %v\n", err)
		}
	}()

	card, err := readCard(cardContext)
	if err != nil {
		log.Printf("Error: %s\n", err)
		return "", errors.New("failed to read card")
	}
	defer func() {
		if err := card.Disconnect(scard.ResetCard); err != nil {
			log.Printf("Failed disconnecting card: %v\n", err)
		}
	}()

	// sign with card
	cardSigner := NewCardSigner(card)
	var pin string
	var puk string
	var pairing string
	err = a.db.View(func(tx *bolt.Tx) error {
		b := tx.Bucket([]byte(utils.BucketName))
		account := string(b.Get([]byte("current_account")))
		pin = string(b.Get([]byte(account + "_pin")))
		puk = string(b.Get([]byte(account + "_puk")))
		pairing = string(b.Get([]byte(account + "_code")))
		return nil
	})
	if err != nil {
		log.Fatal(err)
		return "", errors.New("failed to read database")
	}
	signature, err := cardSigner.Sign(sighash, chainConfig, pin, puk, pairing)
	if err != nil {
		log.Printf("Error: %s\n", err)
		return "", errors.New("failed to sign transaction hash")
	}
	log.Printf("signature: %x\n", signature)

	// complete the tx by adding signature
	err = tx.AddSignatures(signature)
	if err != nil {
		log.Printf("Error: %s\n", err)
		return "", errors.New("failed to add signature")
	}

	// submit the tx
	txId := tx.Hash()
	log.Printf("Submitting tx id: %s\n", txId)
	err = client.SubmitTx(ctx, tx)
	if err != nil {
		log.Printf("Error: %s\n", err)
		return "", errors.New("failed to submit transaction")
	}

	return txId, nil
}

func (a *App) RequestTransfer() string {
	return "unimplemented"
}

// Greet returns a greeting for the given name
func (a *App) Greet(name string) string {
	return fmt.Sprintf("Hello %s, It's show time!", name)
}
