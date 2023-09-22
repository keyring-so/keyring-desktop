package main

import (
	"errors"
	"keyring-desktop/database"
	"keyring-desktop/services"
	"keyring-desktop/utils"
)

// Reset card will clear keys, PIN, etc on card, and app data in database
func (a *App) ResetCard(cardId int, pin string) error {
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

	err = database.ClearAccounts(a.sqlite, cardId)
	if err != nil {
		utils.Sugar.Error(err)
		return errors.New("failed to clear accounts")
	}

	return nil
}

// clear data in database
func (a *App) ClearData(cardId int, pin string) error {
	utils.Sugar.Info("Start to clear data for the card")

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

	// unpair the card
	err = keyringCard.Unpair(pin, pairingInfo)
	if err != nil {
		utils.Sugar.Error(err)
		return errors.New("failed to reset card")
	}

	err = database.ClearAccounts(a.sqlite, cardId)
	if err != nil {
		utils.Sugar.Error(err)
		return errors.New("failed to clear accounts")
	}

	return nil
}
