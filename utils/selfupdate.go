package utils

import (
	"fmt"
	"io/ioutil"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"runtime"
	"strings"
	"time"

	"github.com/fynelabs/selfupdate"
)

const Version = "0.1.5"
const PackageMac = "keyring-wallet-darwin.app.zip"
const FileURL = "https://github.com/keyring-so/keyring-desktop/releases/download/v0.1.1/keyring-wallet-darwin.app.zip"
const VersionURL = "https://github.com/keyring-so/keyring-desktop/releases/download/v0.1.1/version"
const Suffix = "Keyring Wallet.app/Contents/MacOS/Keyring Wallet"

func DoSelfUpdate() error {
	selfupdate.LogError = log.Printf
	selfupdate.LogInfo = log.Printf
	selfupdate.LogDebug = log.Printf

	fmt.Println("start")

	httpSource := selfupdate.NewFileSource(nil, FileURL, VersionURL)
	homeDir, _ := os.UserHomeDir()
	downloadPath := ""
	trimContent := ""
	if runtime.GOOS == "darwin" {
		downloadPath = filepath.Join(homeDir, "Downloads", PackageMac)
		trimContent = Suffix
	}

	version := selfupdate.Version{Number: Version}
	config := &selfupdate.Config{
		Current:      &version,
		Source:       httpSource,
		Schedule:     selfupdate.Schedule{FetchOnStart: true, Interval: time.Minute * time.Duration(60)},
		PublicKey:    nil,
		DownloadPath: downloadPath,
		TrimContent:  trimContent,

		ProgressCallback:       func(f float64, err error) { fmt.Println("Download", f) },
		RestartConfirmCallback: func() bool { return true },
		UpgradeConfirmCallback: func(_ string) bool { return true },
		ExitCallback:           func(_ error) { os.Exit(1) },
	}

	_, err := selfupdate.Manage(config)
	if err != nil {
		fmt.Println("Error while setting up update manager: ", err)
		return err
	}

	return nil
}

func CheckForUpdate() (bool, error) {
	resp, err := http.Get(VersionURL)
	if err != nil {
		return false, err
	}
	defer resp.Body.Close()

	body, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		return false, err
	}

	latest := strings.TrimSpace(string(body))
	shouldUpdate := latest > Version

	return shouldUpdate, nil
}
