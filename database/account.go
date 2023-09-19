package database

import (
	"database/sql"
	"keyring-desktop/utils"
	"strings"

	"github.com/jmoiron/sqlx"
	bolt "go.etcd.io/bbolt"
	_ "modernc.org/sqlite"
)

// create table if not exists cards (
//     card_id integer primary key,
//     name text not null unique,
//     selected boolean not null,
//     puk text,
//     pairing_code text,
//     pairing_key text,
//     pairing_index integer
// );

type Card struct {
	Id          int `db:"card_id"`
	Name        string
	Selected    bool
	Puk         sql.NullString
	PairingCode sql.NullString `db:"pairing_code"`
	PairingKey  sql.NullString `db:"pairing_key"`
	PairingIdx  sql.NullInt32  `db:"pairing_index"`
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

	tx.Exec(`UPDATE cards SET selected=true WHERE card_id = ?`, cardId)
	tx.Exec(`UPDATE cards SET selected=false WHERE card_id = ?`, selectedId)

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

func QueryCurrentAccount(db *bolt.DB) (string, error) {
	var account string

	err := db.View(func(tx *bolt.Tx) error {
		b := tx.Bucket([]byte(utils.BucketName))
		account = string(b.Get([]byte(utils.DbCurrentAccountKey)))
		return nil
	})
	if err != nil {
		return "", err
	}

	return account, nil
}

func SaveCurrentAccount(db *bolt.DB, accountId string) error {
	err := db.Update(func(tx *bolt.Tx) error {
		b := tx.Bucket([]byte(utils.BucketName))
		return b.Put([]byte(utils.DbCurrentAccountKey), []byte(accountId))
	})

	return err
}

func QueryAllAccounts(db *bolt.DB) ([]string, error) {
	var accounts string
	err := db.View(func(tx *bolt.Tx) error {
		b := tx.Bucket([]byte(utils.BucketName))
		accounts = string(b.Get([]byte(utils.DbAllAccountsKey)))
		return nil
	})
	if err != nil {
		return nil, err
	}

	arr := []string{}
	if accounts != "" {
		arr = strings.Split(accounts, ",")
	}
	return arr, nil
}

func QueryChains(db *bolt.DB, account string) (*AccountChainInfo, error) {
	var chains string
	var lastSelectedChain string

	err := db.View(func(tx *bolt.Tx) error {
		b := tx.Bucket([]byte(utils.BucketName))
		lastSelectedChain = string(b.Get([]byte(account + "last_selected_chain")))
		chains = string(b.Get([]byte(account + "_chains")))
		return nil
	})
	if err != nil {
		return nil, err
	}

	chainArray := []string{}
	if chains != "" {
		chainArray = strings.Split(chains, ",")
	}
	res := &AccountChainInfo{
		Chains:            chainArray,
		LastSelectedChain: lastSelectedChain,
	}
	return res, nil
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

func SaveLastSelectedChain(db *bolt.DB, account, chain string) error {
	return db.Update(func(tx *bolt.Tx) error {
		b := tx.Bucket([]byte(utils.BucketName))
		b.Put([]byte(account+"last_selected_chain"), []byte(chain))
		return nil
	})
}

func SaveChainAddress(db *bolt.DB, account, chain, address string) error {
	return db.Update(func(tx *bolt.Tx) error {
		b := tx.Bucket([]byte(utils.BucketName))
		b.Put([]byte(account+"last_selected_chain"), []byte(chain))
		b.Put([]byte(account+"_"+chain+"_address"), []byte(address))
		b.Put([]byte(account+"_"+chain+"_assets"), []byte(chain))
		chains := string(b.Get([]byte(account + "_chains")))
		if chains == "" {
			chains = chain
		} else {
			if !strings.Contains(chains, chain) {
				chains = chains + "," + chain
			}
		}
		b.Put([]byte(account+"_chains"), []byte(chains))
		return nil
	})
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

func UpdateAccountName(db *bolt.DB, accountId, accountName string) error {
	return db.Update(func(tx *bolt.Tx) error {
		b := tx.Bucket([]byte(utils.BucketName))
		b.Put([]byte(accountId+"_name"), []byte(accountName))
		return nil
	})
}

func QueryAccountName(db *bolt.DB, accountId string) (string, error) {
	var name string

	err := db.View(func(tx *bolt.Tx) error {
		b := tx.Bucket([]byte(utils.BucketName))
		name = string(b.Get([]byte(accountId + "_name")))
		return nil
	})
	if err != nil {
		return "", err
	}

	return name, nil
}
