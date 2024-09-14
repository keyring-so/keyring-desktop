package substrate

import (
	"context"
	"fmt"
	xc "keyring-desktop/crosschain"

	gsrpc "github.com/centrifuge/go-substrate-rpc-client/v4"
	"github.com/centrifuge/go-substrate-rpc-client/v4/types"
	"github.com/centrifuge/go-substrate-rpc-client/v4/types/codec"
	"github.com/vedhavyas/go-subkey/v2"
)

type Client struct {
	api *gsrpc.SubstrateAPI
}

func NewClient(cfgI xc.ITask) (*Client, error) {
	// asset := cfgI.GetAssetConfig()
	cfg := cfgI.GetNativeAsset()

	api, err := gsrpc.NewSubstrateAPI(cfg.URL)
	if err != nil {
		return nil, err
	}

	hash, err := api.RPC.Chain.GetBlockHashLatest()
	if err != nil {
		return nil, err
	}

	fmt.Println("Latest block hash:", hash.Hex())

	return &Client{
		api: api,
	}, nil
}

func (client *Client) FetchBalance(ctx context.Context, address xc.Address) (xc.AmountBlockchain, error) {
	meta, err := client.api.RPC.State.GetMetadataLatest()
	if err != nil {
		return xc.AmountBlockchain{}, err
	}

	_, pubkey, err := subkey.SS58Decode(string(address))
	if err != nil {
		return xc.AmountBlockchain{}, err
	}

	key, err := types.CreateStorageKey(meta, "System", "Account", pubkey)
	if err != nil {
		return xc.AmountBlockchain{}, err
	}

	var accountInfo types.AccountInfo
	ok, err := client.api.RPC.State.GetStorageLatest(key, &accountInfo)
	if err != nil || !ok {
		return xc.AmountBlockchain{}, err
	}

	fmt.Println("Account info:", accountInfo)
	return xc.AmountBlockchain(*accountInfo.Data.Free.Int), nil
}

func (client *Client) FetchNativeBalance(ctx context.Context, address xc.Address) (xc.AmountBlockchain, error) {
	return xc.AmountBlockchain{}, nil
}

func (client *Client) GetContractMetadata(ctx context.Context) (*xc.ContractMetadata, error) {
	return nil, nil
}

func (client *Client) FetchTxInfo(ctx context.Context, txHash xc.TxHash) (xc.TxInfo, error) {
	return xc.TxInfo{}, nil
}

func (client *Client) FetchTxInput(ctx context.Context, from xc.Address, to xc.Address) (xc.TxInput, error) {
	return nil, nil
}

func (client *Client) SubmitTx(ctx context.Context, tx xc.Tx) error {
	// encodedExt, err := codec.EncodeToHex(tx.(Tx).Extrinsic)
	// if err != nil {
	// 	return err
	// }
	// fmt.Printf("Ext - %s\n", encodedExt)

	// // sub, err := client.api.RPC.Author.SubmitAndWatchDynamicExtrinsic(*tx.(Tx).Extrinsic)
	// // if err != nil {
	// // 	return err
	// // }

	// defer sub.Unsubscribe()

	// go func() {
	// 	for {
	// 		select {
	// 		case st := <-sub.Chan():
	// 			extStatus, _ := st.MarshalJSON()
	// 			fmt.Printf("Status for transaction - %s\n", string(extStatus))
	// 		case err := <-sub.Err():
	// 			fmt.Println("Error for transaction:", err)
	// 		}
	// 	}
	// }()

	ext := *tx.(Tx).ext
	encodedExt, err := codec.EncodeToHex(ext)

	fmt.Printf("Ext - %s\n", encodedExt)

	// ecodedext2 := "0x31028400dbe4793343ef409e9d1e8e9ba41fe854c8b277104b4c089660be6f9b52d538bb00174ace15579e8daf89bbeb0a9485855915c5c8ba4e86af78110a8a33995b139feb2728585fe30505f35d4cda487e5549a226c81df015bb75fdd965b059a7350c04030058c9c24f7da8a412ddb6437f310bab0d181ce900d85ea1d4c0569150ccba40060700e8764817"
	// sub, err := api.RPC.Author.SubmitAndWatchExtrinsicTest(ecodedext2)
	sub, err := client.api.RPC.Author.SubmitAndWatchDynamicExtrinsic(ext)

	if err != nil {
		fmt.Println("Error submitting extrinsic", err)
		panic(err)
	}

	defer sub.Unsubscribe()

	// go func() {
	// 	for {
	// 		select {
	// 		case st := <-sub.Chan():
	// 			extStatus, _ := st.MarshalJSON()
	// 			fmt.Printf("Status for transaction - %s\n", string(extStatus))
	// 		case err := <-sub.Err():
	// 			panic(err)
	// 		}
	// 	}
	// }()

	return nil
}
