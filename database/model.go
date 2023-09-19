package database

import "database/sql"

type AccountCredential struct {
	Puk  string `json:"puk"`
	Code string `json:"code"`
}

type EncryptedPairingInfo struct {
	Key   string
	Index string
}

type AccountChainAssets struct {
	Address string   `json:"address"`
	Assets  []string `json:"assets"`
}

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
	Address         string       `db:"addr"`
	SelectedChain   sql.NullBool `db:"selected_chain"`
	SelectedAccount sql.NullBool `db:"selected_account"`
}
