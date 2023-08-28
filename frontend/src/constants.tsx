export const BITCOIN_SYMBOL = "BTC";
export const BITCOIN_INFO = {
  name: "Bitcoin",
  img: "build/assets/BTC_logo.png",
};

export const ETHEREUM_SYMBOL = "ETH";
export const ETHEREUM_INFO = {
  name: "Ethereum",
  img: "build/assets/ETH_logo.png",
};

export const POLYGON_SYMBOL = "MATIC";
export const POLYGON_INFO = {
  name: "Polygon",
  img: "build/assets/MATIC_logo.png",
};

export type LedgerInfo = {
  name: string;
  img: string;
};

export const LEDGERS = new Map<String, LedgerInfo>([
  [BITCOIN_SYMBOL, BITCOIN_INFO],
  [ETHEREUM_SYMBOL, ETHEREUM_INFO],
  [POLYGON_SYMBOL, POLYGON_INFO],
]);

export const GWEI = 1000_000_000;
