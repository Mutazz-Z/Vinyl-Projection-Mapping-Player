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
	"vinyl-orchestrator/application/errorMessages"
	"vinyl-orchestrator/application/mqtt"
	"vinyl-orchestrator/application/musicassistant"
	"vinyl-orchestrator/application/playback"
	"vinyl-orchestrator/application/webapi"
	widgetdata "vinyl-orchestrator/application/widgetData"
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
		panic(fmt.Sprintf("[Main]: Fatal Error: Could not establish database connection: %v", databaseConnectionError))
	}
	defer sharedDatabaseConnection.Close()

	systemDataSource, dataSourceInitializationError := database.NewSQLiteDataSource(sharedDatabaseConnection)
	if dataSourceInitializationError != nil {
		panic(fmt.Sprintf("[Main]: Fatal Error: Could not initialize data source: %v", dataSourceInitializationError))
	}

	AlbumLibrary, repositoryInitializationError := database.NewSQLiteAlbumLibrary(databaseFilePath)
	if repositoryInitializationError != nil {
		panic(fmt.Sprintf("[Main]: Fatal Error: Could not initialize library repository: %v", repositoryInitializationError))
	}

	assetPlugin := &assets.AssetPlugin{}
	musicAssistantPlugin := &musicassistant.MusicAssistantPlugin{}
	mqttPlugin := &mqtt.MqttPlugin_t{}
	playbackPlugin := &playback.PlaybackApplicationService{}
	playbackOverridenService := &errorMessages.PlaybackOverridenService{}

	displayPlugin := &display.DisplayApplicationService{}
	widgetDataPlugin := &widgetdata.WidgetDataPlugin{}
	assetPlugin.Init()
	webApiPlugin := webapi.NewWebServerPlugin(musicAssistantPlugin, assetPlugin)

	applicationContext, cancelApplicationContext := context.WithCancel(context.Background())
	defer cancelApplicationContext()

	musicAssistantPlugin.Init(applicationContext, systemDataSource)
	playbackPlugin.Init(systemDataSource, AlbumLibrary, musicAssistantPlugin)
	playbackOverridenService.Init(systemDataSource, AlbumLibrary)
	displayPlugin.Init(systemDataSource, AlbumLibrary)
	mqttPlugin.Init(systemDataSource, AlbumLibrary)
	webApiPlugin.Init(systemDataSource, AlbumLibrary)
	widgetDataPlugin.Init(systemDataSource, AlbumLibrary)

	webApiPlugin.StartPlugin(context.Background())

	fmt.Println("[Main]: Orchestrator Boot Sequence Complete. All modules running.")

	fmt.Println("[Main]: Server should be running now... waiting for signal")
	shutdownSignalChannel := make(chan os.Signal, 1)
	signal.Notify(shutdownSignalChannel, syscall.SIGINT, syscall.SIGTERM)
	<-shutdownSignalChannel

	fmt.Println("\n[Main]: Received termination signal. Executing graceful shutdown sequence...")

	webApiPlugin.StopPlugin(applicationContext)
	mqttPlugin.StopPlugin(applicationContext)
	playbackPlugin.StopPlugin(applicationContext)

	fmt.Println("[Main]: Graceful shutdown complete. Orchestrator terminated.")
}
