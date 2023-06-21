import { atom } from "jotai";
import { utils } from "../../wailsjs/go/models";

export const ledgerAtom = atom("");

export const accountAtom = atom("");

export const showNewLedgerAtom = atom(false);

export const chainConfigsAtom = atom<utils.ChainConfig[]>([])