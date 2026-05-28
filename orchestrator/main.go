package main

import (
	"context"
	"database/sql"
	"fmt"
	"os"
	"os/signal"
	"syscall"

	_ "github.com/glebarez/go-sqlite"

	"vinyl-orchestrator/application/assets"
	"vinyl-orchestrator/application/database"
	"vinyl-orchestrator/application/display"
	"vinyl-orchestrator/application/mqtt"
	"vinyl-orchestrator/application/musicassistant"
	"vinyl-orchestrator/application/playback"
	"vinyl-orchestrator/application/webapi"
)

func resolvePrimaryDatabaseFilePath() string {
	environmentalPath := os.Getenv("VINYL_DATABASE_PATH")
	if environmentalPath != "" {
		return environmentalPath
	}
	return "./builds/data/vinyl.db"
}

func main() {
	fmt.Println("Orchestrator Boot Sequence Initiated...")

	databaseFilePath := resolvePrimaryDatabaseFilePath()
	sharedDatabaseConnection, databaseConnectionError := sql.Open("sqlite", databaseFilePath)
	if databaseConnectionError != nil {
		panic(fmt.Sprintf("Fatal Error: Could not establish database connection: %v", databaseConnectionError))
	}
	defer sharedDatabaseConnection.Close()

	systemDataSource, dataSourceInitializationError := database.NewSQLiteDataSource(sharedDatabaseConnection)
	if dataSourceInitializationError != nil {
		panic(fmt.Sprintf("Fatal Error: Could not initialize data source: %v", dataSourceInitializationError))
	}

	AlbumLibrary, repositoryInitializationError := database.NewSQLiteAlbumLibrary(databaseFilePath)
	if repositoryInitializationError != nil {
		panic(fmt.Sprintf("Fatal Error: Could not initialize library repository: %v", repositoryInitializationError))
	}

	assetPlugin := &assets.AssetPlugin{}
	musicAssistantClient := &musicassistant.MusicAssistantPlugin{}


	playbackPlugin := playback.NewPlaybackApplicationService(musicAssistantClient)
	displayPlugin := display.NewDisplayApplicationService()
	mqttPlugin := mqtt.NewBrokerPlugin()
	assetPlugin.Init()
	webApiPlugin := webapi.NewWebServerPlugin(musicAssistantClient, assetPlugin)

	applicationContext, cancelApplicationContext := context.WithCancel(context.Background())
	defer cancelApplicationContext()

	musicAssistantClient.Init(applicationContext, systemDataSource)
	playbackPlugin.Init(systemDataSource, AlbumLibrary)
	displayPlugin.Init(systemDataSource, AlbumLibrary)
	mqttPlugin.Init(systemDataSource, AlbumLibrary)
	webApiPlugin.Init(systemDataSource, AlbumLibrary)

	playbackPlugin.StartPlugin(context.Background())
	displayPlugin.StartPlugin(context.Background())
	mqttPlugin.StartPlugin(context.Background())
	webApiPlugin.StartPlugin(context.Background())

	fmt.Println("Orchestrator Boot Sequence Complete. All modules running.")

	fmt.Println("Server should be running now... waiting for signal")
	shutdownSignalChannel := make(chan os.Signal, 1)
	signal.Notify(shutdownSignalChannel, syscall.SIGINT, syscall.SIGTERM)
	<-shutdownSignalChannel

	fmt.Println("\nReceived termination signal. Executing graceful shutdown sequence...")

	webApiPlugin.StopPlugin(applicationContext)
	mqttPlugin.StopPlugin(applicationContext)
	displayPlugin.StopPlugin(applicationContext)
	playbackPlugin.StopPlugin(applicationContext)

	fmt.Println("Graceful shutdown complete. Orchestrator terminated.")
}
