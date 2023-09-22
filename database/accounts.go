package database

import (
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

func QueryChainAccount(db *sqlx.DB, cardId int, chain string) (*Account, error) {
	account := Account{}

	err := db.Get(
		&account,
		"select * from accounts where card_id = ? and chain_name = ? limit 1",
		cardId,
		chain,
	)
	if err != nil {
		return nil, err
	}

	return &account, nil
}

func UpdateSelectedAccount(db *sqlx.DB, cardId int, chainName string) error {
	var oldSelectedId int
	err := db.Get(&oldSelectedId, "select account_id from accounts where selected_account = true and card_id = ? limit 1", cardId)
	if err != nil {
		return err
	}

	tx, err := db.Begin()
	if err != nil {
		return err
	}

	tx.Exec(`UPDATE accounts SET selected_account = false WHERE account_id = ?`, oldSelectedId)
	tx.Exec(`UPDATE accounts SET selected_account = true WHERE card_id = ? and chain_name = ?`, cardId, chainName)

	err = tx.Commit()
	if err != nil {
		return err
	}

	return nil
}

func SaveChainAccount(db *sqlx.DB, cardId int, chainName string, address string) error {
	accounts := []Account{}

	err := db.Select(
		&accounts,
		"select * from accounts where card_id = ? and chain_name = ? and address = ? limit 1",
		cardId, chainName, address,
	)
	if err != nil {
		return err
	}
	if len(accounts) > 0 {
		return errors.New("account already exist")
	}

	tx, err := db.Begin()
	if err != nil {
		return err
	}

	res, _ := tx.Exec(
		"insert into accounts (card_id, chain_name, address, selected_account) values (?, ?, ?, ?)",
		cardId, chainName, address, true,
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

func ClearAccounts(db *sqlx.DB, cardId int) error {
	accountIds := []int{}
	err := db.Select(&accountIds, "select account_id from accounts where card_id = ?", cardId)
	if err != nil {
		return err
	}

	tx, err := db.Begin()
	if err != nil {
		return err
	}

	for _, accountId := range accountIds {
		_, err = tx.Exec(`delete from assets where account_id = ?`, accountId)
		if err != nil {
			return err
		}
	}

	_, err = tx.Exec(`delete from accounts where card_id = ?`, cardId)
	if err != nil {
		return err
	}

	_, err = tx.Exec(`delete from cards where card_id = ?`, cardId)
	if err != nil {
		return err
	}

	err = tx.Commit()
	if err != nil {
		return err
	}

	return err
}
