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

	// var publicKey *ecdsa.PublicKey
	// var err error
	// if len(signatures[0].Pubkey) == 33 {
	// 	publicKey, err = crypto.DecompressPubkey(signatures[0].Pubkey)
	// 	if err != nil {
	// 		return errors.New("invalid k256 public key")
	// 	}
	// } else {
	// 	publicKey, err = crypto.UnmarshalPubkey(signatures[0].Pubkey)
	// 	if err != nil {
	// 		return err
	// 	}
	// }
	// compressedPublicKey := crypto.CompressPubkey(publicKey)
	// fmt.Println("Compressed public key:", compressedPublicKey, len(compressedPublicKey))
	// hashedPubkey := blake2b.Sum256(compressedPublicKey)

	// a := types.AccountID{}
	// copy(a[:], hashedPubkey)

	// accountId, err := types.NewAccountID(signatures[0].Pubkey)
	// if err != nil {
	// 	return err
	// }

	// signerInfo := types.MultiAddress{
	// 	IsID: true,
	// 	AsID: *accountId,
	// }

	// signerPubKey, err := types.NewMultiAddressFromAccountID(signatures[0].Pubkey)
	// if err != nil {
	// 	return err
	// }

	// era := t.SignOptions.Era
	// if !t.SignOptions.Era.IsMortalEra {
	// 	era = types.ExtrinsicEra{IsImmortalEra: true}
	// }

	// sig := types.NewSignature(signatures[0].Sig)
	// var sig types.EcdsaSignature
	// copy(sig[:], signatures[0].Sig)
	// extSig := types.ExtrinsicSignatureV4{
	// 	Signer:    signerInfo,
	// 	Signature: types.MultiSignature{IsEcdsa: true, AsEcdsa: sig},
	// 	Era:       era,
	// 	Nonce:     t.SignOptions.Nonce,
	// 	Tip:       t.SignOptions.Tip,
	// }

	// extSignature := &extrinsic.Signature{
	// 	Signer:       signerPubKey,
	// 	Signature:    types.MultiSignature{IsEd25519: true, AsEd25519: sig},
	// 	SignedFields: t.signedFields,
	// }

	// t.Extrinsic.Signature = extSignature

	// // mark the extrinsic as signed
	// t.Extrinsic.Version |= types.ExtrinsicBitSigned

	// return nil

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

	// encodedExt, err := codec.EncodeToHex(ext)

	// fmt.Printf("Ext - %s\n", encodedExt)

	// // ecodedext2 := "0x31028400dbe4793343ef409e9d1e8e9ba41fe854c8b277104b4c089660be6f9b52d538bb00174ace15579e8daf89bbeb0a9485855915c5c8ba4e86af78110a8a33995b139feb2728585fe30505f35d4cda487e5549a226c81df015bb75fdd965b059a7350c04030058c9c24f7da8a412ddb6437f310bab0d181ce900d85ea1d4c0569150ccba40060700e8764817"
	// // sub, err := api.RPC.Author.SubmitAndWatchExtrinsicTest(ecodedext2)
	// sub, err := api.RPC.Author.SubmitAndWatchDynamicExtrinsic(ext)

	// if err != nil {
	// 	fmt.Println("Error submitting extrinsic", err)
	// 	panic(err)
	// }

	// defer sub.Unsubscribe()

	// for {
	// 	select {
	// 	case st := <-sub.Chan():
	// 		extStatus, _ := st.MarshalJSON()
	// 		fmt.Printf("Status for transaction - %s\n", string(extStatus))
	// 	case err := <-sub.Err():
	// 		panic(err)
	// 	}
	// }
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
	// err = t.Extrinsic.Sign(
	// 	BobKeyRingPair,
	// 	meta,
	// )

	// if t.Extrinsic.Type() != types.ExtrinsicVersion4 {
	// 	return nil, fmt.Errorf("unsupported extrinsic version: %v (isSigned: %v, type: %v)", t.Extrinsic.Version, t.Extrinsic.IsSigned(), t.Extrinsic.Type())
	// }

	// encodedMethod, err := codec.Encode(t.Extrinsic.Method)
	// if err != nil {
	// 	return nil, fmt.Errorf("encode method: %w", err)
	// }

	// fieldValues := extrinsic.SignedFieldValues{}

	// for _, opt := range t.SignOptions {
	// 	opt(fieldValues)
	// }

	// payload, err := extrinsic.CreatePayload(t.metadata, encodedMethod)
	// if err != nil {
	// 	return nil, fmt.Errorf("creating payload: %w", err)
	// }

	// if err := payload.MutateSignedFields(fieldValues); err != nil {
	// 	return nil, fmt.Errorf("mutate signed fields: %w", err)
	// }

	// data, err := codec.Encode(payload)
	// if err != nil {
	// 	return nil, err
	// }

	// if len(data) > 256 {
	// 	h := blake2b.Sum256(data)
	// 	data = h[:]
	// }

	// t.signedFields = payload.SignedFields

	// fmt.Println("tx ...", t)

	// api, err := gsrpc.NewSubstrateAPI(t.rpc)

	// if err != nil {
	// 	panic(err)
	// }

	// meta, err := api.RPC.State.GetMetadataLatest()

	// if err != nil {
	// 	panic(err)
	// }

	// rv, err := api.RPC.State.GetRuntimeVersionLatest()
	// if err != nil {
	// 	panic(err)
	// }

	// genesisHash, err := api.RPC.Chain.GetBlockHash(0)
	// if err != nil {
	// 	panic(err)
	// }

	// // Alice cannot be used on wested due to lack of funds(?)
	// accountStorageKey, err := types.CreateStorageKey(meta, "System", "Account", t.fromPubkey)
	// if err != nil {
	// 	panic(err)
	// }

	// var accountInfo types.AccountInfo
	// ok, err := api.RPC.State.GetStorageLatest(accountStorageKey, &accountInfo)

	// if err != nil || !ok {
	// 	panic(err)
	// }

	// if err != nil {
	// 	panic(err)
	// }
	// dest, err := types.NewMultiAddressFromAccountID(t.toPubKey)
	// if err != nil {
	// 	panic(err)
	// }

	// call, err := types.NewCall(meta, "Balances.transfer_keep_alive", dest, types.NewUCompact(t.amount.Int()))
	// // call, err := types.NewCall(meta, "System.remark", []byte("Hello, World!"))

	// if err != nil {
	// 	panic(err)
	// }

	// ext := extrinsic.NewDynamicExtrinsic(&call)

	// // err = ext.Sign(
	// // 	BobKeyRingPair2,
	// // 	meta,
	// // 	extrinsic.WithEra(types.ExtrinsicEra{IsImmortalEra: true}, genesisHash),
	// // 	extrinsic.WithNonce(types.NewUCompactFromUInt(uint64(accountInfo.Nonce))),
	// // 	extrinsic.WithTip(types.NewUCompactFromUInt(0)),
	// // 	extrinsic.WithSpecVersion(rv.SpecVersion),
	// // 	extrinsic.WithTransactionVersion(rv.TransactionVersion),
	// // 	extrinsic.WithGenesisHash(genesisHash),
	// // 	extrinsic.WithMetadataMode(extensions.CheckMetadataModeDisabled, extensions.CheckMetadataHash{Hash: types.NewEmptyOption[types.H256]()}),
	// // )

	// if ext.Type() != types.ExtrinsicVersion4 {
	// 	panic(fmt.Errorf("unsupported extrinsic version: %v (isSigned: %v, type: %v)", ext.Version, ext.IsSigned(), ext.Type()))
	// }

	// encodedMethod, err := codec.Encode(ext.Method)
	// if err != nil {
	// 	panic(err)
	// }

	// fieldValues := extrinsic.SignedFieldValues{}

	// opts := []extrinsic.SigningOption{
	// 	extrinsic.WithEra(types.ExtrinsicEra{IsImmortalEra: true}, genesisHash),
	// 	extrinsic.WithNonce(types.NewUCompactFromUInt(uint64(accountInfo.Nonce))),
	// 	extrinsic.WithTip(types.NewUCompactFromUInt(0)),
	// 	extrinsic.WithSpecVersion(rv.SpecVersion),
	// 	extrinsic.WithTransactionVersion(rv.TransactionVersion),
	// 	extrinsic.WithGenesisHash(genesisHash),
	// 	extrinsic.WithMetadataMode(extensions.CheckMetadataModeDisabled, extensions.CheckMetadataHash{Hash: types.NewEmptyOption[types.H256]()}),
	// }

	// for _, opt := range opts {
	// 	opt(fieldValues)
	// }

	// payload, err := extrinsic.CreatePayload(meta, encodedMethod)

	// if err != nil {
	// 	panic(err)
	// }

	// if err := payload.MutateSignedFields(fieldValues); err != nil {
	// 	panic(err)
	// }

	// signerPubKey, err := types.NewMultiAddressFromAccountID(t.fromPubkey)
	// if err != nil {
	// 	panic(err)
	// }

	// sig, err := payload.Sign(signer)
	// if err != nil {
	// 	return err
	// }

	b, err := codec.Encode(t.payload)
	if err != nil {
		panic(err)
	}

	// extSignature := &extrinsic.Signature{
	// 	Signer:       signerPubKey,
	// 	Signature:    types.MultiSignature{IsEd25519: true, AsEd25519: types.NewSignature([]byte{})},
	// 	SignedFields: payload.SignedFields,
	// }

	// t.ext = &ext
	// t.extSignature = extSignature

	// fmt.Println("extSignatrue", extSignature)

	// sig, err := signature.Sign(b, signer.URI)

	// sig := hexutil.Decode("")
	// fmt.Println("sig: ", hexutil.Encode(sig))

	// Sign(nil, msg, crypto.Hash(0))
	// sig, err := priv.Sign(nil, b, crypto.Hash(0))
	// if err != nil {
	// 	panic(err)
	// }

	return []xc.TxDataToSign{b}, nil
}

// NewBuilder creates a new Builder
func NewTxBuilder(asset xc.ITask) (xc.TxBuilder, error) {
	cfg := asset.GetNativeAsset()

	// api, err := gsrpc.NewSubstrateAPI(cfg.URL)
	// if err != nil {
	// 	return nil, err
	// }

	// hash, err := api.RPC.Chain.GetBlockHashLatest()
	// if err != nil {
	// 	return nil, err
	// }

	// fmt.Println("Latest block hash:", hash.Hex())

	return Builder{cfg: cfg}, nil
}

// NewSendTransaction implements crosschain.TxBuilder.
func (builder Builder) NewSendTransaction(from xc.Address, to xc.Address, gas uint64, value *big.Int, data []byte, input xc.TxInput) (xc.Tx, error) {
	panic("unimplemented")
}

// NewTransfer implements crosschain.TxBuilder.
func (builder Builder) NewTransfer(from xc.Address, to xc.Address, amount xc.AmountBlockchain, input xc.TxInput) (xc.Tx, error) {
	// meta, err := builder.api.RPC.State.GetMetadataLatest()
	// if err != nil {
	// 	return nil, err
	// }

	// rv, err := builder.api.RPC.State.GetRuntimeVersionLatest()
	// if err != nil {
	// 	panic(err)
	// }

	// genesisHash, err := builder.api.RPC.Chain.GetBlockHash(0)
	// if err != nil {
	// 	panic(err)
	// }

	// _, fromPubkey, err := subkey.SS58Decode(string(from))
	// if err != nil {
	// 	return nil, err
	// }
	// fmt.Println("from pubkey:", fromPubkey)
	// key, err := types.CreateStorageKey(meta, "System", "Account", fromPubkey)
	// if err != nil {
	// 	return nil, err
	// }
	// var accountInfo types.AccountInfo
	// ok, err := builder.api.RPC.State.GetStorageLatest(key, &accountInfo)
	// if err != nil || !ok {
	// 	return nil, err
	// }

	// fmt.Println("test to address:", to)
	// _, toPubkey, err := subkey.SS58Decode(string(to))
	// if err != nil {
	// 	return nil, err
	// }
	// dest, err := types.NewMultiAddressFromAccountID(toPubkey)
	// if err != nil {
	// 	panic(err)
	// }

	// // nonce := uint32(accountInfo.Nonce)
	// // o := types.SignatureOptions{
	// // 	BlockHash:          genesisHash,
	// // 	Era:                types.ExtrinsicEra{IsMortalEra: false},
	// // 	GenesisHash:        genesisHash,
	// // 	Nonce:              types.NewUCompactFromUInt(uint64(nonce)),
	// // 	SpecVersion:        rv.SpecVersion,
	// // 	Tip:                types.NewUCompactFromUInt(0),
	// // 	TransactionVersion: rv.TransactionVersion,
	// // }

	// fmt.Println("amount:", amount)

	// call, err := types.NewCall(meta, "Balances.transfer_keep_alive", dest, types.NewUCompact(amount.Int()))
	// if err != nil {
	// 	return nil, err
	// }

	// ext := extrinsic.NewDynamicExtrinsic(&call)

	// signOptions := []extrinsic.SigningOption{
	// 	extrinsic.WithEra(types.ExtrinsicEra{IsImmortalEra: true}, genesisHash),
	// 	extrinsic.WithNonce(types.NewUCompactFromUInt(uint64(accountInfo.Nonce))),
	// 	extrinsic.WithTip(types.NewUCompactFromUInt(0)),
	// 	extrinsic.WithSpecVersion(rv.SpecVersion),
	// 	extrinsic.WithTransactionVersion(rv.TransactionVersion),
	// 	extrinsic.WithGenesisHash(genesisHash),
	// 	extrinsic.WithMetadataMode(extensions.CheckMetadataModeDisabled, extensions.CheckMetadataHash{Hash: types.NewEmptyOption[types.H256]()}),
	// }

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

	// Alice cannot be used on wested due to lack of funds(?)
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
	// call, err := types.NewCall(meta, "System.remark", []byte("Hello, World!"))

	if err != nil {
		panic(err)
	}

	ext := extrinsic.NewDynamicExtrinsic(&call)

	// err = ext.Sign(
	// 	BobKeyRingPair2,
	// 	meta,
	// 	extrinsic.WithEra(types.ExtrinsicEra{IsImmortalEra: true}, genesisHash),
	// 	extrinsic.WithNonce(types.NewUCompactFromUInt(uint64(accountInfo.Nonce))),
	// 	extrinsic.WithTip(types.NewUCompactFromUInt(0)),
	// 	extrinsic.WithSpecVersion(rv.SpecVersion),
	// 	extrinsic.WithTransactionVersion(rv.TransactionVersion),
	// 	extrinsic.WithGenesisHash(genesisHash),
	// 	extrinsic.WithMetadataMode(extensions.CheckMetadataModeDisabled, extensions.CheckMetadataHash{Hash: types.NewEmptyOption[types.H256]()}),
	// )

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

	// sig, err := payload.Sign(signer)
	// if err != nil {
	// 	return err
	// }

	// b, err := codec.Encode(payload)
	// if err != nil {
	// 	panic(err)
	// }

	extSignature := &extrinsic.Signature{
		Signer:       signerPubKey,
		Signature:    types.MultiSignature{IsEd25519: true, AsEd25519: types.NewSignature([]byte{})},
		SignedFields: payload.SignedFields,
	}

	// t.ext = &ext
	// t.extSignature = extSignature

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
