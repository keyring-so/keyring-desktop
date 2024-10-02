package substrate

import (
	"fmt"
	xc "keyring-desktop/crosschain"
	"math/big"

	gsrpc "github.com/centrifuge/go-substrate-rpc-client/v4"
	"github.com/centrifuge/go-substrate-rpc-client/v4/types"
	"github.com/centrifuge/go-substrate-rpc-client/v4/types/codec"
	"github.com/centrifuge/go-substrate-rpc-client/v4/types/extrinsic"
	"github.com/centrifuge/go-substrate-rpc-client/v4/types/extrinsic/extensions"
	"github.com/vedhavyas/go-subkey/v2"
)

type Builder struct {
	// api *gsrpc.SubstrateAPI
	cfg *xc.AssetConfig
}

type Tx struct {
	ext          *extrinsic.DynamicExtrinsic
	extSignature *extrinsic.Signature
	payload      *extrinsic.Payload
	SignOptions  []extrinsic.SigningOption
	metadata     *types.Metadata
	signedFields []*extrinsic.SignedField
	fromPubkey   []byte
	toPubKey     []byte
	amount       xc.AmountBlockchain
	rpc          string
}

// AddSignatures implements crosschain.Tx.
func (t Tx) AddSignatures(signatures ...xc.TxSignature) error {
	fmt.Println("NewMultiAddressFromAccountID fromPubkey:", t.fromPubkey)
	fmt.Println("NewMultiAddressFromAccountID signer pubkey:", signatures[0].Pubkey, len(signatures[0].Pubkey))

	sig := signatures[0].Sig
	signature := types.NewSignature(sig)

	signerPubKey, err := types.NewMultiAddressFromAccountID(t.fromPubkey)
	if err != nil {
		panic(err)
	}

	fmt.Println("t.extSignatrue", t.extSignature)

	extSignature := &extrinsic.Signature{
		Signer:       signerPubKey,
		Signature:    types.MultiSignature{IsEd25519: true, AsEd25519: signature},
		SignedFields: t.extSignature.SignedFields,
	}

	t.ext.Signature = extSignature

	// mark the extrinsic as signed
	t.ext.Version |= types.ExtrinsicBitSigned

	if err != nil {
		panic(err)
	}

	return nil
}

// Hash implements crosschain.Tx.
func (t Tx) Hash() xc.TxHash {
	return "nil"
}

// Serialize implements crosschain.Tx.
func (t Tx) Serialize() ([]byte, error) {
	panic("unimplemented")
}

// Sighashes implements crosschain.Tx.
func (t Tx) Sighashes() ([]xc.TxDataToSign, error) {
	b, err := codec.Encode(t.payload)
	if err != nil {
		panic(err)
	}

	return []xc.TxDataToSign{b}, nil
}

// NewBuilder creates a new Builder
func NewTxBuilder(asset xc.ITask) (xc.TxBuilder, error) {
	cfg := asset.GetNativeAsset()

	return Builder{cfg: cfg}, nil
}

// NewSendTransaction implements crosschain.TxBuilder.
func (builder Builder) NewSendTransaction(from xc.Address, to xc.Address, gas uint64, value *big.Int, data []byte, input xc.TxInput) (xc.Tx, error) {
	panic("unimplemented")
}

// NewTransfer implements crosschain.TxBuilder.
func (builder Builder) NewTransfer(from xc.Address, to xc.Address, amount xc.AmountBlockchain, input xc.TxInput) (xc.Tx, error) {
	_, fromPubkey, err := subkey.SS58Decode(string(from))
	if err != nil {
		return nil, err
	}

	_, toPubkey, err := subkey.SS58Decode(string(to))
	if err != nil {
		return nil, err
	}

	api, err := gsrpc.NewSubstrateAPI(builder.cfg.URL)

	if err != nil {
		panic(err)
	}

	meta, err := api.RPC.State.GetMetadataLatest()

	if err != nil {
		panic(err)
	}

	rv, err := api.RPC.State.GetRuntimeVersionLatest()
	if err != nil {
		panic(err)
	}

	genesisHash, err := api.RPC.Chain.GetBlockHash(0)
	if err != nil {
		panic(err)
	}

	accountStorageKey, err := types.CreateStorageKey(meta, "System", "Account", fromPubkey)
	if err != nil {
		panic(err)
	}

	var accountInfo types.AccountInfo
	ok, err := api.RPC.State.GetStorageLatest(accountStorageKey, &accountInfo)

	if err != nil || !ok {
		panic(err)
	}

	if err != nil {
		panic(err)
	}
	dest, err := types.NewMultiAddressFromAccountID(toPubkey)
	if err != nil {
		panic(err)
	}

	call, err := types.NewCall(meta, "Balances.transfer_keep_alive", dest, types.NewUCompact(amount.Int()))

	if err != nil {
		panic(err)
	}

	ext := extrinsic.NewDynamicExtrinsic(&call)

	if ext.Type() != types.ExtrinsicVersion4 {
		panic(fmt.Errorf("unsupported extrinsic version: %v (isSigned: %v, type: %v)", ext.Version, ext.IsSigned(), ext.Type()))
	}

	encodedMethod, err := codec.Encode(ext.Method)
	if err != nil {
		panic(err)
	}

	fieldValues := extrinsic.SignedFieldValues{}

	opts := []extrinsic.SigningOption{
		extrinsic.WithEra(types.ExtrinsicEra{IsImmortalEra: true}, genesisHash),
		extrinsic.WithNonce(types.NewUCompactFromUInt(uint64(accountInfo.Nonce))),
		extrinsic.WithTip(types.NewUCompactFromUInt(0)),
		extrinsic.WithSpecVersion(rv.SpecVersion),
		extrinsic.WithTransactionVersion(rv.TransactionVersion),
		extrinsic.WithGenesisHash(genesisHash),
		extrinsic.WithMetadataMode(extensions.CheckMetadataModeDisabled, extensions.CheckMetadataHash{Hash: types.NewEmptyOption[types.H256]()}),
	}

	for _, opt := range opts {
		opt(fieldValues)
	}

	payload, err := extrinsic.CreatePayload(meta, encodedMethod)

	if err != nil {
		panic(err)
	}

	if err := payload.MutateSignedFields(fieldValues); err != nil {
		panic(err)
	}

	signerPubKey, err := types.NewMultiAddressFromAccountID(fromPubkey)
	if err != nil {
		panic(err)
	}

	extSignature := &extrinsic.Signature{
		Signer:       signerPubKey,
		Signature:    types.MultiSignature{IsEd25519: true, AsEd25519: types.NewSignature([]byte{})},
		SignedFields: payload.SignedFields,
	}

	fmt.Println("extSignatrue", extSignature)

	return Tx{
		ext:          &ext,
		extSignature: extSignature,
		payload:      payload,
		fromPubkey:   fromPubkey,
		toPubKey:     toPubkey,
		amount:       amount,
		rpc:          builder.cfg.URL,
	}, nil
}
