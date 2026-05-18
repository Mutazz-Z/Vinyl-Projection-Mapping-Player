package main

import (
	"database/sql"
	"fmt"
	"log"
	"os"
	"os/signal"
	"path/filepath"
	"syscall"
	"vinyl-orchestrator/globals"
	"vinyl-orchestrator/api"

	assetsServer "vinyl-orchestrator/assets_server"
	database "vinyl-orchestrator/database"
	orchestratormqtt "vinyl-orchestrator/mqtt"

	_ "modernc.org/sqlite"
)

func resolveDatabasePath() string {
	configuredPath := os.Getenv("VINYL_DATABASE_PATH")
	if configuredPath != "" {
		return configuredPath
	}

	candidates := []string{
		"./vinyl.database",
		"./builds/vinyl.database",
		"../builds/vinyl.database",
	}

	for _, candidate := range candidates {
		if _, statError := os.Stat(candidate); statError == nil {
			return candidate
		}
	}

	return "./vinyl.database"
}

func checkDatabaseForErrors(databaseOpenError error, databaseFailedToOpen bool) {
	databasePath := resolveDatabasePath()
	globals.Database, databaseOpenError = sql.Open("sqlite", databasePath)

	if databaseOpenError != nil {
		databaseFailedToOpen = true
	} else {
		databaseFailedToOpen = false
		if absolutePath, absolutePathError := filepath.Abs(databasePath); absolutePathError == nil {
			fmt.Printf("Database path: %s\n", absolutePath)
		} else {
			fmt.Printf("Database path: %s\n", databasePath)
		}
	}
}

func initializeDatabase() {
	var databaseOpenError error
	var databaseFailedToOpen bool
	checkDatabaseForErrors(databaseOpenError, databaseFailedToOpen)

	if databaseFailedToOpen {
		log.Fatal(databaseOpenError)
	}

	fmt.Println("Database initialized - ❖")
	database.SetupDatabase()
}

func waitForShutdownSignal() {
	signalChannel := make(chan os.Signal, 1)
	signal.Notify(signalChannel, syscall.SIGINT, syscall.SIGTERM)
	<-signalChannel
}

func main() {
	fmt.Println("⏺ Orchestrator starting...")
	initializeDatabase()

	api.StartConfigServer()

	assetsServer.StartAssetServer()
	orchestratormqtt.SetupMQTT()

	waitForShutdownSignal()
	fmt.Println("\n⏺ Shutting down orchestrator...")
}
