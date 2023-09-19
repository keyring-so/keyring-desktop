package database

import (
	"database/sql"
	"errors"

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

func UpdateSelectedAccount(db *sqlx.DB, cardId int, chainName string) error {
	var oldSelectedId int
	saErr := db.Get(&oldSelectedId, "select account_id from accounts where selected_account = true limit 1")

	tx, err := db.Begin()
	if err != nil {
		return err
	}

	tx.Exec(`UPDATE accounts SET selected_account = true WHERE card_id = ? and chain_name = ?`, cardId, chainName)
	if saErr == nil {
		tx.Exec(`UPDATE accounts SET selected_account = false WHERE account_id = ?`, oldSelectedId)
	}

	err = tx.Commit()
	if err != nil {
		return err
	}

	return nil
}

func SaveChainAccount(db *sqlx.DB, cardId int, chainName string, address string) error {
	account := Account{}
	err := db.Get(
		&account,
		"select * from accounts where card_id = ? and chain_name = ? and address = ? limit 1",
		cardId, chainName, address,
	)

	if err == nil {
		return errors.New("account already exist")
	}

	// errors other than ErrNoRows
	if err != sql.ErrNoRows {
		return err
	}

	// account is not exist, insert it
	tx, err := db.Begin()
	if err != nil {
		return err
	}

	res, _ := tx.Exec(
		"insert into accounts (card_id, chain_name, addr, selected_account) values (?, ?, ?, true)",
		cardId, chainName, address,
	)
	accountId, _ := res.LastInsertId()
	tx.Exec(
		"insert into assets (account_id, token_symbol) values (?, ?)",
		accountId, chainName,
	)

	err = tx.Commit()
	if err != nil {
		return err
	}

	return nil
}
