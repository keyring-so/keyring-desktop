package services

import (
	"errors"
	"keyring-desktop/utils"

	keycard "github.com/status-im/keycard-go"
	keycardio "github.com/status-im/keycard-go/io"
	"github.com/status-im/keycard-go/types"
)

var (
	errAppletNotInstalled     = errors.New("applet not installed")
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
func (i *CardSigner) Sign(
	rawData []byte,
	config *utils.ChainConfig,
	pin string,
	puk string,
	pairingCode string,
) ([]byte, error) {
	utils.Sugar.Infof("signing started")
	cmdSet := keycard.NewCommandSet(i.c)

	utils.Sugar.Infof("select keycard applet")
	err := cmdSet.Select()
	if err != nil {
		utils.Sugar.Infof("Error: %s", err)
		return nil, err
	}

	if !cmdSet.ApplicationInfo.Installed {
		utils.Sugar.Infof("installation is not done, error: %s", errAppletNotInstalled)
		return nil, errAppletNotInstalled
	}

	if !cmdSet.ApplicationInfo.Initialized {
		utils.Sugar.Infof("initialization is not done, error: %s", errCardAlreadyInitialized)
		return nil, errCardAlreadyInitialized
	}

	secrets := keycard.NewSecrets(pin, puk, pairingCode)

	utils.Sugar.Infof("pairing")
	err = cmdSet.Pair(secrets.PairingPass())
	if err != nil {
		utils.Sugar.Fatal(err)
		return nil, err
	}
	if cmdSet.PairingInfo == nil {
		utils.Sugar.Infof("cannot open secure channel without setting pairing info")
		return nil, errors.New("failed to pair")
	}

	utils.Sugar.Infof("open keycard secure channel")
	if err := cmdSet.OpenSecureChannel(); err != nil {
		utils.Sugar.Infof("open keycard secure channel failed, error: %s", err)
		return nil, err
	}

	utils.Sugar.Infof("verify PIN")
	if err := cmdSet.VerifyPIN(pin); err != nil {
		utils.Sugar.Infof("verify PIN failed, error: %s", err)
		return nil, err
	}

	utils.Sugar.Infof("derive key")
	if err := cmdSet.DeriveKey(config.Path); err != nil {
		utils.Sugar.Infof("derive key failed, error: %s", err)
		return nil, err
	}

	utils.Sugar.Infof("sign: %x", rawData)
	sig, err := cmdSet.Sign(rawData)
	if err != nil {
		utils.Sugar.Infof("sign failed, error: %s", err)
		return nil, err
	}

	ethSig := append(sig.R(), sig.S()...)
	ethSig = append(ethSig, []byte{sig.V()}...)

	utils.Sugar.Infof("unpair index")
	err = cmdSet.Unpair(uint8(cmdSet.PairingInfo.Index))
	if err != nil {
		utils.Sugar.Infof("unpair failed, error: %s", err)
		return nil, err
	}

	return ethSig, nil
}
