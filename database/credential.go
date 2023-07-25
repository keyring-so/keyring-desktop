package database

import (
	"keyring-desktop/utils"

	bolt "go.etcd.io/bbolt"
)

// TODO encrypt the puk and code, probably read others from QR code
func SaveCredential(db *bolt.DB, puk string, code string, account string) error {
	err := db.Update(func(tx *bolt.Tx) error {
		b := tx.Bucket([]byte(utils.BucketName))
		b.Put([]byte(utils.DbCurrentAccountKey), []byte(account))
		b.Put([]byte(account+"_puk"), []byte(puk))
		b.Put([]byte(account+"_code"), []byte(code))
		return nil
	})

	return err
}

func QueryCredential(db *bolt.DB, account string) (*AccountCredential, error) {
	var credential *AccountCredential
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

	credential = &AccountCredential{
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
