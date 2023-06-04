package main

import (
	"errors"
	"log"

	keycard "github.com/status-im/keycard-go"
	keycardio "github.com/status-im/keycard-go/io"
	"github.com/status-im/keycard-go/types"
)

var (
	errAppletNotInstalled     = errors.New("applet not installed")
	errCardNotInitialized     = errors.New("card not initialized")
	errCardAlreadyInitialized = errors.New("card already initialized")

	ErrNotInitialized   = errors.New("card not initialized")
	ErrNotInstalled     = errors.New("applet not initialized")
	ErrCashNotInstalled = errors.New("cash applet not initialized")
)

// CardSigner defines a struct with methods to sign some data with card.
type CardSigner struct {
	c types.Channel
}

// NewCardSigner returns a new CardSigner that communicates to Transmitter t.
func NewCardSigner(t keycardio.Transmitter) *CardSigner {
	return &CardSigner{
		c: keycardio.NewNormalChannel(t),
	}
}

// Signing workflow:
//
// keycard-select
// keycard-set-secrets 123456 123456789012 KeycardDefaultPairing
// keycard-pair
//
// keycard-open-secure-channel
// keycard-verify-pin {{ session_pin }}
//
// keycard-derive-key m/1/2/3
// keycard-sign 0000000000000000000000000000000000000000000000000000000000000000
//
// keycard-unpair {{ session_pairing_index }}
func (i *CardSigner) Sign(rawData []byte) ([]byte, error) {
	log.Printf("signing started\n")
	cmdSet := keycard.NewCommandSet(i.c)

	log.Printf("select keycard applet\n")
	err := cmdSet.Select()
	if err != nil {
		log.Printf("Error: %s\n", err)
		return nil, err
	}

	if !cmdSet.ApplicationInfo.Installed {
		log.Printf("installation is not done, error: %s\n", errAppletNotInstalled)
		return nil, errAppletNotInstalled
	}

	if !cmdSet.ApplicationInfo.Initialized {
		log.Printf("initialization is not done, error: %s\n", errCardAlreadyInitialized)
		return nil, errCardAlreadyInitialized
	}

	// TODO change me
	secrets := keycard.NewSecrets("123456", "123456123456", "123456")

	log.Printf("pairing\n")
	err = cmdSet.Pair(secrets.PairingPass())

	if cmdSet.PairingInfo == nil {
		log.Printf("cannot open secure channel without setting pairing info")
		return nil, err
	}

	log.Printf("open keycard secure channel\n")
	if err := cmdSet.OpenSecureChannel(); err != nil {
		log.Printf("open keycard secure channel failed, error: %s\n", err)
		return nil, err
	}

	log.Printf("verify PIN\n")
	// TODO change me
	if err := cmdSet.VerifyPIN("123456"); err != nil {
		log.Printf("verify PIN failed, error: %s\n", err)
		return nil, err
	}

	log.Printf("derive key\n")
	// TODO change me
	if err := cmdSet.DeriveKey("m/44'/60'/0'/0/0"); err != nil {
		log.Printf("derive key failed, error: %s\n", err)
		return nil, err
	}

	log.Printf("sign: %x\n", rawData)
	sig, err := cmdSet.Sign(rawData)
	if err != nil {
		log.Printf("sign failed, error: %s\n", err)
		return nil, err
	}

	ethSig := append(sig.R(), sig.S()...)
	ethSig = append(ethSig, []byte{sig.V()}...)

	log.Printf("unpair index\n")
	err = cmdSet.Unpair(uint8(cmdSet.PairingInfo.Index))
	if err != nil {
		log.Printf("unpair failed, error: %s\n", err)
		return nil, err
	}

	return ethSig, nil
}
