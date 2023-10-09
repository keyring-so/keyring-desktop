package utils

import (
	"encoding/json"
	"errors"
	"keyring-desktop/crosschain"
)

type ChainConfig struct {
	Name     string        `json:"name"`
	Symbol   string        `json:"symbol"`
	Img      string        `json:"img"`
	Path     string        `json:"path"`
	PriceId  string        `json:"priceId"`
	Driver   string        `json:"driver"`
	RpcUrl   string        `json:"rpcUrl"`
	RpcAuth  string        `json:"rpcAuth"` // TODO do not expose auth info
	ChainId  int64         `json:"chainId"`
	Explore  string        `json:"explore"`
	Decimals int32         `json:"decimals"`
	Testnet  bool          `json:"testnet"`
	Disable  bool          `json:"disable"`
	Tokens   []TokenConfig `json:"tokens"`
}

type TokenConfig struct {
	Symbol   string `json:"symbol"`
	Img      string `json:"img"`
	PriceId  string `json:"priceId"`
	Decimals int32  `json:"decimals"`
	Contract string `json:"contract"`
}

func GetChainConfigs(bytes []byte) []ChainConfig {
	var chainConfigs []ChainConfig
	err := json.Unmarshal(bytes, &chainConfigs)
	if err != nil {
		Sugar.Fatal(err)
	}

	return chainConfigs
}

func GetChainConfig(config []ChainConfig, chainName string) *ChainConfig {
	var chainConfig *ChainConfig
	for _, c := range config {
		if c.Name == chainName {
			chainConfig = &c
			break
		}
	}

	return chainConfig
}

func GetTokenConfig(configs []TokenConfig, token string) *TokenConfig {
	var tokenConfig *TokenConfig
	for _, c := range configs {
		if c.Symbol == token {
			tokenConfig = &c
			break
		}
	}

	return tokenConfig
}

func ConvertAssetConfig(configs []ChainConfig, asset string, chainName string) (crosschain.ITask, error) {
	chainConfig := GetChainConfig(configs, chainName)
	if chainConfig == nil {
		return nil, errors.New("chain not found")
	}

	nativeConfig := crosschain.NativeAssetConfig{
		Asset:       chainConfig.Symbol,
		Driver:      chainConfig.Driver,
		URL:         chainConfig.RpcUrl,
		Auth:        chainConfig.RpcAuth,
		Provider:    "infura", // TODO
		ExplorerURL: chainConfig.Explore,
		Decimals:    chainConfig.Decimals,
		ChainID:     chainConfig.ChainId,
		Type:        crosschain.AssetTypeNative,
	}

	// TODO now it use chain symbol, if use chain name, it will cause error since ETH != Ethereum
	if asset == chainConfig.Symbol {
		return &nativeConfig, nil
	}

	tokenConfig := GetTokenConfig(chainConfig.Tokens, asset)
	if tokenConfig == nil {
		return nil, errors.New("token not found")
	}

	tokenAsset := crosschain.AssetConfig{
		Asset:       tokenConfig.Symbol,
		Driver:      chainConfig.Driver,
		URL:         chainConfig.RpcUrl,
		Auth:        chainConfig.RpcAuth,
		Provider:    "infura", // TODO
		ExplorerURL: chainConfig.Explore,
		Decimals:    tokenConfig.Decimals,
		ChainID:     chainConfig.ChainId,
		Type:        crosschain.AssetTypeToken,
		Contract:    tokenConfig.Contract,
	}

	res := crosschain.TokenAssetConfig{
		Asset:             tokenConfig.Symbol,
		Chain:             chainName,
		Decimals:          tokenConfig.Decimals,
		Contract:          tokenConfig.Contract,
		Type:              crosschain.AssetTypeToken,
		AssetConfig:       tokenAsset,
		NativeAssetConfig: &nativeConfig,
	}

	return &res, nil
}
