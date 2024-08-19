package substrate

import (
	"fmt"
	xc "keyring-desktop/crosschain"

	"github.com/status-im/keycard-go/hexutils"
	"github.com/vedhavyas/go-subkey/v2"
)

// AddressBuilder for EVM
type AddressBuilder struct {
	networkId uint16
}

// NewAddressBuilder creates a new EVM AddressBuilder
func NewAddressBuilder(asset xc.ITask) (xc.AddressBuilder, error) {
	return AddressBuilder{
		networkId: uint16(asset.GetAssetConfig().ChainID),
	}, nil
}

// GetAddressFromPublicKey returns an Address given a public key
func (ab AddressBuilder) GetAddressFromPublicKey(publicKeyBytes []byte) (xc.Address, []byte, error) {
	fmt.Println("GetAddressFromPublicKey for substrate:", hexutils.BytesToHex(publicKeyBytes))
	addr := subkey.SS58Encode(publicKeyBytes, ab.networkId) // substrate address

	return xc.Address(addr), publicKeyBytes, nil
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
