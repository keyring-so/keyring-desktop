package oracle

import (
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"keyring-desktop/utils"
	"net/http"
)

type BlockscoutTxHistoryResponse struct {
	Items []BlockscoutTxHistoryItem `json:"items"`
}

type BlockscoutTxHistoryItem struct {
	Timestamp string `json:"timestamp"`
	Status    string `json:"status"`
	Hash      string `json:"hash"`
	Value     string `json:"value"`

	From struct {
		Hash string `json:"hash"`
	} `json:"from"`
	To struct {
		Hash string `json:"hash"`
	} `json:"to"`

	Fee struct {
		Value string `json:"value"`
	} `json:"fee"`
}

type BlockscoutTokenTransferResponse struct {
	Items []BlockscoutTokenTransferItem `json:"items"`
}

type BlockscoutTokenTransferItem struct {
	Timestamp string `json:"timestamp"`
	TxHash    string `json:"tx_hash"`

	Token struct {
		Address string `json:"address"`
		Symbol  string `json:"symbol"`
		Type    string `json:"type"`
	}
	Total struct {
		Decimals string `json:"decimals"`
		Value    string `json:"value"`
	} `json:"total"`

	From struct {
		Hash string `json:"hash"`
	} `json:"from"`
	To struct {
		Hash string `json:"hash"`
	} `json:"to"`
}

func GetTxHistoryFromBlockscout(config *utils.ChainConfig, address string) (*BlockscoutTxHistoryResponse, error) {
	url := fmt.Sprintf("%s/addresses/%s/transactions", config.TxHistoryUrl, address)

	resp, err := http.Get(url)
	if err != nil {
		return nil, err
	}

	if resp.StatusCode != 200 {
		utils.Sugar.Infof("GetTxHistoryFromBlockscout response status: %v", resp.StatusCode)
		return nil, errors.New("failed to get tx history from blockscout, response status code is not 200")
	}
	defer resp.Body.Close()

	resBytes, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}
	resParsed := BlockscoutTxHistoryResponse{}
	json.Unmarshal(resBytes, &resParsed)

	return &resParsed, nil
}

func GetTokenTransfersFromBlockscout(config utils.ChainConfig, address string) (*BlockscoutTokenTransferResponse, error) {
	url := fmt.Sprintf("%s/addresses/%s/token-transfers", config.TxHistoryUrl, address)

	resp, err := http.Get(url)
	if err != nil {
		return nil, err
	}

	if resp.StatusCode != 200 {
		utils.Sugar.Infof("GetTokenTransfersFromBlockscout response status: %v", resp.StatusCode)
		return nil, errors.New("failed to get token transfers from blockscout, response status code is not 200")
	}
	defer resp.Body.Close()

	resBytes, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}
	resParsed := BlockscoutTokenTransferResponse{}
	json.Unmarshal(resBytes, &resParsed)

	return &resParsed, nil
}
