import { atom } from "jotai";
import { main, utils } from "@/../wailsjs/go/models";
import { SessionTypes, SignClientTypes } from "@walletconnect/types";

export const ledgerAtom = atom("");

export const accountAtom = atom<main.CardInfo>({ id: -1, name: "" });

export const showNewLedgerAtom = atom(false);

export const chainConfigsAtom = atom<utils.ChainConfig[]>([]);

export const isTestnetAtom = atom(false);

export const showSidebarItem = atom("");

export const refreshAtom = atom(false);

export const ledgerAddressAtom = atom({ledger: "", address: "", config: {} as utils.ChainConfig});

interface Data {
  proposal?: SignClientTypes.EventArguments["session_proposal"];
  requestEvent?: SignClientTypes.EventArguments["session_request"];
  requestSession?: SessionTypes.Struct;
}

export const walletConnectDataAtom = atom<Data>({})