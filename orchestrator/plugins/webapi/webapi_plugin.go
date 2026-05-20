package webapi

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"strings"

	"vinyl-orchestrator/core"
)

type MetadataResolver interface {
	FetchCleanMetadata(mediaUri string) (*core.VinylAlbumRecord, error)
}

type WebServerPlugin struct {
	systemDataSource  core.DataSource
	libraryRepository core.LibraryRepository
	httpServer        *http.Server
	metadataResolver  MetadataResolver
}

func NewWebServerPlugin(resolver MetadataResolver) *WebServerPlugin {
	return &WebServerPlugin{
		metadataResolver: resolver,
	}
}

func (plugin *WebServerPlugin) Name() string {
	return "Standard_HTTP_Web_API"
}

func (plugin *WebServerPlugin) Init(dataSource core.DataSource, libraryRepository core.LibraryRepository) error {
	plugin.systemDataSource = dataSource
	plugin.libraryRepository = libraryRepository
	return nil
}

func (plugin *WebServerPlugin) StartPlugin(applicationContext context.Context) error {
	requestRouter := http.NewServeMux()

	requestRouter.HandleFunc("/api/library", plugin.handleLibraryCollectionRequests)
	requestRouter.HandleFunc("/api/library/", plugin.handleSingleRecordRequests)
	requestRouter.HandleFunc("/api/metadata/resolve", plugin.handleMetadataResolutionRequest)

	plugin.httpServer = &http.Server{
		Addr:    ":8080",
		Handler: plugin.enableCrossOriginRequests(requestRouter),
	}

	go plugin.startListeningForNetworkRequests()

	return nil
}

func (plugin *WebServerPlugin) startListeningForNetworkRequests() {
	fmt.Println("Web Server API Online: Listening on port 8080")
	serveError := plugin.httpServer.ListenAndServe()
	if serveError != nil && serveError != http.ErrServerClosed {
		fmt.Printf("Web Server API encountered a fatal error: %v\n", serveError)
	}
}

func (plugin *WebServerPlugin) handleLibraryCollectionRequests(responseWriter http.ResponseWriter, httpRequest *http.Request) {
	if httpRequest.Method == http.MethodGet {
		plugin.executeFetchAllAlbumsCommand(responseWriter)
		return
	}

	if httpRequest.Method == http.MethodPost {
		plugin.executeSaveNewAlbumCommand(responseWriter, httpRequest)
		return
	}

	http.Error(responseWriter, "Method Not Allowed", http.StatusMethodNotAllowed)
}

func (plugin *WebServerPlugin) handleSingleRecordRequests(responseWriter http.ResponseWriter, httpRequest *http.Request) {
	pathSegments := strings.Split(httpRequest.URL.Path, "/")
	if len(pathSegments) < 4 {
		http.Error(responseWriter, "Bad Request: Missing Unique Identifier", http.StatusBadRequest)
		return
	}

	targetUniqueIdentifier := pathSegments[3]

	if httpRequest.Method == http.MethodDelete {
		plugin.executeDeleteAlbumCommand(responseWriter, targetUniqueIdentifier)
		return
	}

	http.Error(responseWriter, "Method Not Allowed", http.StatusMethodNotAllowed)
}

func (plugin *WebServerPlugin) handleMetadataResolutionRequest(responseWriter http.ResponseWriter, httpRequest *http.Request) {
	if httpRequest.Method != http.MethodGet {
		http.Error(responseWriter, "Method Not Allowed", http.StatusMethodNotAllowed)
		return
	}

	targetMediaUriString := httpRequest.URL.Query().Get("uri")
	if strings.TrimSpace(targetMediaUriString) == "" {
		http.Error(responseWriter, "Bad Request: Missing URI parameter", http.StatusBadRequest)
		return
	}

	resolvedAlbumRecord, resolutionError := plugin.metadataResolver.FetchCleanMetadata(targetMediaUriString)
	if resolutionError != nil {
		http.Error(responseWriter, fmt.Sprintf("Failed to resolve metadata: %v", resolutionError), http.StatusInternalServerError)
		return
	}

	responseWriter.Header().Set("Content-Type", "application/json")
	json.NewEncoder(responseWriter).Encode(resolvedAlbumRecord)
}

func (plugin *WebServerPlugin) extractMediaTypeFromUriString(targetUriString string) string {
	uriHalvesArray := strings.Split(targetUriString, "://")
	if len(uriHalvesArray) > 1 {
		pathSegmentsArray := strings.Split(uriHalvesArray[1], "/")
		if len(pathSegmentsArray) > 0 {
			return pathSegmentsArray[0]
		}
	}
	return "album"
}

func (plugin *WebServerPlugin) executeFetchAllAlbumsCommand(responseWriter http.ResponseWriter) {
	retrievedAlbumsList, retrievalError := plugin.libraryRepository.RetrieveAllSavedAlbums()
	if retrievalError != nil {
		http.Error(responseWriter, "Internal Server Error", http.StatusInternalServerError)
		return
	}

	if retrievedAlbumsList == nil {
		retrievedAlbumsList = []core.VinylAlbumRecord{}
	}

	responseWriter.Header().Set("Content-Type", "application/json")
	json.NewEncoder(responseWriter).Encode(retrievedAlbumsList)
}

func (plugin *WebServerPlugin) executeSaveNewAlbumCommand(responseWriter http.ResponseWriter, httpRequest *http.Request) {
	var incomingAlbumRecord core.VinylAlbumRecord
	decodingError := json.NewDecoder(httpRequest.Body).Decode(&incomingAlbumRecord)
	if decodingError != nil {
		http.Error(responseWriter, "Bad Request: Invalid JSON Payload", http.StatusBadRequest)
		return
	}

	saveError := plugin.libraryRepository.SaveAlbumRecord(incomingAlbumRecord)
	if saveError != nil {
		http.Error(responseWriter, "Internal Server Error", http.StatusInternalServerError)
		return
	}

	responseWriter.WriteHeader(http.StatusCreated)
	fmt.Fprintf(responseWriter, "Successfully saved %s", incomingAlbumRecord.AlbumTitle)
}

func (plugin *WebServerPlugin) executeDeleteAlbumCommand(responseWriter http.ResponseWriter, targetUniqueIdentifier string) {
	deleteError := plugin.libraryRepository.DeleteAlbumRecord(targetUniqueIdentifier)
	if deleteError != nil {
		http.Error(responseWriter, "Internal Server Error", http.StatusInternalServerError)
		return
	}

	responseWriter.WriteHeader(http.StatusOK)
	fmt.Fprintf(responseWriter, "Successfully deleted record %s", targetUniqueIdentifier)
}

func (plugin *WebServerPlugin) enableCrossOriginRequests(nextHandler http.Handler) http.Handler {
	return http.HandlerFunc(func(responseWriter http.ResponseWriter, httpRequest *http.Request) {
		responseWriter.Header().Set("Access-Control-Allow-Origin", "*")
		responseWriter.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		responseWriter.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")

		if httpRequest.Method == http.MethodOptions {
			responseWriter.WriteHeader(http.StatusOK)
			return
		}

		nextHandler.ServeHTTP(responseWriter, httpRequest)
	})
}

func (plugin *WebServerPlugin) StopPlugin(applicationContext context.Context) error {
	if plugin.httpServer != nil {
		return plugin.httpServer.Shutdown(applicationContext)
	}
	return nil
}
