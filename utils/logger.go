package utils

import (
	"os"

	"go.uber.org/zap"
)

var Logger *zap.Logger
var Sugar *zap.SugaredLogger

func SetupLog() {
	var err error
	Logger, err = zap.NewDevelopment()
	if err != nil {
		os.Exit(1)
	}
	Sugar = Logger.Sugar()
}
