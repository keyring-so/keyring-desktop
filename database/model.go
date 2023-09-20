package database

import "database/sql"

type Card struct {
	Id          int `db:"card_id"`
	Name        string
	Selected    bool
	Puk         string
	PairingCode string `db:"pairing_code"`
	PairingKey  string `db:"pairing_key"`
	PairingIdx  string `db:"pairing_index"`
}

type Account struct {
	Id              int          `db:"account_id"`
	CardId          int          `db:"card_id"`
	ChainName       string       `db:"chain_name"`
	Address         string       `db:"address"`
	SelectedAccount sql.NullBool `db:"selected_account"`
}

type Asset struct {
	Id          int    `db:"asset_id"`
	AccountId   int    `db:"account_id"`
	TokenSymbol string `db:"token_symbol"`
}
