package services

import (
	"keyring-desktop/utils"

	keycard "github.com/status-im/keycard-go"
)

// keycard-select
// keycard-set-secrets 123456 123456789012 KeycardDefaultPairing
// keycard-pair
// keycard-open-secure-channel
// keycard-verify-pin {{ session_pin }}
// keycard-unpair {{ session_pairing_index }}
func (i *CardSigner) Pair(pin string, puk string, code string) error {
	cmdSet := keycard.NewCommandSet(i.c)

	utils.Sugar.Infof("select keycard applet")
	err := cmdSet.Select()
	if err != nil {
		utils.Sugar.Infof("Error: %s", err)
		return err
	}

	if !cmdSet.ApplicationInfo.Installed {
		utils.Sugar.Infof("installation is not done, error: %s", errAppletNotInstalled)
		return errAppletNotInstalled
	}

	if !cmdSet.ApplicationInfo.Initialized {
		utils.Sugar.Infof("initialization is not done, error: %s", errCardAlreadyInitialized)
		return errCardAlreadyInitialized
	}

	secrets := keycard.NewSecrets(pin, puk, code)

	utils.Sugar.Infof("pairing")
	err = cmdSet.Pair(secrets.PairingPass())
	if err != nil {
		utils.Sugar.Fatal(err)
		return err
	}

	if cmdSet.PairingInfo == nil {
		utils.Sugar.Infof("cannot open secure channel without setting pairing info")
		return err
	}

	utils.Sugar.Infof("open keycard secure channel")
	if err := cmdSet.OpenSecureChannel(); err != nil {
		utils.Sugar.Infof("open keycard secure channel failed, error: %s", err)
		return err
	}

	utils.Sugar.Infof("verify PIN")
	if err := cmdSet.VerifyPIN(pin); err != nil {
		utils.Sugar.Infof("verify PIN failed, error: %s", err)
		return err
	}

	utils.Sugar.Infof("unpair index")
	err = cmdSet.Unpair(uint8(cmdSet.PairingInfo.Index))
	if err != nil {
		utils.Sugar.Infof("unpair failed, error: %s", err)
		return err
	}

	return nil
}
