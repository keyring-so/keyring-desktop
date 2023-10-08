import { atom } from "jotai";
import { main, utils } from "@/../wailsjs/go/models";

export const ledgerAtom = atom("");

export const accountAtom = atom<main.CardInfo>({id: -1, name: ""});

export const showNewLedgerAtom = atom(false);

export const chainConfigsAtom = atom<utils.ChainConfig[]>([]);

export const isTestnetAtom = atom(false);

export const showSidebarItem = atom("");
