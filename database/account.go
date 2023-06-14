package database

import (
	"keyring-desktop/utils"

	bolt "go.etcd.io/bbolt"
)

func QueryCurrentAccount(db *bolt.DB) (string, error) {
	var account string

	err := db.View(func(tx *bolt.Tx) error {
		b := tx.Bucket([]byte(utils.BucketName))
		account = string(b.Get([]byte(utils.DbCurrentAccountKey)))
		return nil
	})
	if err != nil {
		return "", err
	}

	return account, nil
}

func QuerySelectedChain(db *bolt.DB, account string) (*AccountChainInfo, error) {
	var address string
	var chain string
	err := db.View(func(tx *bolt.Tx) error {
		b := tx.Bucket([]byte(utils.BucketName))
		chain = string(b.Get([]byte(account + "last_selected_chain")))
		address = string(b.Get([]byte(account + "_" + chain + "_address")))
		return nil
	})
	if err != nil {
		return nil, err
	}

	result := &AccountChainInfo{
		Chain:   chain,
		Address: address,
	}

	return result, nil
}

func SaveSelectedChain(db *bolt.DB, account string, info *AccountChainInfo) error {
	return db.Update(func(tx *bolt.Tx) error {
		b := tx.Bucket([]byte(utils.BucketName))
		b.Put([]byte(account+"last_selected_chain"), []byte(info.Chain))
		b.Put([]byte(account+"_"+info.Chain+"_address"), []byte(info.Address))
		return nil
	})
}
