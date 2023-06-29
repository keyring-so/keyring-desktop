package utils

import (
	"encoding/json"
	"io/ioutil"
	"os"
)

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
	file, err := os.Open(ChainRegistry)
	if err != nil {
		Sugar.Fatal(err)
	}
	defer file.Close()

	bytes, err := ioutil.ReadAll(file)
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
