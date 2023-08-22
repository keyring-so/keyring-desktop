package database

type AccountChainInfo struct {
	Chains            []string `json:"chains"`
	LastSelectedChain string   `json:"lastSelectedChain"`
}

type AccountCredential struct {
	Puk  string `json:"puk"`
	Code string `json:"code"`
}

type EncryptedPairingInfo struct {
	Key   string
	Index string
}

type AccountChainAssets struct {
	Address string   `json:"address"`
	Assets  []string `json:"assets"`
}
