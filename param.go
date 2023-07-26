package main

type FeeInfo struct {
	Base string `json:"base"`
	Tip  string `json:"tip"`
}

type AssetInfo struct {
	Name    string `json:"name"`
	Balance string `json:"balance"`
}

type ChainAssets struct {
	Address string      `json:"address"`
	Assets  []AssetInfo `json:"assets"`
}
