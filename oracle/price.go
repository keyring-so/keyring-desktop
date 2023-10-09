package oracle

import (
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"keyring-desktop/database"
	"keyring-desktop/utils"
	"net/http"
	"strings"
)

type Price struct {
	Usd float32 `json:"usd"`
}

func GetPrice(assets []database.Asset, config utils.ChainConfig) (map[string]Price, error) {
	ids := make([]string, len(assets)+1)
	priceIdsMap := map[string]string{}

	for i, asset := range assets {
		var id string
		for _, t := range config.Tokens {
			if t.Symbol == asset.TokenSymbol {
				id = t.PriceId
				ids[i] = id
				priceIdsMap[id] = asset.TokenSymbol
				break
			}
		}

		if id != "" {
			break
		}
	}

	ids[len(assets)] = config.PriceId
	priceIdsMap[config.PriceId] = config.Symbol

	url := fmt.Sprintf("https://api.coingecko.com/api/v3/simple/price?ids=%s&vs_currencies=%s", strings.Join(ids, ","), "usd")

	resp, err := http.Get(url)
	if err != nil {
		return nil, err
	}

	if resp.StatusCode != 200 {
		utils.Sugar.Infof("Response status: %v", resp.StatusCode)
		return nil, errors.New("failed to get price, response status code is not 200")
	}
	defer resp.Body.Close()

	resBytes, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}
	resMap := map[string]Price{}
	json.Unmarshal(resBytes, &resMap)

	for k, v := range resMap {
		delete(resMap, k)
		resMap[priceIdsMap[k]] = v
	}
	return resMap, nil
}
