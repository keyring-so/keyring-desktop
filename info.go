package main

import (
	"context"
	"errors"
	"keyring-desktop/database"
	"keyring-desktop/oracle"
	"keyring-desktop/utils"
)

func (a *App) EnableTestnet(flag bool) error {
	config, err := utils.ReadAppConfig()
	if err != nil {
		utils.Sugar.Error(err)
		return errors.New("failed to read app config")
	}

	config.ShowTestnet = flag

	err = utils.WriteAppConfig(*config)
	if err != nil {
		utils.Sugar.Error(err)
		return errors.New("failed to write app config")
	}

	return nil
}

func (a *App) IsTestnetEnabled() (bool, error) {
	config, err := utils.ReadAppConfig()
	if err != nil {
		utils.Sugar.Error(err)
		return false, errors.New("failed to read app config")
	}
	return config.ShowTestnet, nil
}

func (a *App) GetChainConfigs() []utils.ChainConfig {
	return a.chainConfigs
}

func (a *App) GetChainConfig(chain string) *utils.ChainConfig {
	return utils.GetChainConfig(a.chainConfigs, chain)
}

func (a *App) AddCustomToken(cardId int, address, chain, contract, priceId string) (*ChainAssets, error) {
	chainConfig := utils.GetChainConfig(a.chainConfigs, chain)
	if chainConfig == nil {
		return nil, errors.New("chain not found")
	}

	tokenConfig := utils.GetTokenConfig(chainConfig.Tokens, contract)
	if tokenConfig != nil {
		return nil, errors.New("token is already existed, please add asset")
	}

	ctx := context.Background()
	metadata, err := utils.GetContract(ctx, chainConfig, contract, chain)
	utils.Sugar.Info("metadata: ", metadata)
	if err != nil {
		utils.Sugar.Error(err)
		return nil, errors.New("failed to read metadata of contract: " + contract)
	}

	customTokenConfig := utils.TokenConfig{
		Contract: contract,
		Symbol:   metadata.Symbol,
		Img:      "",
		Decimals: metadata.Decimals,
		PriceId:  priceId,
	}

	err = database.SaveTokenConfig(a.sqlite, chain, customTokenConfig, false)
	if err != nil {
		utils.Sugar.Error(err)
		return nil, errors.New("failed to save token config")
	}

	a.mergeTokenConfig()

	return a.AddAsset(cardId, chain, address, metadata.Symbol, contract)
}

func (a *App) GetCredentials(cardId int) (*CardCredential, error) {
	card, err := database.QueryCard(a.sqlite, cardId)
	if err != nil {
		utils.Sugar.Error(err)
		return nil, errors.New("failed to query current card")
	}

	res := CardCredential{
		Puk:  card.Puk,
		Code: card.PairingCode,
	}
	return &res, nil
}

func (a *App) GetWalletConnectProjectId() (string, error) {
	return a.initConfig.WalletConnectProjectId, nil
}

// return the address of the selected account and chain
func (a *App) GetAddressAndAssets(cardId int, chain string) (*ChainAssets, error) {
	utils.Sugar.Infof("Get account address, %s with chain %s", cardId, chain)

	if cardId < 0 || chain == "" {
		return nil, errors.New("invalid card or chain")
	}

	chainAccount, err := database.QueryChainAccount(a.sqlite, cardId, chain)
	if err != nil {
		utils.Sugar.Error(err)
		return nil, errors.New("failed to query current account")
	}
	utils.Sugar.Infof("chain account: %v", chainAccount)

	assets, err := database.QueryAssets(a.sqlite, cardId, chain, chainAccount.Address)
	if err != nil {
		utils.Sugar.Error(err)
		return nil, errors.New("failed to read database")
	}

	if sa, _ := chainAccount.SelectedAccount.Value(); sa == false {
		err = database.UpdateSelectedAccount(a.sqlite, cardId, chain)
		if err != nil {
			utils.Sugar.Error(err)
			return nil, errors.New("failed to update selected account")
		}
	}

	chainConfig := utils.GetChainConfig(a.chainConfigs, chain)
	if chainConfig == nil {
		return nil, errors.New("chain not found")
	}

	assetsInfo := []AssetInfo{}
	for _, asset := range assets {
		tokenConfig := utils.GetTokenConfig(chainConfig.Tokens, asset.ContractAddress)
		if tokenConfig == nil {
			return nil, errors.New("token config not found")
		}
		info := AssetInfo{
			ContractAddress: tokenConfig.Contract,
			Symbol:          tokenConfig.Symbol,
			Img:             tokenConfig.Img,
			Balance:         nil,
			Price:           nil,
		}
		assetsInfo = append(assetsInfo, info)
	}
	chainDataRes := ChainAssets{
		Address: chainAccount.Address,
		Symbol:  chainConfig.Symbol,
		Img:     chainConfig.Img,
		Balance: nil,
		Price:   nil,
		Assets:  assetsInfo,
	}

	return &chainDataRes, nil
}

func (a *App) GetAssetPrices(cardId int, chain string) (*ChainAssets, error) {
	utils.Sugar.Infof("Get asset prices, %s", cardId)

	if cardId < 0 || chain == "" {
		return nil, errors.New("invalid card or chain")
	}

	return a.getChainAssets(cardId, chain)
}

func (a *App) AddAsset(cardId int, chain, address, tokenSymbol, contract string) (*ChainAssets, error) {
	if cardId < 0 || chain == "" || address == "" || tokenSymbol == "" {
		return nil, errors.New("invalid card, chain or asset")
	}

	err := database.SaveAsset(a.sqlite, cardId, chain, address, tokenSymbol, contract)
	if err != nil {
		utils.Sugar.Error(err)
		return nil, errors.New("failed to save asset to database")
	}

	return a.getChainAssets(cardId, chain)
}

func (a *App) RemoveAsset(cardId int, chain, address, asset, contract string) error {
	if cardId < 0 || chain == "" || address == "" || asset == "" || chain == asset {
		return errors.New("invalid card, chain or asset")
	}

	err := database.RemoveAsset(a.sqlite, cardId, chain, address, asset, contract)
	if err != nil {
		utils.Sugar.Error(err)
		return errors.New("failed to remove asset from database")
	}

	return nil

}

func (a *App) getChainAssets(cardId int, chainName string) (*ChainAssets, error) {
	selectedAccount, err := database.QueryChainAccount(a.sqlite, cardId, chainName)
	if err != nil {
		utils.Sugar.Error(err)
		return nil, errors.New("failed to query current account")
	}
	assets, err := database.QueryAssets(a.sqlite, cardId, chainName, selectedAccount.Address)
	if err != nil {
		utils.Sugar.Error(err)
		return nil, errors.New("failed to read database")
	}

	chainConfig := utils.GetChainConfig(a.chainConfigs, chainName)
	if chainConfig == nil {
		return nil, errors.New("chain not found")
	}

	prices, err := oracle.GetPrice(assets, *chainConfig)
	if err != nil {
		utils.Sugar.Error(err)
	}

	ctx := context.Background()
	assetsInfo := []AssetInfo{}
	for _, asset := range assets {
		tokenConfig := utils.GetTokenConfig(chainConfig.Tokens, asset.ContractAddress)

		balance, err := utils.GetAssetBalance(ctx, chainConfig, asset.ContractAddress, chainName, selectedAccount.Address)
		utils.Sugar.Info("balacne: ", balance)
		if err != nil {
			utils.Sugar.Error(err)
			return nil, errors.New("failed to read balance of asset: " + asset.TokenSymbol)
		}

		price := prices[asset.TokenSymbol].Usd

		bals := balance.String()
		info := AssetInfo{
			ContractAddress: tokenConfig.Contract,
			Symbol:          tokenConfig.Symbol,
			Img:             tokenConfig.Img,
			Balance:         &bals,
			Price:           &price,
		}
		assetsInfo = append(assetsInfo, info)
	}

	balance, err := utils.GetAssetBalance(ctx, chainConfig, "", chainName, selectedAccount.Address)
	if err != nil {
		utils.Sugar.Error(err)
		return nil, errors.New("failed to read balance of asset: " + chainConfig.Symbol)
	}

	price := prices[chainConfig.Symbol].Usd

	bals := balance.String()

	chainDataRes := ChainAssets{
		Address: selectedAccount.Address,
		Symbol:  chainConfig.Symbol,
		Img:     chainConfig.Img,
		Balance: &bals,
		Price:   &price,
		Assets:  assetsInfo,
	}

	return &chainDataRes, nil
}
