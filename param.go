package main

type FeeInfo struct {
	Base string `json:"base"`
	Tip  string `json:"tip"`
}

type AssetInfo struct {
	Name    string   `json:"name"`
	Balance *string  `json:"balance"`
	Price   *float32 `json:"price"`
}

type ChainAssets struct {
	Address string      `json:"address"`
	Assets  []AssetInfo `json:"assets"`
}

type CardInfo struct {
	Id   int    `json:"id"`
	Name string `json:"name"`
}

type CardChainInfo struct {
	Chains            []string `json:"chains"`
	LastSelectedChain string   `json:"lastSelectedChain"`
}
