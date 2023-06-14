package utils

import (
	"time"

	bolt "go.etcd.io/bbolt"
)

func InitDb() *bolt.DB {
	dbPath, err := DatabasePath()
	if err != nil {
		Sugar.Fatal(err)
	}
	db, err := bolt.Open(dbPath, 0600, &bolt.Options{Timeout: 1 * time.Second})
	if err != nil {
		Sugar.Fatal(err)
	}
	err = db.Update(func(tx *bolt.Tx) error {
		_, err = tx.CreateBucket([]byte(BucketName))
		return nil
	})
	if err != nil {
		Sugar.Fatal(err)
	}

	return db
}
