package utils

import (
	"context"

	"keyring-desktop/crosschain"

	"keyring-desktop/crosschain/factory"
)

func GetAssetBalance(ctx context.Context, configs []ChainConfig, contract string, chain string, address string) (*crosschain.AmountHumanReadable, error) {
	token, err := ConvertAssetConfig(configs, contract, chain)
	if err != nil {
		return nil, err
	}
	client, err := factory.NewClient(token)
	if err != nil {
		return nil, err
	}
	addressRes := crosschain.Address(address)
	balance, err := client.(crosschain.ClientBalance).FetchBalance(ctx, addressRes)
	if err != nil {
		return nil, err
	}
	humanBalance, err := factory.ConvertAmountToHuman(token, balance)
	if err != nil {
		return nil, err
	}

	return &humanBalance, nil
}
