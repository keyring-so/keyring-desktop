package substrate

import (
	"fmt"
	xc "keyring-desktop/crosschain"

	"github.com/status-im/keycard-go/hexutils"
	"github.com/vedhavyas/go-subkey/v2"
)

// AddressBuilder for EVM
type AddressBuilder struct {
	addressPrefix uint16
}

// NewAddressBuilder creates a new EVM AddressBuilder
func NewAddressBuilder(asset xc.ITask) (xc.AddressBuilder, error) {
	return AddressBuilder{
		addressPrefix: uint16(asset.GetAssetConfig().AddressPrefix),
	}, nil
}

// GetAddressFromPublicKey returns an Address given a public key
func (ab AddressBuilder) GetAddressFromPublicKey(publicKeyBytes []byte) (xc.Address, []byte, error) {
	fmt.Println("GetAddressFromPublicKey for substrate:", hexutils.BytesToHex(publicKeyBytes), len(publicKeyBytes))

	// var publicKey *ecdsa.PublicKey
	// var err error
	// if len(publicKeyBytes) == 33 {
	// 	publicKey, err = crypto.DecompressPubkey(publicKeyBytes)
	// 	if err != nil {
	// 		return xc.Address(""), nil, errors.New("invalid k256 public key")
	// 	}
	// } else {
	// 	publicKey, err = crypto.UnmarshalPubkey(publicKeyBytes)
	// 	if err != nil {
	// 		return xc.Address(""), nil, err
	// 	}
	// }
	// compressedPublicKey := crypto.CompressPubkey(publicKey)
	// // compressedPublicKey = compressedPublicKey[:len(compressedPublicKey)-1]

	// fmt.Println("Compressed public key:", hexutils.BytesToHex(compressedPublicKey))
	// addr := subkey.SS58Encode(compressedPublicKey, ab.addressPrefix) // substrate address

	// if err != nil {
	// 	return xc.Address(""), nil, err
	// }

	// return xc.Address(addr), publicKeyBytes, nil

	// var publicKey *ecdsa.PublicKey
	// var err error
	// if len(publicKeyBytes) == 33 {
	// 	publicKey, err = crypto.DecompressPubkey(publicKeyBytes)
	// 	if err != nil {
	// 		return xc.Address(""), nil, errors.New("invalid k256 public key")
	// 	}
	// } else {
	// 	publicKey, err = crypto.UnmarshalPubkey(publicKeyBytes)
	// 	if err != nil {
	// 		return xc.Address(""), nil, err
	// 	}
	// }

	// compressedPublicKey := crypto.CompressPubkey(publicKey)

	// fmt.Println("compressedPublicKey for substrate:", hexutils.BytesToHex(compressedPublicKey), len(compressedPublicKey), ab.addressPrefix)

	// hashedPubkey := blake2b.Sum256(compressedPublicKey)

	fmt.Println("publicKeyBytes for substrate:", hexutils.BytesToHex(publicKeyBytes), len(publicKeyBytes), ab.addressPrefix)
	first := publicKeyBytes[:32]
	second := publicKeyBytes[32:]
	fmt.Println("private key:", hexutils.BytesToHex(first), len(first))
	fmt.Println("public key:", hexutils.BytesToHex(second), len(second))
	address := subkey.SS58Encode(second, ab.addressPrefix)
	return xc.Address(address), publicKeyBytes, nil
}

// GetAllPossibleAddressesFromPublicKey returns all PossubleAddress(es) given a public key
func (ab AddressBuilder) GetAllPossibleAddressesFromPublicKey(publicKeyBytes []byte) ([]xc.PossibleAddress, error) {
	address, pubkey, err := ab.GetAddressFromPublicKey(publicKeyBytes)
	return []xc.PossibleAddress{
		{
			Address:   address,
			Type:      xc.AddressTypeDefault,
			PublicKey: pubkey,
		},
	}, err
}
