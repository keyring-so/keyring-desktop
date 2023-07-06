import bitcoin from "@/assets/blockchains/bitcoin/logo.png";
import ethereum from "@/assets/blockchains/ethereum/logo.png";
import polygon from "@/assets/blockchains/polygon/logo.png";
import usdc from "@/assets/blockchains/ethereum/tokens/usdc_logo.png";
import usdt from "@/assets/blockchains/ethereum/tokens/usdt_logo.png";
import hot from "@/assets/blockchains/ethereum/tokens/hot_logo.png";

export const BITCOIN_SYMBOL = "BTC";
export const BITCOIN_INFO = {
  name: "Bitcoin",
  img: bitcoin,
};

export const ETHEREUM_SYMBOL = "ETH";
export const ETHEREUM_INFO = {
  name: "Ethereum",
  img: ethereum,
};

export const POLYGON_SYMBOL = "MATIC";
export const POLYGON_INFO = {
  name: "Polygon",
  img: polygon,
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

export type TokenInfo = {
  name: string;
  img: string;
};

export const TOKENS = new Map<String, TokenInfo>([
  [BITCOIN_SYMBOL, BITCOIN_INFO],
  [ETHEREUM_SYMBOL, ETHEREUM_INFO],
  [POLYGON_SYMBOL, POLYGON_INFO],
  ["USDC", { name: "USD Coin", img: usdc }],
  ["USDT", { name: "Tether USD", img: usdt }],
  ["HOT", { name: "HoloToken", img: hot }],
]);
