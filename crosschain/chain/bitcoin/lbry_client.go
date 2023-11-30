package bitcoin

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io/ioutil"
	xc "keyring-desktop/crosschain"
	"net/http"
	"net/url"

	"github.com/btcsuite/btcd/btcjson"
	"github.com/shopspring/decimal"
	log "github.com/sirupsen/logrus"
)

type LbryClient struct {
	http            http.Client
	Asset           *xc.AssetConfig
	opts            ClientOptions
	EstimateGasFunc xc.EstimateGasFunc
}

type ChainQueryBalance struct {
	Success bool          `json:"success"`
	Error   string        `json:"error,omitempty"`
	Data    []BalanceData `json:"data"`
}

type BalanceData struct {
	Balance string `json:"balance"`
}

type ChainQueryOutputs struct {
	Success bool         `json:"success"`
	Error   string       `json:"error,omitempty"`
	Data    []OutputData `json:"data"`
}

type OutputData struct {
	TransactionHash string `json:"transaction_hash"`
	ScriptPubKeyHex string `json:"script_pub_key_hex"`
	Vout            uint32 `json:"vout"`
	Type            string `json:"type"`
	Value           string `json:"value"`
}

func NewLbryClient(cfgI xc.ITask) (*LbryClient, error) {
	asset := cfgI.GetAssetConfig()
	cfg := cfgI.GetNativeAsset()
	opts := DefaultClientOptions()

	httpClient := http.Client{}
	httpClient.Timeout = opts.Timeout

	params, err := GetParams(cfg)
	if err != nil {
		return nil, err
	}

	opts.Chaincfg = params
	opts.Host = cfg.URL
	opts.Password = cfg.Auth

	return &LbryClient{
		http:  httpClient,
		Asset: asset,
		opts:  opts,
	}, nil
}

func (client *LbryClient) FetchBalance(ctx context.Context, address xc.Address) (xc.AmountBlockchain, error) {
	amount := xc.NewAmountBlockchainFromUint64(0)

	query := "select balance from address where address = '" + string(address) + "';"
	url := "https://chainquery.lbry.com/api/sql" + "?query=" + url.QueryEscape(query)
	response, _ := client.http.Get(url)

	body, err := ioutil.ReadAll(response.Body)
	if err != nil {
		log.Error(err)
		return amount, err
	}

	var balanceInfo ChainQueryBalance
	err = json.Unmarshal(body, &balanceInfo)
	if err != nil {
		log.Error(err)
		return amount, err
	}

	if balanceInfo.Success {
		if len(balanceInfo.Data) == 0 {
			return amount, nil
		}
		balance := balanceInfo.Data[0].Balance
		balNum, err := decimal.NewFromString(balance)
		if err != nil {
			log.Error(err)
			return amount, err
		}
		amount = xc.AmountHumanReadable(balNum).ToBlockchain(client.Asset.Decimals)
		return amount, nil
	}

	return amount, errors.New("balance is not available")
}

func (client *LbryClient) FetchNativeBalance(ctx context.Context, address xc.Address) (xc.AmountBlockchain, error) {
	return client.FetchBalance(ctx, address)
}

func (client *LbryClient) FetchUnspentOutputs(ctx context.Context, address xc.Address) ([]Output, error) {
	query := "select o.transaction_hash, o.vout, o.value, o.script_pub_key_hex, o.type from address a inner join transaction_address ta on a.id = ta.address_id inner join output o on o.transaction_id = ta.transaction_id and o.is_spent = 0 and o.type not in ('nonstandard','nulldata') and o.address_list = \"['" + string(address) + "']\" where a.address = '" + string(address) + "';"
	url := "https://chainquery.lbry.com/api/sql" + "?query=" + url.QueryEscape(query)
	response, _ := client.http.Get(url)

	body, err := ioutil.ReadAll(response.Body)
	if err != nil {
		log.Error(err)
		return []Output{}, err
	}

	var outputsInfo ChainQueryOutputs
	err = json.Unmarshal(body, &outputsInfo)
	if err != nil {
		log.Error(err)
		return []Output{}, err
	}

	if outputsInfo.Success {
		outputs := make([]Output, len(outputsInfo.Data))
		for i, output := range outputsInfo.Data {
			amountDecimal, err := decimal.NewFromString(output.Value)
			if err != nil {
				log.Error(err)
				return []Output{}, err
			}
			amount := xc.AmountHumanReadable(amountDecimal).ToBlockchain(client.Asset.Decimals)
			outputs[i] = Output{
				Outpoint: Outpoint{
					Hash:  []byte(output.TransactionHash),
					Index: output.Vout,
				},
				Value:        amount,
				PubKeyScript: []byte(output.ScriptPubKeyHex),
			}
		}

		return outputs, nil
	}

	return []Output{}, nil
}

func (client *LbryClient) EstimateGas(ctx context.Context) (xc.AmountBlockchain, error) {
	// estimate using last 1 blocks
	numBlocks := 3
	defaultGasFeePerByte := xc.NewAmountBlockchainFromUint64(2)

	feeRes := btcjson.EstimateSmartFeeResult{}

	if err := client.send(ctx, &feeRes, "estimatesmartfee", numBlocks); err != nil {
		return defaultGasFeePerByte, fmt.Errorf("estimating smart fee: %v", err)
	}

	if feeRes.Errors != nil && len(feeRes.Errors) > 0 {
		return defaultGasFeePerByte, fmt.Errorf("estimating smart fee: %v", feeRes.Errors[0])
	}

	amountDecimal := decimal.NewFromFloat(*feeRes.FeeRate)
	amount := xc.AmountHumanReadable(amountDecimal).ToBlockchain(client.Asset.Decimals)
	fmt.Println("satsPerByte: ", amountDecimal)

	return amount, nil
}

func (client *LbryClient) RegisterEstimateGasCallback(estimateGas xc.EstimateGasFunc) {
	client.EstimateGasFunc = estimateGas
}

func (client *LbryClient) FetchTxInput(ctx context.Context, from xc.Address, to xc.Address) (xc.TxInput, error) {
	input := NewTxInput()
	unspentOutputs, err := client.FetchUnspentOutputs(ctx, from)
	if err != nil {
		return nil, err
	}
	input.UnspentOutputs = unspentOutputs

	gasPerByte, err := client.EstimateGas(ctx)
	if err != nil {
		return nil, err
	}
	input.GasPricePerByte = gasPerByte

	return input, nil
}

func (client *LbryClient) FetchTxInfo(ctx context.Context, txHash xc.TxHash) (xc.TxInfo, error) {
	panic("implement me")
}

func (client *LbryClient) SubmitTx(ctx context.Context, tx xc.Tx) error {
	panic("implement me")
}

func (client *LbryClient) send(ctx context.Context, resp interface{}, method string, params ...interface{}) error {
	// Encode the request.
	data, err := encodeRequest(method, params)
	fmt.Println("data: ", string(data))
	if err != nil {
		return err
	}

	// Create request and add basic authentication headers. The context is
	// not attached to the request, and instead we all each attempt to run
	// for the timeout duration, and we keep attempting until success, or
	// the context is done.
	req, err := http.NewRequest("POST", client.opts.Host, bytes.NewBuffer(data))
	if err != nil {
		return fmt.Errorf("building http request: %v", err)
	}
	req.Header.Set("Content-Type", "application/json")
	req.SetBasicAuth(client.opts.User, client.opts.Password)
	if client.opts.AuthHeader != "" {
		req.Header.Set(client.opts.AuthHeader, client.opts.AuthHeaderValue)
	}

	// Send the request and decode the response.
	res, err := client.http.Do(req)
	if err != nil {
		return fmt.Errorf("sending http request: %v", err)
	}
	defer res.Body.Close()
	if res.StatusCode == 401 {
		return fmt.Errorf("http response: %v", res.Status)
	}
	if err := decodeResponse(resp, res.Body); err != nil {
		return fmt.Errorf("decoding http response: %v", err)
	}
	return nil
}
