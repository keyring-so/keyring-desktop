package bitcoin

import (
	"context"
	"encoding/json"
	"errors"
	"io/ioutil"
	xc "keyring-desktop/crosschain"
	"net/http"
	"net/url"

	"github.com/shopspring/decimal"
	log "github.com/sirupsen/logrus"
)

type LbryClient struct {
	http  http.Client
	Asset *xc.AssetConfig
	opts  ClientOptions
}

type ChainQueryBalance struct {
	Success bool          `json:"success"`
	Error   string        `json:"error,omitempty"`
	Data    []BalanceData `json:"data"`
}

type BalanceData struct {
	Balance string `json:"balance"`
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
	opts.Password = cfg.AuthSecret

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

	// _, err := client.http.Get("")
	return nil, nil
}

func (client *LbryClient) FetchTxInput(ctx context.Context, from xc.Address, to xc.Address) (xc.TxInput, error) {
	return nil, nil
}

func (client *LbryClient) FetchTxInfo(ctx context.Context, txHash xc.TxHash) (xc.TxInfo, error) {
	panic("implement me")
}

func (client *LbryClient) SubmitTx(ctx context.Context, tx xc.Tx) error {
	panic("implement me")
}
