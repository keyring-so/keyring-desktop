package main

import (
	"errors"
	"keyring-desktop/database"
	"keyring-desktop/utils"
)

func (a *App) GetChainConfigs() []utils.ChainConfig {
	return a.chainConfigs
}

func (a *App) GetChainConfig(chain string) *utils.ChainConfig {
	return utils.GetChainConfig(a.chainConfigs, chain)
}

// return the address of the selected account and chain
func (a *App) GetAddressAndAssets(account string, chain string) (*database.AccountChainAssets, error) {
	utils.Sugar.Infof("Get account address, %s", account)

	if account == "" || chain == "" {
		return nil, errors.New("invalid account or chain")
	}

	assets, err := database.QueryChainAssets(a.db, account, chain)
	if err != nil {
		utils.Sugar.Error(err)
		return nil, errors.New("failed to read database")
	}

	err = database.SaveLastSelectedChain(a.db, account, chain)
	if err != nil {
		utils.Sugar.Error(err)
		return nil, errors.New("failed to update database")
	}

	return assets, nil
}

func (a *App) AddAsset(account string, chain string, asset string) (*database.AccountChainAssets, error) {
	if account == "" || chain == "" || asset == "" {
		return nil, errors.New("invalid account, chain or asset")
	}

	err := database.SaveChainAsset(a.db, account, chain, asset)
	if err != nil {
		utils.Sugar.Error(err)
		return nil, errors.New("failed to update database")
	}

	assets, err := database.QueryChainAssets(a.db, account, chain)
	if err != nil {
		utils.Sugar.Error(err)
		return nil, errors.New("failed to read database")
	}

	return assets, nil
}
