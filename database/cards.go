package database

import (
	"errors"
	"keyring-desktop/utils"
	"strings"

	"github.com/jmoiron/sqlx"
	bolt "go.etcd.io/bbolt"
	_ "modernc.org/sqlite"
)

func SaveCard(db *sqlx.DB, puk, code, pairingKey, pairingIndex, name string) error {
	cards := []Card{}

	err := db.Select(&cards, "select * from cards where name = ?", name)
	if err != nil {
		return err
	}
	if len(cards) > 0 {
		return errors.New("card name is already used")
	}

	_, err = db.Exec(
		"insert into cards (name, selected, puk, pairing_code, pairing_key, pairing_index) values (?, true, ?, ?, ?, ?)",
		name, puk, code, pairingKey, pairingIndex,
	)

	if err == nil {
		return err
	}

	return nil
}

func QueryCurrentCard(db *sqlx.DB) (*Card, error) {
	card := Card{}

	err := db.Get(&card, "select * from cards where selected = true limit 1")
	if err != nil {
		return nil, err
	}

	return &card, nil
}

func QueryAllCards(db *sqlx.DB) ([]Card, error) {
	cards := []Card{}

	err := db.Select(&cards, "select * from cards")
	if err != nil {
		return nil, err
	}

	return cards, nil
}

func UpdateCurrentCard(db *sqlx.DB, cardId int) error {
	var selectedId int
	err := db.Get(&selectedId, "select card_id from cards where selected = true limit 1")
	if err != nil {
		return err
	}

	tx, err := db.Begin()
	if err != nil {
		return err
	}

	tx.Exec(`UPDATE cards SET selected = true WHERE card_id = ?`, cardId)
	tx.Exec(`UPDATE cards SET selected = false WHERE card_id = ?`, selectedId)

	err = tx.Commit()
	if err != nil {
		return err
	}

	return nil
}

func UpdateCardName(db *sqlx.DB, cardId int, name string) error {
	_, err := db.Exec(`UPDATE cards SET name=? WHERE card_id = ?`, name, cardId)
	return err
}

func QueryCard(db *sqlx.DB, cardId int) (*Card, error) {
	card := Card{}

	err := db.Get(&card, "select * from cards where cardId = ?", cardId)
	if err != nil {
		return nil, err
	}

	return &card, nil
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

func SaveChainAsset(db *bolt.DB, account, chain, asset string) error {
	return db.Update(func(tx *bolt.Tx) error {
		b := tx.Bucket([]byte(utils.BucketName))
		assets := string(b.Get([]byte(account + "_" + chain + "_assets")))
		if assets == "" {
			assets = asset
		} else {
			if !strings.Contains(assets, asset) {
				assets = assets + "," + asset
			}
		}
		b.Put([]byte(account+"_"+chain+"_assets"), []byte(assets))
		return nil
	})
}

func RemoveChainAsset(db *bolt.DB, account, chain, asset string) error {
	return db.Update(func(tx *bolt.Tx) error {
		b := tx.Bucket([]byte(utils.BucketName))
		assets := string(b.Get([]byte(account + "_" + chain + "_assets")))
		assets = strings.ReplaceAll(assets, asset, "")
		assets = strings.ReplaceAll(assets, ",,", ",")
		assets = strings.TrimSuffix(assets, ",")
		assets = strings.TrimPrefix(assets, ",")

		b.Put([]byte(account+"_"+chain+"_assets"), []byte(assets))
		return nil
	})
}
