package utils

import (
	"encoding/json"
)

type ChainConfig struct {
	Symbol  string        `json:"symbol"`
	Name    string        `json:"name"`
	Path    string        `json:"path"`
	PriceId string        `json:"priceId"`
	Tokens  []TokenConfig `json:"tokens"`
}

type TokenConfig struct {
	Symbol  string `json:"symbol"`
	PriceId string `json:"priceId"`
}

func GetChainConfigs(bytes []byte) []ChainConfig {
	var chainConfigs []ChainConfig
	err := json.Unmarshal(bytes, &chainConfigs)
	if err != nil {
		Sugar.Fatal(err)
	}

	return chainConfigs
}

func GetChainConfig(config []ChainConfig, chain string) *ChainConfig {
	var chainConfig *ChainConfig
	for _, c := range config {
		if c.Symbol == chain {
			chainConfig = &c
			break
		}
	}

	return chainConfig
}
