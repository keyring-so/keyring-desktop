package database

import (
	"errors"
	"keyring-desktop/utils"
	"strings"

	bolt "go.etcd.io/bbolt"
)

func SaveCredential(db *bolt.DB, puk, code, pairingKey, pairingIndex, account string) error {
	err := db.Update(func(tx *bolt.Tx) error {
		b := tx.Bucket([]byte(utils.BucketName))

		allAccounts := string(b.Get([]byte(utils.DbAllAccountsKey)))
		if allAccounts == "" {
			allAccounts = account
		} else {
			if strings.Contains(allAccounts, account) {
				return errors.New("account already exists")
			} else {
				allAccounts = allAccounts + "," + account
			}
		}
		b.Put([]byte(utils.DbAllAccountsKey), []byte(allAccounts))

		currentAccount := string(b.Get([]byte(utils.DbCurrentAccountKey)))
		if currentAccount == "" {
			b.Put([]byte(utils.DbCurrentAccountKey), []byte(account))
		}

		b.Put([]byte(account+"_puk"), []byte(puk))
		b.Put([]byte(account+"_code"), []byte(code))
		b.Put([]byte(account+"_pairing_key"), []byte(pairingKey))
		b.Put([]byte(account+"_pairing_index"), []byte(pairingIndex))
		return nil
	})

	return err
}

func QueryCredential(db *bolt.DB, account string) (*AccountCredential, error) {
	var puk string
	var code string

	err := db.View(func(tx *bolt.Tx) error {
		b := tx.Bucket([]byte(utils.BucketName))
		puk = string(b.Get([]byte(account + "_puk")))
		code = string(b.Get([]byte(account + "_code")))
		return nil
	})
	if err != nil {
		return nil, err
	}

	credential := &AccountCredential{
		puk,
		code,
	}

	return credential, nil
}

func QueryCurrentAccountCredential(db *bolt.DB) (*AccountCredential, error) {

	var account string
	err := db.View(func(tx *bolt.Tx) error {
		b := tx.Bucket([]byte(utils.BucketName))
		account = string(b.Get([]byte(utils.DbCurrentAccountKey)))
		return nil
	})
	if err != nil {
		return nil, err
	}

	return QueryCredential(db, account)
}

func QueryPairingInfo(db *bolt.DB, account string) (*EncryptedPairingInfo, error) {
	var key string
	var index string

	err := db.View(func(tx *bolt.Tx) error {
		b := tx.Bucket([]byte(utils.BucketName))
		key = string(b.Get([]byte(account + "_pairing_key")))
		index = string(b.Get([]byte(account + "_pairing_index")))
		return nil
	})
	if err != nil {
		return nil, err
	}

	enPairingInfo := &EncryptedPairingInfo{
		Key:   key,
		Index: index,
	}

	return enPairingInfo, nil
}
