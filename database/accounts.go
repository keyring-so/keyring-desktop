package database

import (
	"github.com/jmoiron/sqlx"
	_ "modernc.org/sqlite"
)

func QeuryAccounts(db *sqlx.DB, cardId int) ([]Account, error) {
	accounts := []Account{}

	err := db.Select(&accounts, "select * from accounts where card_id = ?", cardId)
	if err != nil {
		return nil, err
	}

	return accounts, nil
}
