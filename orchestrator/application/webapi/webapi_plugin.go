package webapi

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"
	"strings"

	"vinyl-orchestrator/core"

	"github.com/gorilla/websocket"
)

type MetadataResolver interface {
	FetchCleanMetadata(mediaResourceIdentifier string) (*core.VinylAlbumRecord, error)
	ValidateSystemCredentials() error
	GetAvailablePlayers() (interface{}, error)
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
	CheckOrigin: func(r *http.Request) bool { return true },
}

func NewWebServerPlugin(resolver MetadataResolver, assetRouter AssetRouter) *WebServerPlugin {
	return &WebServerPlugin{
		metadataResolver: resolver,
		assetRouter:      assetRouter,
	}
}

func (plugin *WebServerPlugin) Name() string { return "Standard_HTTP_Web_API" }

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
	requestRouter.HandleFunc("/api/players", plugin.handleAvailablePlayersRequest)
	requestRouter.HandleFunc("/api/config", plugin.handleSystemConfigurationRequests)
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

type DataSourceMessage struct {
	Action string      `json:"action"`
	Key    string      `json:"key,omitempty"`
	Topic  string      `json:"topic,omitempty"`
	Value  interface{} `json:"value,omitempty"`
	ReqID  string      `json:"req_id,omitempty"`
}

type DataSourceResponse struct {
	Action   string      `json:"action"`
	Key      string      `json:"key,omitempty"`
	Value    interface{} `json:"value,omitempty"`
	DataType string      `json:"data_type,omitempty"`
	Error    string      `json:"error,omitempty"`
	ReqID    string      `json:"req_id,omitempty"`
}

func isDataSourceMessage(raw json.RawMessage) bool {
	var probe struct {
		Action string `json:"action"`
	}
	if err := json.Unmarshal(raw, &probe); err != nil {
		return false
	}
	return probe.Action == "read" || probe.Action == "write" || probe.Action == "subscribe"
}

func (plugin *WebServerPlugin) handleAvailablePlayersRequest(responseWriter http.ResponseWriter, httpRequest *http.Request) {
	if httpRequest.Method != http.MethodGet {
		http.Error(responseWriter, "Method Not Allowed", http.StatusMethodNotAllowed)
		return
	}

	players, err := plugin.metadataResolver.GetAvailablePlayers()
	if err != nil {
		http.Error(responseWriter, err.Error(), http.StatusInternalServerError)
		return
	}

	responseWriter.Header().Set("Content-Type", "application/json")
	json.NewEncoder(responseWriter).Encode(players)
}

func (plugin *WebServerPlugin) handleDataSourceMessage(
	msg DataSourceMessage,
	mergedEventChannel chan core.Event,
	responseChan chan DataSourceResponse,
	clientContext context.Context,
) {
	switch msg.Action {

	case "read":
		var value interface{}
		err := plugin.systemDataSource.Read(msg.Key, &value)
		if err != nil {
			responseChan <- DataSourceResponse{
				Action: "read_error",
				Key:    msg.Key,
				Error:  err.Error(),
				ReqID:  msg.ReqID,
			}
			return
		}
		dataTypeStr := ""
		if def, ok := core.SystemRegistry[msg.Key]; ok {
			dataTypeStr = def.DataType.String()
		}
		responseChan <- DataSourceResponse{
			Action:   "read_response",
			Key:      msg.Key,
			Value:    value,
			DataType: dataTypeStr,
			ReqID:    msg.ReqID,
		}

	case "write":
		if err := plugin.systemDataSource.Write(msg.Key, msg.Value); err != nil {
			fmt.Printf("DataSource bridge write error [%s]: %v\n", msg.Key, err)
		}

	case "subscribe":
		subChan := plugin.systemDataSource.Subscribe(msg.Topic)
		go func() {
			for {
				select {
				case <-clientContext.Done():
					return
				case event, ok := <-subChan:
					if !ok {
						return
					}
					select {
					case <-clientContext.Done():
						return
					case mergedEventChannel <- event:
					}
				}
			}
		}()
	}
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

	mergedEventChannel := make(chan core.Event, 100)
	responseChan := make(chan DataSourceResponse, 20)

	dsChan := plugin.systemDataSource.Subscribe("datasource")
	go func(c <-chan core.Event) {
		for event := range c {
			select {
			case <-clientContext.Done():
				return
			case mergedEventChannel <- event:
			}
		}
	}(dsChan)

	go func() {
		for {
			_, rawBytes, readErr := conn.ReadMessage()
			if readErr != nil {
				cancelClient()
				return
			}

			if isDataSourceMessage(json.RawMessage(rawBytes)) {
				var dsMsg DataSourceMessage
				if err := json.Unmarshal(rawBytes, &dsMsg); err == nil {
					plugin.handleDataSourceMessage(dsMsg, mergedEventChannel, responseChan, clientContext)
				}
				continue
			}

			var incomingEvent core.Event
			if err := json.Unmarshal(rawBytes, &incomingEvent); err == nil {
				if incomingEvent.Topic != "" {
					plugin.systemDataSource.Publish(incomingEvent.Topic, incomingEvent.Payload)
				}
			}
		}
	}()

	for {
		select {
		case <-clientContext.Done():
			return
		case response := <-responseChan:
			if writeErr := conn.WriteJSON(response); writeErr != nil {
				cancelClient()
				return
			}
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
	if serveError := plugin.httpServer.ListenAndServe(); serveError != nil && serveError != http.ErrServerClosed {
		fmt.Printf("Web Server API encountered a fatal error: %v\n", serveError)
	}
}

func (plugin *WebServerPlugin) handleSystemConfigurationRequests(responseWriter http.ResponseWriter, httpRequest *http.Request) {
	switch httpRequest.Method {
	case http.MethodGet:
		plugin.executeReadSystemConfigurationCommand(responseWriter)
	case http.MethodPost:
		plugin.executeWriteSystemConfigurationCommand(responseWriter, httpRequest)
	default:
		http.Error(responseWriter, "Method Not Allowed", http.StatusMethodNotAllowed)
	}
}

func (plugin *WebServerPlugin) executeReadSystemConfigurationCommand(responseWriter http.ResponseWriter) {
	var maUrl, maToken, maPlayerId, mqttHost string
	var mqttWsPort int

	plugin.systemDataSource.Read("GLOBAL_MusicAssistantUrl", &maUrl)
	plugin.systemDataSource.Read("GLOBAL_MusicAssistantToken", &maToken)
	plugin.systemDataSource.Read("GLOBAL_MusicAssistantTargetPlayerId", &maPlayerId)
	plugin.systemDataSource.Read("GLOBAL_MqttBrokerHostAddress", &mqttHost)
	plugin.systemDataSource.Read("GLOBAL_MqttWebSocketPort", &mqttWsPort)

	responseWriter.Header().Set("Content-Type", "application/json")
	json.NewEncoder(responseWriter).Encode(map[string]string{
		"GLOBAL_MusicAssistantUrl":            maUrl,
		"GLOBAL_MusicAssistantToken":          maToken,
		"GLOBAL_MusicAssistantTargetPlayerId": maPlayerId,
		"mqtt_host":                           mqttHost,
		"mqtt_ws_port":                        fmt.Sprintf("%d", mqttWsPort),
	})
}

func (plugin *WebServerPlugin) executeWriteSystemConfigurationCommand(responseWriter http.ResponseWriter, httpRequest *http.Request) {
	var payload map[string]string
	if err := json.NewDecoder(httpRequest.Body).Decode(&payload); err != nil {
		http.Error(responseWriter, "Bad Request: Invalid JSON Payload", http.StatusBadRequest)
		return
	}
	if errs := plugin.persistConfigurationKeysToDataSource(payload); len(errs) > 0 {
		http.Error(responseWriter, fmt.Sprintf("Partial write failure: %v", errs), http.StatusInternalServerError)
		return
	}
	responseWriter.WriteHeader(http.StatusOK)
	fmt.Fprint(responseWriter, "Configuration saved successfully")
}

func (plugin *WebServerPlugin) persistConfigurationKeysToDataSource(payload map[string]string) []error {
	var errs []error

	stringKeys := map[string]string{
		"GLOBAL_MusicAssistantUrl":            "GLOBAL_MusicAssistantUrl",
		"GLOBAL_MusicAssistantToken":          "GLOBAL_MusicAssistantToken",
		"GLOBAL_MusicAssistantTargetPlayerId": "GLOBAL_MusicAssistantTargetPlayerId",
		"mqtt_host":                           "GLOBAL_MqttBrokerHostAddress",
	}
	for inKey, regKey := range stringKeys {
		if v, ok := payload[inKey]; ok {
			if err := plugin.systemDataSource.Write(regKey, v); err != nil {
				errs = append(errs, fmt.Errorf("failed to write %s: %v", regKey, err))
			}
		}
	}

	intKeys := map[string]string{
		"mqtt_ws_port":       "GLOBAL_MqttWebSocketPort",
		"GLOBAL_MqttTcpPort": "GLOBAL_MqttTcpPort",
	}
	for inKey, regKey := range intKeys {
		if sv, ok := payload[inKey]; ok {
			iv, err := strconv.Atoi(sv)
			if err != nil {
				errs = append(errs, fmt.Errorf("failed to parse %s as int: %v", inKey, err))
				continue
			}
			if err := plugin.systemDataSource.Write(regKey, iv); err != nil {
				errs = append(errs, fmt.Errorf("failed to write %s: %v", regKey, err))
			}
		}
	}
	return errs
}

func (plugin *WebServerPlugin) handleLibraryCollectionRequests(responseWriter http.ResponseWriter, httpRequest *http.Request) {
	switch httpRequest.Method {
	case http.MethodGet:
		plugin.executeFetchAllAlbumsCommand(responseWriter)
	case http.MethodPost:
		plugin.executeSaveNewAlbumCommand(responseWriter, httpRequest)
	default:
		http.Error(responseWriter, "Method Not Allowed", http.StatusMethodNotAllowed)
	}
}

func (plugin *WebServerPlugin) handleSingleRecordRequests(responseWriter http.ResponseWriter, httpRequest *http.Request) {
	parts := strings.Split(httpRequest.URL.Path, "/")
	if len(parts) < 4 {
		http.Error(responseWriter, "Bad Request: Missing Unique Identifier", http.StatusBadRequest)
		return
	}
	uid := parts[3]
	if httpRequest.Method == http.MethodDelete {
		plugin.executeDeleteAlbumCommand(responseWriter, uid)
		return
	}
	http.Error(responseWriter, "Method Not Allowed", http.StatusMethodNotAllowed)
}

func (plugin *WebServerPlugin) handleMetadataResolutionRequest(responseWriter http.ResponseWriter, httpRequest *http.Request) {
	if httpRequest.Method != http.MethodGet {
		http.Error(responseWriter, "Method Not Allowed", http.StatusMethodNotAllowed)
		return
	}
	uri := httpRequest.URL.Query().Get("uri")
	if strings.TrimSpace(uri) == "" {
		http.Error(responseWriter, "Bad Request: Missing URI parameter", http.StatusBadRequest)
		return
	}
	record, err := plugin.metadataResolver.FetchCleanMetadata(uri)
	if err != nil {
		http.Error(responseWriter, fmt.Sprintf("Failed to resolve metadata: %v", err), http.StatusInternalServerError)
		return
	}
	responseWriter.Header().Set("Content-Type", "application/json")
	json.NewEncoder(responseWriter).Encode(record)
}

func (plugin *WebServerPlugin) executeFetchAllAlbumsCommand(responseWriter http.ResponseWriter) {
	albums, err := plugin.libraryRepository.RetrieveAllSavedAlbums()
	if err != nil {
		http.Error(responseWriter, "Internal Server Error", http.StatusInternalServerError)
		return
	}
	if albums == nil {
		albums = []core.VinylAlbumRecord{}
	}
	responseWriter.Header().Set("Content-Type", "application/json")
	json.NewEncoder(responseWriter).Encode(albums)
}

func (plugin *WebServerPlugin) executeSaveNewAlbumCommand(responseWriter http.ResponseWriter, httpRequest *http.Request) {
	var record core.VinylAlbumRecord
	if err := json.NewDecoder(httpRequest.Body).Decode(&record); err != nil {
		http.Error(responseWriter, "Bad Request: Invalid JSON Payload", http.StatusBadRequest)
		return
	}
	if err := plugin.libraryRepository.SaveAlbumRecord(record); err != nil {
		http.Error(responseWriter, "Internal Server Error", http.StatusInternalServerError)
		return
	}
	responseWriter.WriteHeader(http.StatusCreated)
	fmt.Fprintf(responseWriter, "Successfully saved %s", record.AlbumTitle)
}

func (plugin *WebServerPlugin) executeDeleteAlbumCommand(responseWriter http.ResponseWriter, uid string) {
	if err := plugin.libraryRepository.DeleteAlbumRecord(uid); err != nil {
		http.Error(responseWriter, "Internal Server Error", http.StatusInternalServerError)
		return
	}
	responseWriter.WriteHeader(http.StatusOK)
	fmt.Fprintf(responseWriter, "Successfully deleted record %s", uid)
}

func (plugin *WebServerPlugin) enableCrossOriginRequests(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "*")
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusOK)
			return
		}
		next.ServeHTTP(w, r)
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
	if err := plugin.metadataResolver.ValidateSystemCredentials(); err != nil {
		responseWriter.WriteHeader(http.StatusUnauthorized)
		fmt.Fprintf(responseWriter, "%v", err)
		return
	}
	responseWriter.WriteHeader(http.StatusOK)
	fmt.Fprint(responseWriter, "Authentication Successful")
}
