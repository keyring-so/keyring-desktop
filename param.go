package main

type FeeInfo struct {
	Base string `json:"base"`
	Tip  string `json:"tip"`
}

type AssetInfo struct {
	ContractAddress string   `json:"contractAddress"`
	Symbol          string   `json:"symbol"`
	Img             string   `json:"img"`
	Balance         *string  `json:"balance"`
	Price           *float32 `json:"price"`
}

type ChainAssets struct {
	Address string      `json:"address"`
	Symbol  string      `json:"symbol"`
	Img     string      `json:"img"`
	Balance *string     `json:"balance"`
	Price   *float32    `json:"price"`
	Assets  []AssetInfo `json:"assets"`
}

type CardInfo struct {
	Id   int    `json:"id"`
	Name string `json:"name"`
}

type CardChainInfo struct {
	Chains            []ChainDetail `json:"chains"`
	LastSelectedChain string        `json:"lastSelectedChain"`
}

type ChainDetail struct {
	Name    string `json:"name"`
	Symbol  string `json:"symbol"`
	Img     string `json:"img"`
	Testnet bool   `json:"testnet"`
}

type CardCredential struct {
	Puk  string `json:"puk"`
	Code string `json:"code"`
}

type InitCardResponse struct {
	Mnemonic string   `json:"mnemonic"`
	CardInfo CardInfo `json:"cardInfo"`
}
