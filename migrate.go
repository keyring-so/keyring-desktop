package main

import (
	"keyring-desktop/utils"
	"net/url"

	"github.com/kaichaosun/dbmate/pkg/dbmate"
	_ "github.com/kaichaosun/dbmate/pkg/driver/sqlite"
)

func DbMigrate() {
	dbPath, err := utils.SQLiteDatabasePath()
	if err != nil {
		utils.Sugar.Fatal(err)
	}
	u, _ := url.Parse("sqlite:" + dbPath)
	db := dbmate.New(u)
	db.FS = migrations

	utils.Sugar.Info("Migrations:")
	migrations, err := db.FindMigrations()
	if err != nil {
		utils.Sugar.Fatal(err)
	}
	for _, m := range migrations {
		utils.Sugar.Infof("%s  %s", m.Version, m.FilePath)
	}

	utils.Sugar.Info("Applying...")
	err = db.CreateAndMigrate()
	if err != nil {
		utils.Sugar.Fatal(err)
	}
}
