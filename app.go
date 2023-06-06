package main

import (
	"context"
	"errors"
	"fmt"
	"log"

	"github.com/ebfe/scard"
	"github.com/jumpcrypto/crosschain"
	"github.com/jumpcrypto/crosschain/factory"
)

// App struct
type App struct {
	ctx context.Context
}

// NewApp creates a new App application struct
func NewApp() *App {
	return &App{}
}

// startup is called when the app starts. The context is saved
// so we can call the runtime methods
func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
}

func (a *App) Transfer(
	asset string,
	nativeAsset string,
	from string,
	to string,
	amount string,
) (crosschain.TxHash, error) {
	log.Printf("Transfer %s %s from %s to %s\n", amount, asset, from, to)
	xc := factory.NewDefaultFactory()
	ctx := context.Background()

	assetConfig, err := xc.GetAssetConfig(asset, nativeAsset)
	if err != nil {
		log.Printf("Error: %s\n", err)
		return "", errors.New("Unsupported asset")
	}

	fromAddress := xc.MustAddress(assetConfig, from)
	toAddress := xc.MustAddress(assetConfig, to)
	amountInteger := xc.MustAmountBlockchain(assetConfig, amount)

	client, _ := xc.NewClient(assetConfig)
	if err != nil {
		log.Printf("Error: %s\n", err)
		return "", errors.New("Failed to create a client")
	}

	input, err := client.FetchTxInput(ctx, fromAddress, toAddress)
	if err != nil {
		log.Printf("Error: %s\n", err)
		return "", errors.New("Failed to fetch tx input")
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
		return "", errors.New("Failed to create transaction builder")
	}
	tx, err := builder.NewTransfer(fromAddress, toAddress, amountInteger, input)
	if err != nil {
		log.Printf("Error: %s\n", err)
		return "", errors.New("Failed to create transaction")
	}
	sighashes, err := tx.Sighashes()
	if err != nil {
		log.Printf("Error: %s\n", err)
		return "", errors.New("Failed to get transaction hash")
	}
	sighash := sighashes[0]
	log.Printf("transaction: %+v\n", tx)
	log.Printf("signing: %x\n", sighash)

	// read smart card
	cardContext, err := scard.EstablishContext()
	if err != nil {
		log.Printf("Error: %s\n", err)
		return "", errors.New("Failed to establish card context")
	}
	defer func() {
		if err := cardContext.Release(); err != nil {
			log.Printf("Failed releasing card context: %v\n", err)
		}
	}()

	card, err := readCard(cardContext)
	if err != nil {
		log.Printf("Error: %s\n", err)
		return "", errors.New("Failed to read card")
	}
	defer func() {
		if err := card.Disconnect(scard.ResetCard); err != nil {
			log.Printf("Failed disconnecting card: %v\n", err)
		}
	}()

	// sign with card
	cardSigner := NewCardSigner(card)
	signature, err := cardSigner.Sign(sighash)
	if err != nil {
		log.Printf("Error: %s\n", err)
		return "", errors.New("Failed to sign transaction hash")
	}
	log.Printf("signature: %x\n", signature)

	// complete the tx by adding signature
	err = tx.AddSignatures(signature)
	if err != nil {
		log.Printf("Error: %s\n", err)
		return "", errors.New("Failed to add signature")
	}

	// submit the tx
	txId := tx.Hash()
	log.Printf("Submitting tx id: %s\n", txId)
	err = client.SubmitTx(ctx, tx)
	if err != nil {
		log.Printf("Error: %s\n", err)
		return "", errors.New("Failed to submit transaction")
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
