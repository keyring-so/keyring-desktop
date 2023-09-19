package database

import (
	"github.com/jmoiron/sqlx"
	_ "modernc.org/sqlite"
)

func SaveAsset(db *sqlx.DB, cardId int, chain, address, asset string) error {
	var accountId int
	err := db.Get(&accountId, "select account_id from accounts where cardId = ? and chain_name = ? and addr = ?", cardId, chain, address)
	if err != nil {
		return err
	}

	_, err = db.Exec(
		"insert into assets (account_id, token_symbol) values (?, ?)",
		accountId, asset,
	)
	if err != nil {
		return err
	}

	return nil
}

func QueryAssets(db *sqlx.DB, cardId int, chain, address string) ([]Asset, error) {
	var accountId int
	err := db.Get(&accountId, "select account_id from accounts where cardId = ? and chain_name = ? and addr = ?", cardId, chain, address)
	if err != nil {
		return nil, err
	}

	assets := []Asset{}

	err = db.Select(&assets, "select * from assets where account_id = ?", accountId)
	if err != nil {
		return nil, err
	}

	return assets, nil
}

func RemoveAsset(db *sqlx.DB, cardId int, chain, address, asset string) error {
	var accountId int
	err := db.Get(&accountId, "select account_id from accounts where cardId = ? and chain_name = ? and addr = ?", cardId, chain, address)
	if err != nil {
		return err
	}

	_, err = db.Exec(
		"delete from assets where account_id = ? and token_symbol = ?",
		accountId, asset,
	)
	if err != nil {
		return err
	}

	return nil
}
