import { atom } from "jotai";
import { utils } from "../../wailsjs/go/models";

export const ledgerAtom = atom("");

export const accountAtom = atom("");

export const showNewLedgerAtom = atom(false);

export const chainConfigsAtom = atom<utils.ChainConfig[]>([])

export const showSettingsAtom = atom(false);

export const isTestnetAtom = atom(false);
