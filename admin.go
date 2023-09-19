package main

import (
	"errors"
	"keyring-desktop/services"
	"keyring-desktop/utils"
)

// Reset card will clear keys, PIN, etc.
func (a *App) Reset(cardId int, pin string) error {
	utils.Sugar.Info("Start to reset card and wallet")

	// connect to card
	keyringCard, err := services.NewKeyringCard()
	if err != nil {
		utils.Sugar.Error(err)
		return errors.New("failed to connect to card")
	}
	defer keyringCard.Release()

	// get pairing info
	pairingInfo, err := a.getPairingInfo(pin, cardId)
	if err != nil {
		utils.Sugar.Error(err)
		return errors.New("failed to get pairing info")
	}

	// reset card
	err = keyringCard.Reset(pairingInfo)
	if err != nil {
		utils.Sugar.Error(err)
		return errors.New("failed to reset card")
	}

	// TODO clear wallet data in database

	return nil
}
