package utils

import "math/rand"

const letterBytes = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ"
const numberBytes = "0123456789"

func RandStringBytes(n int, bytes string) string {
	b := make([]byte, n)
	for i := range b {
		b[i] = letterBytes[rand.Intn(len(bytes))]
	}
	return string(b)
}

func GenPuk() string {
	return RandStringBytes(12, numberBytes)
}

func GenPairingCode() string {
	return RandStringBytes(24, letterBytes)
}
