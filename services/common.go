package services

import (
	"keyring-desktop/utils"

	keycard "github.com/status-im/keycard-go"
	"github.com/status-im/keycard-go/types"
)

func selectAndOpen(cmdSet *keycard.CommandSet, pairingInfo *types.PairingInfo) error {
	utils.Sugar.Infof("select keycard applet")
	err := cmdSet.Select()
	if err != nil {
		utils.Sugar.Infof("Error: %s", err)
		return err
	}

	if !cmdSet.ApplicationInfo.Installed {
		utils.Sugar.Infof("installation is not done, error: %s", errCardNotInstalled)
		return errCardNotInstalled
	}

	if !cmdSet.ApplicationInfo.Initialized {
		utils.Sugar.Error(errCardNotInitialized)
		return errCardNotInitialized
	}

	utils.Sugar.Info("set pairing info")
	cmdSet.PairingInfo = pairingInfo
	if cmdSet.PairingInfo == nil {
		utils.Sugar.Infof("cannot open secure channel without setting pairing info")
		return errNoPairingInfo
	}

	utils.Sugar.Infof("open keycard secure channel")
	if err := cmdSet.OpenSecureChannel(); err != nil {
		utils.Sugar.Infof("open keycard secure channel failed, error: %s", err)
		return err
	}

	return nil
}