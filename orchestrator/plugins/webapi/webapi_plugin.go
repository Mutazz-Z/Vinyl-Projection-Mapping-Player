package webapi

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"
	"strings"

	"github.com/gorilla/websocket"
	"vinyl-orchestrator/core"
)

type MetadataResolver interface {
	FetchCleanMetadata(mediaResourceIdentifier string) (*core.VinylAlbumRecord, error)
	ValidateSystemCredentials() error
}

type AssetRouter interface {
	RegisterRoutes(mux *http.ServeMux)
}

type WebServerPlugin struct {
	systemDataSource  core.DataSource
	libraryRepository core.LibraryRepository
	httpServer        *http.Server
	metadataResolver  MetadataResolver
	assetRouter       AssetRouter
}

var websocketUpgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
}

func NewWebServerPlugin(resolver MetadataResolver, assetRouter AssetRouter) *WebServerPlugin {
	return &WebServerPlugin{
		metadataResolver: resolver,
		assetRouter:      assetRouter,
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
	requestRouter.HandleFunc("/api/system/test", plugin.handleConnectionTestRequest)
	requestRouter.HandleFunc("/api/config", plugin.handleSystemConfigurationRequests)
	requestRouter.HandleFunc("/api/config/ui", plugin.handleUiConfigurationRequests)

	requestRouter.HandleFunc("/ws", plugin.handleWebSockets)

	if plugin.assetRouter != nil {
		plugin.assetRouter.RegisterRoutes(requestRouter)
	}

	plugin.httpServer = &http.Server{
		Addr:    ":8080",
		Handler: plugin.enableCrossOriginRequests(requestRouter),
	}

	go plugin.startListeningForNetworkRequests()

	return nil
}

func (plugin *WebServerPlugin) handleWebSockets(responseWriter http.ResponseWriter, httpRequest *http.Request) {
	conn, upgradeError := websocketUpgrader.Upgrade(responseWriter, httpRequest, nil)
	if upgradeError != nil {
		fmt.Printf("WebSocket Upgrade Error: %v\n", upgradeError)
		return
	}
	defer conn.Close()

	clientContext, cancelClient := context.WithCancel(context.Background())
	defer cancelClient()

	topicsToSubscribe := []string{
		"projector_visual_update",
		"vinyl/shelf/visuals",
		"playback_progress",
		"playback_state",
		"playback_state_changed",
		"playback_state_update",
		"vinyl/shelf/visuals/progress",
		"vinyl/shelf/playback/state",
		"projector_mapping",
		"vinyl/shelf/mapping",
	}

	mergedEventChannel := make(chan core.Event, 100)

	for _, topic := range topicsToSubscribe {
		subChan := plugin.systemDataSource.Subscribe(topic)
		go func(c <-chan core.Event) {
			for event := range c {
				select {
				case <-clientContext.Done():
					return
				case mergedEventChannel <- event:
				}
			}
		}(subChan)
	}

	go func() {
		for {
			var incomingEvent core.Event
			err := conn.ReadJSON(&incomingEvent)
			if err != nil {
				cancelClient()
				break
			}
			if incomingEvent.Topic != "" {
				plugin.systemDataSource.Publish(incomingEvent.Topic, incomingEvent.Payload)
			}
		}
	}()

	for {
		select {
		case <-clientContext.Done():
			return
		case outgoingEvent := <-mergedEventChannel:
			if writeErr := conn.WriteJSON(outgoingEvent); writeErr != nil {
				cancelClient()
				return
			}
		}
	}
}

func (plugin *WebServerPlugin) startListeningForNetworkRequests() {
	fmt.Println("Web Server API Online: Listening on port 8080")
	serveError := plugin.httpServer.ListenAndServe()
	if serveError != nil && serveError != http.ErrServerClosed {
		fmt.Printf("Web Server API encountered a fatal error: %v\n", serveError)
	}
}

func (plugin *WebServerPlugin) handleSystemConfigurationRequests(responseWriter http.ResponseWriter, httpRequest *http.Request) {
	if httpRequest.Method == http.MethodGet {
		plugin.executeReadSystemConfigurationCommand(responseWriter)
		return
	}

	if httpRequest.Method == http.MethodPost {
		plugin.executeWriteSystemConfigurationCommand(responseWriter, httpRequest)
		return
	}

	http.Error(responseWriter, "Method Not Allowed", http.StatusMethodNotAllowed)
}

func (plugin *WebServerPlugin) executeReadSystemConfigurationCommand(responseWriter http.ResponseWriter) {
	var musicAssistantUrlString string
	var musicAssistantTokenString string
	var musicAssistantPlayerIdString string
	var mqttHostAddressString string
	var mqttWebSocketPortNumber int

	plugin.systemDataSource.Read("music_assistant_url", &musicAssistantUrlString)
	plugin.systemDataSource.Read("music_assistant_token", &musicAssistantTokenString)
	plugin.systemDataSource.Read("music_assistant_player_id", &musicAssistantPlayerIdString)
	plugin.systemDataSource.Read("mqtt_broker_host_address", &mqttHostAddressString)
	plugin.systemDataSource.Read("mqtt_websocket_port", &mqttWebSocketPortNumber)

	configurationPayload := map[string]string{
		"music_assistant_url":       musicAssistantUrlString,
		"music_assistant_token":     musicAssistantTokenString,
		"music_assistant_player_id": musicAssistantPlayerIdString,
		"mqtt_host":                 mqttHostAddressString,
		"mqtt_ws_port":              fmt.Sprintf("%d", mqttWebSocketPortNumber),
	}

	responseWriter.Header().Set("Content-Type", "application/json")
	json.NewEncoder(responseWriter).Encode(configurationPayload)
}

func (plugin *WebServerPlugin) executeWriteSystemConfigurationCommand(responseWriter http.ResponseWriter, httpRequest *http.Request) {
	var incomingConfigurationPayload map[string]string
	decodingError := json.NewDecoder(httpRequest.Body).Decode(&incomingConfigurationPayload)
	if decodingError != nil {
		http.Error(responseWriter, "Bad Request: Invalid JSON Payload", http.StatusBadRequest)
		return
	}

	writeErrors := plugin.persistConfigurationKeysToDataSource(incomingConfigurationPayload)
	if len(writeErrors) > 0 {
		http.Error(responseWriter, fmt.Sprintf("Partial write failure: %v", writeErrors), http.StatusInternalServerError)
		return
	}

	responseWriter.WriteHeader(http.StatusOK)
	fmt.Fprint(responseWriter, "Configuration saved successfully")
}

func (plugin *WebServerPlugin) persistConfigurationKeysToDataSource(incomingConfigurationPayload map[string]string) []error {
	var encounteredErrors []error

	stringKeyMappings := map[string]string{
		"music_assistant_url":       "music_assistant_url",
		"music_assistant_token":     "music_assistant_token",
		"music_assistant_player_id": "music_assistant_player_id",
		"mqtt_host":                 "mqtt_broker_host_address",
	}

	for incomingKey, registryKey := range stringKeyMappings {
		incomingValue, keyExistsInPayload := incomingConfigurationPayload[incomingKey]
		if !keyExistsInPayload {
			continue
		}
		if writeError := plugin.systemDataSource.Write(registryKey, incomingValue); writeError != nil {
			encounteredErrors = append(encounteredErrors, fmt.Errorf("failed to write %s: %v", registryKey, writeError))
		}
	}

	integerKeyMappings := map[string]string{
		"mqtt_ws_port":  "mqtt_websocket_port",
		"mqtt_tcp_port": "mqtt_tcp_port",
	}

	for incomingKey, registryKey := range integerKeyMappings {
		incomingStringValue, keyExistsInPayload := incomingConfigurationPayload[incomingKey]
		if !keyExistsInPayload {
			continue
		}
		parsedIntegerValue, parseError := strconv.Atoi(incomingStringValue)
		if parseError != nil {
			encounteredErrors = append(encounteredErrors, fmt.Errorf("failed to parse %s as integer: %v", incomingKey, parseError))
			continue
		}
		if writeError := plugin.systemDataSource.Write(registryKey, parsedIntegerValue); writeError != nil {
			encounteredErrors = append(encounteredErrors, fmt.Errorf("failed to write %s: %v", registryKey, writeError))
		}
	}

	return encounteredErrors
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
		responseWriter.Header().Set("Access-Control-Allow-Headers", "*")

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

func (plugin *WebServerPlugin) handleConnectionTestRequest(responseWriter http.ResponseWriter, httpRequest *http.Request) {
	if httpRequest.Method != http.MethodGet {
		http.Error(responseWriter, "Method Not Allowed", http.StatusMethodNotAllowed)
		return
	}

	validationError := plugin.metadataResolver.ValidateSystemCredentials()

	if validationError != nil {
		responseWriter.WriteHeader(http.StatusUnauthorized)
		fmt.Fprintf(responseWriter, "%v", validationError)
		return
	}

	responseWriter.WriteHeader(http.StatusOK)
	fmt.Fprintf(responseWriter, "Authentication Successful")
}

var uiMappingKeys = []string{
	"mapping_width", "mapping_height",
	"mapping_tlX", "mapping_tlY",
	"mapping_trX", "mapping_trY",
	"mapping_brX", "mapping_brY",
	"mapping_blX", "mapping_blY",
	"mapping_preset_tlX", "mapping_preset_tlY",
	"mapping_preset_trX", "mapping_preset_trY",
	"mapping_preset_brX", "mapping_preset_brY",
	"mapping_preset_blX", "mapping_preset_blY",
}

func (plugin *WebServerPlugin) handleUiConfigurationRequests(responseWriter http.ResponseWriter, httpRequest *http.Request) {
	if httpRequest.Method == http.MethodGet {
		plugin.executeReadUiConfigurationCommand(responseWriter)
		return
	}

	if httpRequest.Method == http.MethodPost {
		plugin.executeWriteUiConfigurationCommand(responseWriter, httpRequest)
		return
	}

	http.Error(responseWriter, "Method Not Allowed", http.StatusMethodNotAllowed)
}

func (plugin *WebServerPlugin) executeReadUiConfigurationCommand(responseWriter http.ResponseWriter) {
	configurationPayload := make(map[string]string, len(uiMappingKeys))

	for _, registryKey := range uiMappingKeys {
		var storedValue string
		plugin.systemDataSource.Read(registryKey, &storedValue)
		configurationPayload[registryKey] = storedValue
	}

	responseWriter.Header().Set("Content-Type", "application/json")
	json.NewEncoder(responseWriter).Encode(configurationPayload)
}

func (plugin *WebServerPlugin) executeWriteUiConfigurationCommand(responseWriter http.ResponseWriter, httpRequest *http.Request) {
	var incomingPayload map[string]string
	if decodingError := json.NewDecoder(httpRequest.Body).Decode(&incomingPayload); decodingError != nil {
		http.Error(responseWriter, "Bad Request: Invalid JSON Payload", http.StatusBadRequest)
		return
	}

	validKeySet := make(map[string]struct{}, len(uiMappingKeys))
	for _, registryKey := range uiMappingKeys {
		validKeySet[registryKey] = struct{}{}
	}

	var encounteredErrors []error
	for incomingKey, incomingValue := range incomingPayload {
		if _, isValidKey := validKeySet[incomingKey]; !isValidKey {
			continue
		}
		if writeError := plugin.systemDataSource.Write(incomingKey, incomingValue); writeError != nil {
			encounteredErrors = append(encounteredErrors, fmt.Errorf("failed to write %s: %v", incomingKey, writeError))
		}
	}

	if len(encounteredErrors) > 0 {
		http.Error(responseWriter, fmt.Sprintf("Partial write failure: %v", encounteredErrors), http.StatusInternalServerError)
		return
	}

	responseWriter.WriteHeader(http.StatusOK)
	fmt.Fprint(responseWriter, "UI configuration saved successfully")
}
