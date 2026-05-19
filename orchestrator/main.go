package main

import (
	"context"
	"database/sql"
	"fmt"
	"os"
	"os/signal"
	"syscall"

	_ "github.com/mattn/go-sqlite3"

	"vinyl-orchestrator/application/playback"
	"vinyl-orchestrator/application/display"
	"vinyl-orchestrator/core"
	"vinyl-orchestrator/plugins/assets"
	"vinyl-orchestrator/plugins/database"
	"vinyl-orchestrator/plugins/homeassistant"
	"vinyl-orchestrator/plugins/mqtt"
	"vinyl-orchestrator/plugins/webapi"
)

func resolvePrimaryDatabaseFilePath() string {
	environmentalPath := os.Getenv("VINYL_DATABASE_PATH")
	if environmentalPath != "" {
		return environmentalPath
	}
	return "../builds/data/vinyl.database"
}

func main() {
	fmt.Println("Orchestrator Boot Sequence Initiated...")

	databaseFilePath := resolvePrimaryDatabaseFilePath()
	sharedDatabaseConnection, databaseConnectionError := sql.Open("sqlite3", databaseFilePath)
	if databaseConnectionError != nil {
		panic(fmt.Sprintf("Fatal Error: Could not establish database connection: %v", databaseConnectionError))
	}
	defer sharedDatabaseConnection.Close()

	systemDataSource, dataSourceInitializationError := database.NewSQLiteDataSource(sharedDatabaseConnection)
	if dataSourceInitializationError != nil {
		panic(fmt.Sprintf("Fatal Error: Could not initialize data source: %v", dataSourceInitializationError))
	}

	libraryRepository, repositoryInitializationError := database.NewSQLiteLibraryRepository(sharedDatabaseConnection)
	if repositoryInitializationError != nil {
		panic(fmt.Sprintf("Fatal Error: Could not initialize library repository: %v", repositoryInitializationError))
	}

	homeAssistantMediaAdapter := homeassistant.NewHomeAssistantAdapter()

	orchestratorPlugins := []core.Plugin{
		homeAssistantMediaAdapter,
		playback.NewPlaybackApplicationService(homeAssistantMediaAdapter),
		display.NewDisplayApplicationService(),
		mqtt.NewBrokerPlugin(),
		webapi.NewWebServerPlugin(),
		assets.NewAssetPlugin(),
	}

	applicationContext, cancelApplicationContext := context.WithCancel(context.Background())
	defer cancelApplicationContext()

	for _, currentPlugin := range orchestratorPlugins {
		fmt.Printf("Initializing Module: %s\n", currentPlugin.Name())

		initializationError := currentPlugin.Init(systemDataSource, libraryRepository)
		if initializationError != nil {
			panic(fmt.Sprintf("Fatal Error: %s failed to initialize: %v", currentPlugin.Name(), initializationError))
		}

		startupError := currentPlugin.StartPlugin(applicationContext)
		if startupError != nil {
			panic(fmt.Sprintf("Fatal Error: %s failed to start: %v", currentPlugin.Name(), startupError))
		}
	}

	fmt.Println("Orchestrator Boot Sequence Complete. All modules running.")

	shutdownSignalChannel := make(chan os.Signal, 1)
	signal.Notify(shutdownSignalChannel, syscall.SIGINT, syscall.SIGTERM)
	<-shutdownSignalChannel

	fmt.Println("\nReceived termination signal. Executing graceful shutdown sequence...")

	for index := len(orchestratorPlugins) - 1; index >= 0; index-- {
		pluginToStop := orchestratorPlugins[index]
		fmt.Printf("Stopping Module: %s\n", pluginToStop.Name())
		pluginToStop.StopPlugin(applicationContext)
	}

	fmt.Println("Graceful shutdown complete. Orchestrator terminated.")
}
