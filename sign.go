package main

import (
	"errors"
	"fmt"

	"github.com/ebfe/scard"
	"github.com/ethereum/go-ethereum/crypto"
	"github.com/ethereum/go-ethereum/log"

	keycard "github.com/status-im/keycard-go"
	keycardio "github.com/status-im/keycard-go/io"
	"github.com/status-im/keycard-go/types"
)

// keycard-select
// # setting pin, puk, pairing password
// keycard-set-secrets 123456 123456789012 KeycardDefaultPairing
// # or generate random secrets
// # keycard-set-secrets
// keycard-init

var (
	logger                    = log.New("package", "keycard-cli")
	errAppletNotInstalled     = errors.New("applet not installed")
	errCardNotInitialized     = errors.New("card not initialized")
	errCardAlreadyInitialized = errors.New("card already initialized")

	ErrNotInitialized   = errors.New("card not initialized")
	ErrNotInstalled     = errors.New("applet not initialized")
	ErrCashNotInstalled = errors.New("cash applet not initialized")
)

// Initializer defines a struct with methods to install applets and initialize a card.
type KeyringSigner struct {
	c types.Channel
}

// NewInitializer returns a new Initializer that communicates to Transmitter t.
func NewKeyringSigner(t keycardio.Transmitter) *KeyringSigner {
	return &KeyringSigner{
		c: keycardio.NewNormalChannel(t),
	}
}

// keycard-select
// keycard-set-secrets 123456 123456789012 KeycardDefaultPairing
// keycard-pair

// keycard-open-secure-channel
// keycard-verify-pin {{ session_pin }}

// keycard-derive-key m/1/2/3
// keycard-sign 0000000000000000000000000000000000000000000000000000000000000000

// keycard-unpair {{ session_pairing_index }}

func readCard() (*scard.Card, error) {
	fmt.Printf("start read card")
	fmt.Printf("start read card")
	ctx, err := scard.EstablishContext()
	if err != nil {
		return nil, err
	}
	// defer func() {
	// 	if err := ctx.Release(); err != nil {
	// 		fmt.Printf("error releasing context", "error", err)
	// 	}
	// }()

	readers, err := ctx.ListReaders()
	if err != nil {
		return nil, err
	}

	fmt.Printf("waiting for a card")
	if len(readers) == 0 {
		return nil, err
	}

	index, err := waitForCard(ctx, readers)
	if err != nil {
		return nil, err
	}

	fmt.Printf("card found\n", index)
	reader := readers[index]

	fmt.Printf("using reader\n", reader)
	fmt.Printf("connecting to card\n", reader)
	card, err := ctx.Connect(reader, scard.ShareShared, scard.ProtocolAny)
	if err != nil {
		return nil, err
	}
	// defer func() {
	// 	if err := card.Disconnect(scard.ResetCard); err != nil {
	// 		fmt.Printf("error disconnecting card\n", err)
	// 	}
	// }()

	status, err := card.Status()
	if err != nil {
		return nil, err
	}

	switch status.ActiveProtocol {
	case scard.ProtocolT0:
		fmt.Printf("card protocol", "T", "0")
	case scard.ProtocolT1:
		fmt.Printf("card protocol", "T", "1")
	default:
		fmt.Printf("card protocol", "T", "unknown")
	}

	return card, nil
}

func waitForCard(ctx *scard.Context, readers []string) (int, error) {
	rs := make([]scard.ReaderState, len(readers))

	for i := range rs {
		rs[i].Reader = readers[i]
		rs[i].CurrentState = scard.StateUnaware
	}

	for {
		for i := range rs {
			if rs[i].EventState&scard.StatePresent != 0 {
				return i, nil
			}

			rs[i].CurrentState = rs[i].EventState
		}

		err := ctx.GetStatusChange(rs, -1)
		if err != nil {
			return -1, err
		}
	}
}

func (i *KeyringSigner) Sign(rawData []byte) ([]byte, error) {
	fmt.Printf("initialization started\n")
	cmdSet := keycard.NewCommandSet(i.c)

	fmt.Printf("select keycard applet\n")
	err := cmdSet.Select()
	if err != nil {
		fmt.Printf("select failed\n", err)
		return nil, err
	}

	if !cmdSet.ApplicationInfo.Installed {
		fmt.Printf("installation is not done\n", "error", errAppletNotInstalled)
		return nil, errAppletNotInstalled
	}

	if !cmdSet.ApplicationInfo.Initialized {
		fmt.Printf("initialization is not done\n", "error", errCardAlreadyInitialized)
		return nil, errCardAlreadyInitialized
	}

	// TODO change me
	secrets := keycard.NewSecrets("123456", "123456123456", "123456")

	fmt.Printf("pair")
	err = cmdSet.Pair(secrets.PairingPass())

	if cmdSet.PairingInfo == nil {
		log.Error("cannot open secure channel without setting pairing info")
		return nil, err
	}

	fmt.Printf("open keycard secure channel\n")
	if err := cmdSet.OpenSecureChannel(); err != nil {
		fmt.Printf("open keycard secure channel failed", "error", err)
		return nil, err
	}

	fmt.Printf("verify PIN")
	// TODO change me
	if err := cmdSet.VerifyPIN("123456"); err != nil {
		fmt.Printf("verify PIN failed", "error", err)
		return nil, err
	}

	fmt.Printf("derive key")
	// TODO change me
	if err := cmdSet.DeriveKey("m/44'/60'/0'/0/0"); err != nil {
		fmt.Printf("derive key failed", "error", err)
		return nil, err
	}

	fmt.Printf("sign\n", rawData)
	sig, err := cmdSet.Sign(rawData)
	if err != nil {
		fmt.Printf("sign failed\n", "error", err)
		return nil, err
	}

	ethSig := append(sig.R(), sig.S()...)
	ethSig = append(ethSig, []byte{sig.V() + 27}...)

	ecdsaPubKey, err := crypto.UnmarshalPubkey(sig.PubKey())
	if err != nil {
		fmt.Printf("pub key error", err)
	}

	address := crypto.PubkeyToAddress(*ecdsaPubKey)

	fmt.Printf("SIGNATURE R: %x\n", sig.R())
	fmt.Printf("SIGNATURE S: %x\n", sig.S())
	fmt.Printf("SIGNATURE V: %x\n", sig.V())
	fmt.Printf("ETH SIGNATURE: 0x%x\n", ethSig)
	fmt.Printf("PUBLIC KEY: 0x%x\n", sig.PubKey())
	fmt.Printf("ADDRESS: %s\n\n", address.String())

	fmt.Printf("unpair index\n")
	err = cmdSet.Unpair(uint8(cmdSet.PairingInfo.Index))
	if err != nil {
		fmt.Printf("unpair failed", "error", err)
		return nil, err
	}

	return ethSig, nil
}
