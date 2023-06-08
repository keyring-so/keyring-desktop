import { atom } from "jotai";

export type LedgerInfo = {
    symbol: string;
    name: string;
}
export const ledgerAtom = atom({symbol: "", name: ""});
