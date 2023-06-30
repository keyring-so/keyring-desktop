package utils

import (
	"embed"
	"encoding/json"
)

var RegistryFile embed.FS

type ChainConfig struct {
	Symbol string        `json:"symbol"`
	Name   string        `json:"name"`
	Path   string        `json:"path"`
	Tokens []TokenConfig `json:"tokens"`
}

type TokenConfig struct {
	Symbol string `json:"symbol"`
}

func GetChainConfigs() []ChainConfig {
	// read chain configuration
	bytes, err := RegistryFile.ReadFile(ChainRegistry)
	if err != nil {
		Sugar.Fatal(err)
	}

	if err != nil {
		Sugar.Fatal(err)
	}

	var chainConfigs []ChainConfig
	err = json.Unmarshal(bytes, &chainConfigs)
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
