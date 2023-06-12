package main

import (
	"log"

	keycard "github.com/status-im/keycard-go"
)

// keycard-select
// keycard-set-secrets 123456 123456789012 KeycardDefaultPairing
// keycard-pair
// keycard-open-secure-channel
// keycard-verify-pin {{ session_pin }}
// keycard-unpair {{ session_pairing_index }}
func (i *CardSigner) pair(pin string, puk string, code string) error {
	log.Printf("pairing started\n", pin, puk, code)
	cmdSet := keycard.NewCommandSet(i.c)

	log.Printf("select keycard applet\n")
	err := cmdSet.Select()
	if err != nil {
		log.Printf("Error: %s\n", err)
		return err
	}

	if !cmdSet.ApplicationInfo.Installed {
		log.Printf("installation is not done, error: %s\n", errAppletNotInstalled)
		return errAppletNotInstalled
	}

	if !cmdSet.ApplicationInfo.Initialized {
		log.Printf("initialization is not done, error: %s\n", errCardAlreadyInitialized)
		return errCardAlreadyInitialized
	}

	secrets := keycard.NewSecrets(pin, puk, code)

	log.Printf("pairing\n")
	err = cmdSet.Pair(secrets.PairingPass())
	if err != nil {
		log.Fatal(err)
		return err
	}

	if cmdSet.PairingInfo == nil {
		log.Printf("cannot open secure channel without setting pairing info")
		return err
	}

	log.Printf("open keycard secure channel\n")
	if err := cmdSet.OpenSecureChannel(); err != nil {
		log.Printf("open keycard secure channel failed, error: %s\n", err)
		return err
	}

	log.Printf("verify PIN\n")
	if err := cmdSet.VerifyPIN(pin); err != nil {
		log.Printf("verify PIN failed, error: %s\n", err)
		return err
	}

	log.Printf("unpair index\n")
	err = cmdSet.Unpair(uint8(cmdSet.PairingInfo.Index))
	if err != nil {
		log.Printf("unpair failed, error: %s\n", err)
		return err
	}

	return nil
}
