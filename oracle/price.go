package oracle

import (
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"keyring-desktop/utils"
	"net/http"
)

type Price struct {
	Usd float32 `json:"usd"`
}

// TODO get all the assets price together with comma split
func GetPrice(asset string, config []utils.ChainConfig) (float32, error) {
	var id string
	for _, c := range config {
		if c.Symbol == asset {
			id = c.PriceId
			break
		}

		for _, t := range c.Tokens {
			if t.Symbol == asset {
				id = t.PriceId
				break
			}
		}

		if id != "" {
			break
		}
	}
	url := fmt.Sprintf("https://api.coingecko.com/api/v3/simple/price?ids=%s&vs_currencies=%s", id, "usd")

	resp, err := http.Get(url)
	if err != nil {
		return 0, err
	}

	if resp.StatusCode != 200 {
		utils.Sugar.Infof("Response status: %v", resp.StatusCode)
		return 0, errors.New("failed to get price, response status code is not 200")
	}
	defer resp.Body.Close()

	resBytes, err := io.ReadAll(resp.Body)
	if err != nil {
		return 0, err
	}
	resMap := map[string]Price{}
	json.Unmarshal(resBytes, &resMap)

	return resMap[id].Usd, nil
}
