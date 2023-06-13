export const BITCOIN_SYMBOL = "BTC";
export const BITCOIN_INFO = {
    name: "Bitcoin",
}

export const ETHEREUM_SYMBOL = "ETH";
export const ETHEREUM_INFO = {
    name: "Ethereum",
}

export const POLYGON_SYMBOL = "MATIC";
export const POLYGON_INFO = {
    name: "Polygon",
}

export type LedgerInfo = {
    name: string;
}
export const LEDGERS = new Map<String, LedgerInfo>([
    [BITCOIN_SYMBOL, BITCOIN_INFO],
    [ETHEREUM_SYMBOL, ETHEREUM_INFO],
    [POLYGON_SYMBOL, POLYGON_INFO],
])
