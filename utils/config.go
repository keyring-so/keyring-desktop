package utils

import (
	"encoding/json"
	"io/ioutil"
	"os"
)

type ChainConfig struct {
	Symbol string `json:"symbol"`
	Path   string `json:"path"`
}

func GetChainConfig() []ChainConfig {
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
