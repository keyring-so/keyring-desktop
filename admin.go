package main

import (
	"errors"
	"keyring-desktop/services"
	"keyring-desktop/utils"
)

// Now to remove the key from the card, we need to reinstall the applet
func (a *App) Reset(account, pin string) error {
	utils.Sugar.Info("Start to reset card and wallet")

	// connect to card
	keyringCard, err := services.NewKeyringCard()
	if err != nil {
		utils.Sugar.Error(err)
		return errors.New("failed to connect to card")
	}
	defer keyringCard.Release()

	// get pairing info
	pairingInfo, err := a.getPairingInfo(pin, account)
	if err != nil {
		utils.Sugar.Error(err)
		return errors.New("failed to get pairing info")
	}

	// install card
	err = keyringCard.Reset(pairingInfo)
	if err != nil {
		utils.Sugar.Error(err)
		return errors.New("failed to reset card")
	}

	// TODO clear wallet data in database

	return nil
}
