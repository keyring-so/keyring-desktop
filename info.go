package main

import (
	"bytes"
	"context"
	"errors"
	"keyring-desktop/database"
	"keyring-desktop/oracle"
	"keyring-desktop/utils"

	"github.com/jumpcrypto/crosschain/factory"
	"github.com/spf13/viper"
)

func (a *App) SetNetwork(network string) error {
	var config string
	if network == utils.Testnet {
		database.SaveNetwork(a.db, utils.Testnet)
		config = "crosschain-testnet.yaml"
	} else {
		database.SaveNetwork(a.db, utils.Mainnet)
		config = "crosschain-mainnet.yaml"
	}

	crosschainConfig, err := resources.ReadFile("resources/" + config)
	if err != nil {
		utils.Sugar.Error(err)
		return err
	}
	a.crosschainConfig = crosschainConfig

	return nil
}

func (a *App) GetNetwork() (string, error) {
	network, err := database.QueryNetwork(a.db)
	if err != nil {
		utils.Sugar.Error(err)
		return "", errors.New("failed to read database")
	}
	return network, nil
}

func (a *App) GetChainConfigs() []utils.ChainConfig {
	return a.chainConfigs
}

func (a *App) GetChainConfig(chain string) *utils.ChainConfig {
	return utils.GetChainConfig(a.chainConfigs, chain)
}

// return the address of the selected account and chain
func (a *App) GetAddressAndAssets(account string, chain string) (*ChainAssets, error) {
	utils.Sugar.Infof("Get account address, %s", account)

	if account == "" || chain == "" {
		return nil, errors.New("invalid account or chain")
	}

	chainData, err := database.QueryChainAssets(a.db, account, chain)
	if err != nil {
		utils.Sugar.Error(err)
		return nil, errors.New("failed to read database")
	}

	v := viper.New()
	v.SetConfigType("yaml")
	err = v.ReadConfig(bytes.NewReader(a.crosschainConfig))
	if err != nil {
		utils.Sugar.Error(err)
		return nil, errors.New("failed to read crosschain configurate")
	}
	xc := factory.NewDefaultFactoryWithConfig(v.GetStringMap("crosschain"))
	ctx := context.Background()
	var assets []AssetInfo
	for _, asset := range chainData.Assets {
		balance, err := utils.GetAssetBalance(ctx, xc, asset, chain, chainData.Address)
		if err != nil {
			utils.Sugar.Error(err)
			return nil, errors.New("failed to read balance of asset" + asset)
		}

		price, err := oracle.GetPrice(asset, a.chainConfigs)
		if err != nil {
			utils.Sugar.Error(err)
		}

		assetInfo := AssetInfo{
			Name:    asset,
			Balance: balance.String(),
			Price:   price,
		}
		assets = append(assets, assetInfo)
	}
	chainDataRes := ChainAssets{
		Address: chainData.Address,
		Assets:  assets,
	}

	err = database.SaveLastSelectedChain(a.db, account, chain)
	if err != nil {
		utils.Sugar.Error(err)
		return nil, errors.New("failed to update database")
	}

	return &chainDataRes, nil
}

func (a *App) AddAsset(account string, chain string, asset string) (*ChainAssets, error) {
	if account == "" || chain == "" || asset == "" {
		return nil, errors.New("invalid account, chain or asset")
	}

	err := database.SaveChainAsset(a.db, account, chain, asset)
	if err != nil {
		utils.Sugar.Error(err)
		return nil, errors.New("failed to update database")
	}

	chainData, err := database.QueryChainAssets(a.db, account, chain)
	if err != nil {
		utils.Sugar.Error(err)
		return nil, errors.New("failed to read database")
	}

	v := viper.New()
	v.SetConfigType("yaml")
	err = v.ReadConfig(bytes.NewReader(a.crosschainConfig))
	if err != nil {
		utils.Sugar.Error(err)
		return nil, errors.New("failed to read crosschain configurate")
	}
	xc := factory.NewDefaultFactoryWithConfig(v.GetStringMap("crosschain"))
	ctx := context.Background()
	var assets []AssetInfo
	for _, asset := range chainData.Assets {
		balance, err := utils.GetAssetBalance(ctx, xc, asset, chain, chainData.Address)
		if err != nil {
			utils.Sugar.Error(err)
			return nil, errors.New("failed to read balance of asset" + asset)
		}

		price, err := oracle.GetPrice(asset, a.chainConfigs)
		if err != nil {
			utils.Sugar.Error(err)
		}

		assetInfo := AssetInfo{
			Name:    asset,
			Balance: balance.String(),
			Price:   price,
		}
		assets = append(assets, assetInfo)
	}
	chainDataRes := ChainAssets{
		Address: chainData.Address,
		Assets:  assets,
	}

	return &chainDataRes, nil
}
