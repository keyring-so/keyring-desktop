package database

type AccountChainInfo struct {
	Chains            []string `json:"chains"`
	LastSelectedChain string   `json:"lastSelectedChain"`
}

type AccountCredential struct {
	Pin  string `json:"pin"`
	Puk  string `json:"puk"`
	Code string `json:"code"`
}
