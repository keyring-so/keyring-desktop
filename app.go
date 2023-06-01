package main

import (
	"context"
	"fmt"
	"time"

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

// Greet returns a greeting for the given name
func (a *App) Greet(name string) string {
	// initialize crosschain
	xc := factory.NewDefaultFactory()
	ctx := context.Background()

	// get asset model, including config data
	// asset is used to create client, builder, signer, etc.
	asset, err := xc.GetAssetConfig("", "ETH")
	if err != nil {
		panic("unsupported asset")
	}

	// panic("Please edit examples/transfer/main.go to set your testnet address and key")
	// set your own private key and address
	// you can get them, for example, from your Phantom wallet
	fromPrivateKey := xc.MustPrivateKey(asset, "...")
	fromPublicKeyStr := "" // only for Cosmos-based chains
	from := xc.MustAddress(asset, "...")
	to := xc.MustAddress(asset, "...")
	amount := xc.MustAmountBlockchain(asset, "0.005")

	// Cosmos example: Injective
	// fromPrivateKey := xc.MustPrivateKey(asset, "...")
	// fromPublicKeyStr := "..."
	// from := xc.MustAddress(asset, "...")
	// to := xc.MustAddress(asset, "inj12s2rcquss27ylmn26cgukczx76t3ep7yk6kgnz")

	// to create a tx, we typically need some input from the blockchain
	// e.g., nonce for Ethereum, recent block for Solana, gas data, ...
	// (network needed)
	client, _ := xc.NewClient(asset)

	input, err := client.FetchTxInput(ctx, from, to)
	if err != nil {
		panic(err)
	}
	if inputWithPublicKey, ok := input.(crosschain.TxInputWithPublicKey); ok {
		inputWithPublicKey.SetPublicKeyFromStr(fromPublicKeyStr)
	}
	fmt.Printf("%+v\n", input)

	// create tx
	// (no network, no private key needed)
	builder, _ := xc.NewTxBuilder(asset)
	tx, err := builder.NewTransfer(from, to, amount, input)
	if err != nil {
		panic(err)
	}
	sighashes, err := tx.Sighashes()
	if err != nil {
		panic(err)
	}
	sighash := sighashes[0]
	fmt.Printf("%+v\n", tx)
	fmt.Printf("signing: %x\n", sighash)

	// sign the tx sighash
	// (private key needed)
	// for Solana, this is equivalent to:
	// fromPrivateKey := base58.Decode("...") // key exported from Phantom
	// signature := ed25519.Sign(ed25519.PrivateKey(fromPrivateKey), []byte(sighash))
	// signer, _ := xc.NewSigner(asset)
	// signature, err := signer.Sign(fromPrivateKey, sighash)
	// if err != nil {
	// 	panic(err)
	// }
	// fmt.Printf("signature: %x\n", signature)

	card, err := readCard()
	if err != nil {
		fmt.Printf("error read card: %x\n", err)
		return "test"
	}

	keyringSigner := NewKeyringSigner(card)
	signature, err := keyringSigner.Sign(sighash)
	if err != nil {
		fmt.Printf("error sign: %x\n", err)
		return "test"
	}
	fmt.Printf("signature: %x\n", signature)

	// sign with keyring card

	// complete the tx by adding its signature
	// (no network, no private key needed)
	err = tx.AddSignatures(signature)
	if err != nil {
		fmt.Sprintf("Error: %s", err)
	}

	// submit the tx, wait a bit, fetch the tx info
	// (network needed)
	fmt.Printf("tx id: %s\n", tx.Hash())
	err = client.SubmitTx(ctx, tx)
	if err != nil {
		fmt.Sprintf("Error: %s", err)
	}
	fmt.Println("Zzz...")
	time.Sleep(20 * time.Second)
	info, err := client.FetchTxInfo(ctx, tx.Hash())
	if err != nil {
		fmt.Sprintf("Error: %s", err)
	}
	fmt.Printf("%+v\n", info)

	return fmt.Sprintf("Hello %s, It's show time!", name)
}
