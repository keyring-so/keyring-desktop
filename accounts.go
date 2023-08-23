package main

import (
	"errors"
	"keyring-desktop/database"
	"keyring-desktop/utils"
)

func (a *App) UpdateAccountName(id, name string) error {
	return database.UpdateAccountName(a.db, id, name)
}

// check if there is card paired already
func (a *App) Connect() (*AccountInfo, error) {
	utils.Sugar.Info("Check if there is smart card paired")

	account, err := database.QueryCurrentAccount(a.db)
	if err != nil {
		utils.Sugar.Error(err)
		return nil, errors.New("failed to query current account")
	}

	name, err := database.QueryAccountName(a.db, account)
	if err != nil {
		utils.Sugar.Error(err)
		return nil, errors.New("failed to query account name")
	}

	if name == "" {
		name = account
	}
	accountInfo := &AccountInfo{
		Id:   account,
		Name: name,
	}

	utils.Sugar.Infof("The current account is: %v", accountInfo)

	return accountInfo, nil
}
