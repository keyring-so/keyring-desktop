package main

import (
	"errors"
	"log"

	"github.com/ebfe/scard"
)

func readCard(ctx *scard.Context) (*scard.Card, error) {
	log.Print("start read card\n")

	readers, err := ctx.ListReaders()
	if err != nil {
		return nil, err
	}

	log.Print("waiting for a card\n")
	if len(readers) == 0 {
		return nil, errors.New("no card read found")
	}

	index, err := waitForCard(ctx, readers)
	if err != nil {
		return nil, err
	}

	log.Printf("card found: %v\n", index)
	reader := readers[index]

	log.Printf("connectiong to card reader: %v\n", reader)
	card, err := ctx.Connect(reader, scard.ShareShared, scard.ProtocolAny)
	if err != nil {
		return nil, err
	}

	status, err := card.Status()
	if err != nil {
		return nil, err
	}

	switch status.ActiveProtocol {
	case scard.ProtocolT0:
		log.Print("card protocol", "T", "0")
	case scard.ProtocolT1:
		log.Print("card protocol", "T", "1")
	default:
		log.Print("card protocol", "T", "unknown")
	}

	return card, nil
}

func waitForCard(ctx *scard.Context, readers []string) (int, error) {
	rs := make([]scard.ReaderState, len(readers))

	for i := range rs {
		rs[i].Reader = readers[i]
		rs[i].CurrentState = scard.StateUnaware
	}

	for {
		for i := range rs {
			if rs[i].EventState&scard.StatePresent != 0 {
				return i, nil
			}

			rs[i].CurrentState = rs[i].EventState
		}

		err := ctx.GetStatusChange(rs, 1)
		if err != nil {
			return -1, err
		}
	}
}
