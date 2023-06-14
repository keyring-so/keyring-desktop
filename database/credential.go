package database

import (
	"keyring-desktop/utils"

	bolt "go.etcd.io/bbolt"
)

// TODO encrypt the puk and code, do not save pin, probably read others from QR code
func SaveCredential(db *bolt.DB, pin string, puk string, code string, account string) error {
	err := db.Update(func(tx *bolt.Tx) error {
		b := tx.Bucket([]byte(utils.BucketName))
		b.Put([]byte(utils.DbCurrentAccountKey), []byte(account))
		b.Put([]byte(account+"_pin"), []byte(pin))
		b.Put([]byte(account+"_puk"), []byte(puk))
		b.Put([]byte(account+"_code"), []byte(code))
		return nil
	})

	return err
}

func QueryCredential(db *bolt.DB, account string) (*AccountCredential, error) {
	var credential *AccountCredential
	var pin string
	var puk string
	var code string

	err := db.View(func(tx *bolt.Tx) error {
		b := tx.Bucket([]byte(utils.BucketName))
		pin = string(b.Get([]byte(account + "_pin")))
		puk = string(b.Get([]byte(account + "_puk")))
		code = string(b.Get([]byte(account + "_code")))
		return nil
	})
	if err != nil {
		return nil, err
	}

	credential = &AccountCredential{
		pin,
		puk,
		code,
	}

	return credential, nil
}
