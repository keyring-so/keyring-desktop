package database

import (
	"keyring-desktop/utils"

	bolt "go.etcd.io/bbolt"
)

func QueryNetwork(db *bolt.DB) (string, error) {
	var network string

	err := db.View(func(tx *bolt.Tx) error {
		b := tx.Bucket([]byte(utils.BucketName))
		network = string(b.Get([]byte(utils.DbSettingsNetwork)))
		return nil
	})
	if err != nil {
		return "", err
	}

	return network, nil
}

func SaveNetwork(db *bolt.DB, network string) error {
	return db.Update(func(tx *bolt.Tx) error {
		b := tx.Bucket([]byte(utils.BucketName))
		b.Put([]byte(utils.DbSettingsNetwork), []byte(network))
		return nil
	})
}
