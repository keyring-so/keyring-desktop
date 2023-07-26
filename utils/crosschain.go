package utils

import (
	"context"

	"github.com/jumpcrypto/crosschain"
	"github.com/jumpcrypto/crosschain/factory"
)

func GetAssetBalance(ctx context.Context, xc *factory.Factory, asset string, chain string, address string) (*crosschain.AmountHumanReadable, error) {
	token, err := xc.GetAssetConfig(asset, chain)
	if err != nil {
		return nil, err
	}
	client, err := xc.NewClient(token)
	if err != nil {
		return nil, err
	}
	addressRes := xc.MustAddress(token, address)
	balance, err := client.(crosschain.ClientBalance).FetchBalance(ctx, addressRes)
	if err != nil {
		return nil, err
	}
	humanBalance, err := xc.ConvertAmountToHuman(token, balance)
	if err != nil {
		return nil, err
	}

	return &humanBalance, nil
}
