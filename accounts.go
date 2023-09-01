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

	accountId, err := database.QueryCurrentAccount(a.db)
	if err != nil {
		utils.Sugar.Error(err)
		return nil, errors.New("failed to query current account")
	}

	return a.queryAccountName(accountId)
}

func (a *App) GetAllAccounts() ([]AccountInfo, error) {
	allAccounts, err := database.QueryAllAccounts(a.db)
	if err != nil {
		utils.Sugar.Error(err)
		return nil, errors.New("failed to query all accounts")
	}

	var res []AccountInfo
	for _, accountId := range allAccounts {
		accountInfo, err := a.queryAccountName(accountId)
		if err != nil {
			utils.Sugar.Error(err)
			return nil, err
		}
		res = append(res, *accountInfo)
	}

	return res, nil
}

func (a *App) SwitchAccount(accountId string) (*AccountInfo, error) {
	utils.Sugar.Infof("Switch account to: %v", accountId)

	err := database.SaveCurrentAccount(a.db, accountId)
	if err != nil {
		utils.Sugar.Error(err)
		return nil, errors.New("failed to switch account")
	}

	return a.queryAccountName(accountId)
}

func (a *App) queryAccountName(accountId string) (*AccountInfo, error) {
	name, err := database.QueryAccountName(a.db, accountId)
	if err != nil {
		utils.Sugar.Error(err)
		return nil, errors.New("failed to query account name")
	}

	if name == "" {
		name = accountId
	}
	accountInfo := &AccountInfo{
		Id:   accountId,
		Name: name,
	}

	return accountInfo, nil
}
