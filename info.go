package main

import (
	"keyring-desktop/utils"
)

func (a *App) GetChainConfigs() []utils.ChainConfig {
	return a.chainConfigs
}
