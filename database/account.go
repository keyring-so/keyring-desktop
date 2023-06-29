package database

import (
	"keyring-desktop/utils"
	"strings"

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

func QueryChains(db *bolt.DB, account string) (*AccountChainInfo, error) {
	var chains string
	var lastSelectedChain string

	err := db.View(func(tx *bolt.Tx) error {
		b := tx.Bucket([]byte(utils.BucketName))
		lastSelectedChain = string(b.Get([]byte(account + "last_selected_chain")))
		chains = string(b.Get([]byte(account + "_chains")))
		return nil
	})
	if err != nil {
		return nil, err
	}

	chainArray := []string{}
	if chains != "" {
		chainArray = strings.Split(chains, ",")
	}
	res := &AccountChainInfo{
		Chains:            chainArray,
		LastSelectedChain: lastSelectedChain,
	}
	return res, nil
}

func QueryChainAssets(db *bolt.DB, account, chain string) (*AccountChainAssets, error) {
	var address string
	var assets string
	err := db.View(func(tx *bolt.Tx) error {
		b := tx.Bucket([]byte(utils.BucketName))
		address = string(b.Get([]byte(account + "_" + chain + "_address")))
		assets = string(b.Get([]byte(account + "_" + chain + "_assets")))
		return nil
	})
	if err != nil {
		return nil, err
	}

	assetsArray := []string{}
	if assets != "" {
		assetsArray = strings.Split(assets, ",")
	}
	res := &AccountChainAssets{
		Address: address,
		Assets:  assetsArray,
	}

	return res, nil
}

func SaveLastSelectedChain(db *bolt.DB, account, chain string) error {
	return db.Update(func(tx *bolt.Tx) error {
		b := tx.Bucket([]byte(utils.BucketName))
		b.Put([]byte(account+"last_selected_chain"), []byte(chain))
		return nil
	})
}

func SaveChainAddress(db *bolt.DB, account, chain, address string) error {
	return db.Update(func(tx *bolt.Tx) error {
		b := tx.Bucket([]byte(utils.BucketName))
		b.Put([]byte(account+"last_selected_chain"), []byte(chain))
		b.Put([]byte(account+"_"+chain+"_address"), []byte(address))
		b.Put([]byte(account+"_"+chain+"_assets"), []byte(chain))
		chains := string(b.Get([]byte(account + "_chains")))
		if chains == "" {
			chains = chain
		} else {
			if !strings.Contains(chains, chain) {
				chains = chains + "," + chain
			}
		}
		b.Put([]byte(account+"_chains"), []byte(chains))
		return nil
	})
}
