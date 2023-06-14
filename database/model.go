package database

type AccountChainInfo struct {
	Chain   string `json:"chain"`
	Address string `json:"address"`
}

type AccountCredential struct {
	Pin  string `json:"pin"`
	Puk  string `json:"puk"`
	Code string `json:"code"`
}
