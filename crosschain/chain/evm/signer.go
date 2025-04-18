package evm

import (
	"encoding/hex"

	xc "keyring-desktop/crosschain"

	"github.com/ethereum/go-ethereum/crypto"
)

// Signer for EVM
type Signer struct {
}

// NewSigner creates a new EVM Signer
func NewSigner(asset xc.ITask) (xc.Signer, error) {
	return Signer{}, nil
}

var _ xc.Signer = &Signer{}

// ImportPrivateKey imports an EVM private key
func (signer Signer) ImportPrivateKey(privateKey string) (xc.PrivateKey, error) {
	bytesPri, err := hex.DecodeString(privateKey)
	return xc.PrivateKey(bytesPri), err
}

// Sign an EVM tx
func (signer Signer) Sign(privateKey xc.PrivateKey, data xc.TxDataToSign) (*xc.TxSignature, error) {
	ecdsaKey, err := crypto.HexToECDSA(hex.EncodeToString(privateKey))
	if err != nil {
		return nil, err
	}
	signatureRaw, err := crypto.Sign([]byte(data), ecdsaKey)
	if err != nil {
		return nil, err
	}
	txSig := &xc.TxSignature{
		Pubkey: crypto.FromECDSAPub(&ecdsaKey.PublicKey),
		Sig:    signatureRaw,
	}
	return txSig, err
}
