package main

import (
	"database/sql"
	"fmt"
	"log"
	"os"
	"os/signal"
	"syscall"
	"vinyl-orchestrator/globals"
	orchestratormqtt "vinyl-orchestrator/mqtt"

	_ "modernc.org/sqlite"
)

func checkDatabaseForErrors(databaseOpenError error, databaseFailedToOpen bool) {
	globals.Database, databaseOpenError = sql.Open("sqlite", "./vinyl.database")

	if databaseOpenError != nil {
		databaseFailedToOpen = true
	} else {
		databaseFailedToOpen = false
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
	setupDatabase()
}

func waitForShutdownSignal() {
	signalChannel := make(chan os.Signal, 1)
	signal.Notify(signalChannel, syscall.SIGINT, syscall.SIGTERM)
	<-signalChannel
}

func main() {
	fmt.Println("⏺ Orchestrator starting...")
	initializeDatabase()
	orchestratormqtt.SetupMQTT()
	waitForShutdownSignal()
	fmt.Println("\n⏺ Shutting down orchestrator...")
}
