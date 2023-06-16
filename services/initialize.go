package services

import (
	"keyring-desktop/utils"

	"github.com/cosmos/go-bip39"
	keycard "github.com/status-im/keycard-go"
)

// keycard-select
// keycard-set-secrets 123456 123456789012 KeycardDefaultPairing
// keycard-init
//
// keycard-pair
// keycard-open-secure-channel
// keycard-verify-pin {{ session_pin }}
//
// keycard-generate-mnemonic {{ words_count }} # happen in app
// keycard-load-seed {{ seed }}
//
// keycard-unpair {{ session_pairing_index }}
func (i *KeyringCard) Initialize(pin string, puk string, code string, checksumSize int) (string, error) {
	cmdSet := keycard.NewCommandSet(i.c)

	utils.Sugar.Info("select keycard applet")
	err := cmdSet.Select()
	if err != nil {
		return "", err
	}

	if !cmdSet.ApplicationInfo.Installed {
		return "", errCardNotInstalled
	}

	secrets := keycard.NewSecrets(pin, puk, code)

	utils.Sugar.Info("init")
	if cmdSet.ApplicationInfo.Initialized {
		return "", errCardAlreadyInitialized
	}
	err = cmdSet.Init(secrets)
	if err != nil {
		return "", err
	}

	utils.Sugar.Info("pairing")
	err = cmdSet.Pair(secrets.PairingPass())
	if err != nil {
		return "", err
	}

	if cmdSet.PairingInfo == nil {
		return "", errNoPairingInfo
	}

	utils.Sugar.Infof("open keycard secure channel")
	if err := cmdSet.OpenSecureChannel(); err != nil {
		return "", err
	}

	utils.Sugar.Infof("verify PIN")
	if err := cmdSet.VerifyPIN(pin); err != nil {
		return "", err
	}

	// utils.Sugar.Info("generate mnemonic")
	// indexes, err := cmdSet.GenerateMnemonic(checksumSize)
	// if err != nil {
	// 	return err
	// }

	utils.Sugar.Info("load key from seed")
	entropy, _ := bip39.NewEntropy(32 * checksumSize)
	mnemonic, _ := bip39.NewMnemonic(entropy)
	seed := bip39.NewSeed(mnemonic, "") // TODO should user input passphrase?

	_, err = cmdSet.LoadSeed(seed)
	if err != nil {
		return "", err
	}

	utils.Sugar.Infof("unpair index")
	err = cmdSet.Unpair(uint8(cmdSet.PairingInfo.Index))
	if err != nil {
		return "", err
	}

	return mnemonic, nil
}
