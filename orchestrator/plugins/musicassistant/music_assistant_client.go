package musicassistant

import (
	"context"
	"encoding/json"
	"fmt"
	"strconv"
	"strings"
	"sync"
	"sync/atomic"
	"time"

	"vinyl-orchestrator/core"

	"github.com/gorilla/websocket"
)

type MusicAssistantClient struct {
	systemDataSource         core.DataSource
	webSocketConnection      *websocket.Conn
	isAuthenticated          bool
	webSocketMutex           sync.Mutex
	messageIdentifierCounter uint64
	pendingRequests          map[uint64]chan map[string]interface{}
	requestsMutex            sync.Mutex
}

func NewMusicAssistantClient() *MusicAssistantClient {
	return &MusicAssistantClient{
		pendingRequests: make(map[uint64]chan map[string]interface{}),
	}
}

func (client *MusicAssistantClient) Name() string {
	return "Music_Assistant_Core_Client"
}

func (client *MusicAssistantClient) Init(dataSource core.DataSource, libraryRepository core.LibraryRepository) error {
	client.systemDataSource = dataSource
	return nil
}

func (client *MusicAssistantClient) StartPlugin(applicationContext context.Context) error {
	go client.maintainWebSocketConnection(applicationContext)
	return nil
}

func (client *MusicAssistantClient) StopPlugin(applicationContext context.Context) error {
	client.webSocketMutex.Lock()
	defer client.webSocketMutex.Unlock()

	if client.webSocketConnection != nil {
		client.webSocketConnection.Close()
	}
	return nil
}

func (client *MusicAssistantClient) executeRemoteProcedureCall(procedureCommand string, commandArguments map[string]interface{}) (map[string]interface{}, error) {
	activeConnection, isConnectionAuthenticated := client.retrieveActiveConnectionState()

	connectionError := client.validateConnectionAndAuthenticationState(activeConnection, isConnectionAuthenticated, procedureCommand)
	if connectionError != nil {
		return nil, connectionError
	}

	messageIdentifier := atomic.AddUint64(&client.messageIdentifierCounter, 1)
	responseChannel := make(chan map[string]interface{}, 1)

	client.registerPendingRequest(messageIdentifier, responseChannel)
	defer client.removePendingRequest(messageIdentifier)

	procedurePayload := client.constructProcedurePayload(messageIdentifier, procedureCommand, commandArguments)

	writeError := client.sendPayloadOverWebSocket(activeConnection, procedurePayload)
	if writeError != nil {
		return nil, writeError
	}

	return client.waitForProcedureResponseOrTimeout(responseChannel, procedureCommand)
}

func (client *MusicAssistantClient) retrieveActiveConnectionState() (*websocket.Conn, bool) {
	client.webSocketMutex.Lock()
	defer client.webSocketMutex.Unlock()
	return client.webSocketConnection, client.isAuthenticated
}

func (client *MusicAssistantClient) validateConnectionAndAuthenticationState(activeConnection *websocket.Conn, isConnectionAuthenticated bool, procedureCommand string) error {
	if activeConnection == nil {
		return fmt.Errorf("music assistant websocket is not connected")
	}

	if !isConnectionAuthenticated && procedureCommand != "auth" {
		return fmt.Errorf("music assistant websocket is currently authenticating, please try again")
	}

	return nil
}

func (client *MusicAssistantClient) registerPendingRequest(messageIdentifier uint64, responseChannel chan map[string]interface{}) {
	client.requestsMutex.Lock()
	defer client.requestsMutex.Unlock()
	client.pendingRequests[messageIdentifier] = responseChannel
}

func (client *MusicAssistantClient) removePendingRequest(messageIdentifier uint64) {
	client.requestsMutex.Lock()
	defer client.requestsMutex.Unlock()
	delete(client.pendingRequests, messageIdentifier)
}

func (client *MusicAssistantClient) constructProcedurePayload(messageIdentifier uint64, procedureCommand string, commandArguments map[string]interface{}) map[string]interface{} {
	procedurePayload := map[string]interface{}{
		"message_id": messageIdentifier,
		"command":    procedureCommand,
	}
	if commandArguments != nil {
		procedurePayload["args"] = commandArguments
	}
	return procedurePayload
}

func (client *MusicAssistantClient) sendPayloadOverWebSocket(activeConnection *websocket.Conn, procedurePayload map[string]interface{}) error {
	client.webSocketMutex.Lock()
	defer client.webSocketMutex.Unlock()

	writeError := activeConnection.WriteJSON(procedurePayload)
	if writeError != nil {
		return fmt.Errorf("failed to send RPC message over websocket: %v", writeError)
	}
	return nil
}

func (client *MusicAssistantClient) sendFireAndForgetCommand(procedureCommand string, commandArguments map[string]interface{}) error {
	activeConnection, isConnectionAuthenticated := client.retrieveActiveConnectionState()

	connectionError := client.validateConnectionAndAuthenticationState(activeConnection, isConnectionAuthenticated, procedureCommand)
	if connectionError != nil {
		return connectionError
	}

	messageIdentifier := atomic.AddUint64(&client.messageIdentifierCounter, 1)
	procedurePayload := client.constructProcedurePayload(messageIdentifier, procedureCommand, commandArguments)
	return client.sendPayloadOverWebSocket(activeConnection, procedurePayload)
}

func (client *MusicAssistantClient) waitForProcedureResponseOrTimeout(responseChannel chan map[string]interface{}, procedureCommand string) (map[string]interface{}, error) {
	select {
	case responseData := <-responseChannel:
		// MA uses "error_code" + "details" for errors, not a top-level "error" field.
		if errorCode, hasErrorCode := responseData["error_code"]; hasErrorCode {
			details, _ := responseData["details"].(string)
			return nil, fmt.Errorf("music assistant error %v: %s", errorCode, details)
		}
		return responseData, nil

	case <-time.After(10 * time.Second):
		return nil, fmt.Errorf("timeout waiting for music assistant RPC response (Command: %s)", procedureCommand)
	}
}

func (client *MusicAssistantClient) retrieveTargetPlayerIdentifier() (string, error) {
	var targetPlayerIdentifier string
	client.systemDataSource.Read("music_assistant_player_id", &targetPlayerIdentifier)

	if targetPlayerIdentifier == "" {
		return "", fmt.Errorf("player entity id not set")
	}
	return targetPlayerIdentifier, nil
}

func (client *MusicAssistantClient) PlayMedia(mediaResourceIdentifier string) error {
	targetPlayerIdentifier, retrievalError := client.retrieveTargetPlayerIdentifier()
	if retrievalError != nil {
		return retrievalError
	}

	commandArguments := map[string]interface{}{
		"queue_id": targetPlayerIdentifier,
		"media":    []string{mediaResourceIdentifier},
	}

	return client.sendFireAndForgetCommand("player_queues/play_media", commandArguments)
}

func (client *MusicAssistantClient) StopMedia() error {
	targetPlayerIdentifier, retrievalError := client.retrieveTargetPlayerIdentifier()
	if retrievalError != nil {
		return retrievalError
	}

	commandArguments := map[string]interface{}{
		"queue_id": targetPlayerIdentifier,
	}

	return client.sendFireAndForgetCommand("player_queues/stop", commandArguments)
}

func (client *MusicAssistantClient) GetState() (string, error) {
	client.webSocketMutex.Lock()
	isReady := client.webSocketConnection != nil && client.isAuthenticated
	client.webSocketMutex.Unlock()
	if !isReady {
		return "idle", nil
	}

	targetPlayerIdentifier, retrievalError := client.retrieveTargetPlayerIdentifier()
	if retrievalError != nil {
		return "", retrievalError
	}

	commandArguments := map[string]interface{}{
		"queue_id": targetPlayerIdentifier,
	}

	rpcResponseData, executionError := client.executeRemoteProcedureCall("player_queues/get", commandArguments)
	if executionError != nil {
		return "", executionError
	}

	return client.extractAndBroadcastState(rpcResponseData), nil
}

func (client *MusicAssistantClient) extractAndBroadcastState(rpcResponseData map[string]interface{}) string {
	responseResultData, isMapValid := rpcResponseData["result"].(map[string]interface{})
	if !isMapValid {
		return "idle"
	}

	playerStateString, isStringValid := responseResultData["state"].(string)
	if !isStringValid {
		return "idle"
	}
	currentState := strings.ToLower(playerStateString)

	var position, duration float64
	if elapsed, ok := responseResultData["elapsed_time"].(float64); ok {
		position = elapsed
	}

	if currentItem, ok := responseResultData["current_item"].(map[string]interface{}); ok {
		if dur, ok := currentItem["duration"].(float64); ok {
			duration = dur
		}
	}

	payload := map[string]interface{}{
		"state":    currentState,
		"position": position,
		"duration": duration,
	}

	client.systemDataSource.Publish("playback_state_changed", payload)
	client.systemDataSource.Publish("playback_progress", payload)

	return currentState
}

func (client *MusicAssistantClient) FetchCleanMetadata(mediaResourceIdentifier string) (*core.VinylAlbumRecord, error) {
	commandArguments := map[string]interface{}{
		"uri": mediaResourceIdentifier,
	}

	rpcResponseData, executionError := client.executeRemoteProcedureCall("music/item_by_uri", commandArguments)
	if executionError != nil {
		return nil, executionError
	}

	fetchedVinylRecord, extractionError := client.extractVinylAlbumRecordFromRpcResponse(rpcResponseData)
	if extractionError != nil {
		return nil, extractionError
	}

	fetchedVinylRecord.MediaResourceUri = mediaResourceIdentifier

	client.enrichRecordWithAlbumTracksIfApplicable(fetchedVinylRecord, mediaResourceIdentifier)

	return fetchedVinylRecord, nil
}

func (client *MusicAssistantClient) enrichRecordWithAlbumTracksIfApplicable(fetchedVinylRecord *core.VinylAlbumRecord, mediaResourceIdentifier string) {
	uriPartsArray := strings.SplitN(mediaResourceIdentifier, "://", 2)
	if len(uriPartsArray) != 2 {
		return
	}

	providerDomainString := uriPartsArray[0]
	pathSegmentsArray := strings.SplitN(uriPartsArray[1], "/", 2)

	if len(pathSegmentsArray) == 2 {
		mediaTypeString := pathSegmentsArray[0]
		itemIdentifierString := pathSegmentsArray[1]

		if mediaTypeString == "album" {
			client.executeTrackEnrichmentProcedure(fetchedVinylRecord, itemIdentifierString, providerDomainString)
		}
	}
}

func (client *MusicAssistantClient) executeTrackEnrichmentProcedure(fetchedVinylRecord *core.VinylAlbumRecord, itemIdentifierString string, providerDomainString string) {
	tracksCommandArguments := map[string]interface{}{
		"item_id":                        itemIdentifierString,
		"provider_instance_id_or_domain": providerDomainString,
	}

	tracksResponseData, executionError := client.executeRemoteProcedureCall("music/albums/album_tracks", tracksCommandArguments)
	if executionError == nil {
		client.extractAndFormatTrackList(fetchedVinylRecord, tracksResponseData)
	} else {
		fmt.Printf("Warning: failed to fetch album tracks: %v\n", executionError)
	}
}

func (client *MusicAssistantClient) extractAndFormatTrackList(fetchedVinylRecord *core.VinylAlbumRecord, tracksResponseData map[string]interface{}) {
	rawResultData, containsResult := tracksResponseData["result"]
	if !containsResult {
		return
	}

	var parsedTrackNamesList []string

	switch typedResultData := rawResultData.(type) {
	case []interface{}:
		parsedTrackNamesList = client.extractTrackNamesFromInterfaceArray(typedResultData)
	case map[string]interface{}:
		parsedTrackNamesList = client.extractTrackNamesFromNestedItemsMap(typedResultData)
	}

	if len(parsedTrackNamesList) > 0 {
		fetchedVinylRecord.TrackList = strings.Join(parsedTrackNamesList, "\n")
	}
}

func (client *MusicAssistantClient) extractTrackNamesFromInterfaceArray(rawTrackArray []interface{}) []string {
	var trackNamesList []string
	for _, rawTrackData := range rawTrackArray {
		if trackDataMap, isMapValid := rawTrackData.(map[string]interface{}); isMapValid {
			if trackNameString, isNameStringValid := trackDataMap["name"].(string); isNameStringValid {
				trackNamesList = append(trackNamesList, trackNameString)
			}
		}
	}
	return trackNamesList
}

func (client *MusicAssistantClient) extractTrackNamesFromNestedItemsMap(nestedItemsMap map[string]interface{}) []string {
	var trackNamesList []string
	if itemsInterfaceArray, containsItems := nestedItemsMap["items"].([]interface{}); containsItems {
		trackNamesList = client.extractTrackNamesFromInterfaceArray(itemsInterfaceArray)
	}
	return trackNamesList
}

func (client *MusicAssistantClient) extractVinylAlbumRecordFromRpcResponse(rpcResponseData map[string]interface{}) (*core.VinylAlbumRecord, error) {
	rawResultData, containsResult := rpcResponseData["result"]
	if !containsResult {
		rawJsonBytes, _ := json.MarshalIndent(rpcResponseData, "", "  ")
		return nil, fmt.Errorf("response did not contain a 'result' field. Raw response: \n%s", string(rawJsonBytes))
	}

	responseResultDataMap, validationError := client.validateAndConvertResultDataToMap(rawResultData)
	if validationError != nil {
		return nil, validationError
	}

	fetchedVinylRecord := &core.VinylAlbumRecord{}

	if albumNameString, isNameStringValid := responseResultDataMap["name"].(string); isNameStringValid {
		fetchedVinylRecord.AlbumTitle = albumNameString
	}

	fetchedVinylRecord.ArtistName = client.extractArtistNameFromResultData(responseResultDataMap)
	fetchedVinylRecord.AlbumCoverArt = client.extractAlbumCoverArtFromResultData(responseResultDataMap)

	return fetchedVinylRecord, nil
}

func (client *MusicAssistantClient) validateAndConvertResultDataToMap(rawResultData interface{}) (map[string]interface{}, error) {
	switch typedResultData := rawResultData.(type) {
	case map[string]interface{}:
		return typedResultData, nil
	case []interface{}:
		if len(typedResultData) > 0 {
			if firstItemMap, isMapValid := typedResultData[0].(map[string]interface{}); isMapValid {
				return firstItemMap, nil
			}
			return nil, fmt.Errorf("result list did not contain a valid JSON object")
		}
		return nil, fmt.Errorf("music assistant returned an empty list")
	case nil:
		return nil, fmt.Errorf("music assistant returned null (item not found)")
	default:
		return nil, fmt.Errorf("expected Map or List, got %T", rawResultData)
	}
}

func (client *MusicAssistantClient) extractArtistNameFromResultData(responseResultDataMap map[string]interface{}) string {
	artistsInterfaceArray, isArrayValid := responseResultDataMap["artists"].([]interface{})
	if !isArrayValid || len(artistsInterfaceArray) == 0 {
		return ""
	}

	firstArtistMap, isArtistMapValid := artistsInterfaceArray[0].(map[string]interface{})
	if !isArtistMapValid {
		return ""
	}

	artistNameString, isArtistNameStringValid := firstArtistMap["name"].(string)
	if !isArtistNameStringValid {
		return ""
	}

	return artistNameString
}

func (client *MusicAssistantClient) extractAlbumCoverArtFromResultData(responseResultDataMap map[string]interface{}) string {
	metadataMap, isMetadataMapValid := responseResultDataMap["metadata"].(map[string]interface{})
	if !isMetadataMapValid {
		return ""
	}

	imagesInterfaceArray, isImagesArrayValid := metadataMap["images"].([]interface{})
	if !isImagesArrayValid || len(imagesInterfaceArray) == 0 {
		return ""
	}

	for _, rawImageData := range imagesInterfaceArray {
		if imageMap, isImageMapValid := rawImageData.(map[string]interface{}); isImageMapValid {
			if imageUrlString, isUrlStringValid := imageMap["url"].(string); isUrlStringValid && imageUrlString != "" {
				return imageUrlString
			}
			if imagePathString, isPathStringValid := imageMap["path"].(string); isPathStringValid && imagePathString != "" {
				return imagePathString
			}
		}
	}

	return ""
}

func (client *MusicAssistantClient) maintainWebSocketConnection(applicationContext context.Context) {
	for {
		select {
		case <-applicationContext.Done():
			return
		default:
		}

		musicAssistantUrlString, musicAssistantTokenString, areCredentialsValid := client.retrieveWebSocketCredentials()
		if !areCredentialsValid {
			time.Sleep(2 * time.Second)
			continue
		}

		webSocketEndpointString := client.formatWebSocketUrl(musicAssistantUrlString)
		activeSocketConnection, connectionError := client.establishNetworkConnection(webSocketEndpointString)
		if connectionError != nil {
			time.Sleep(5 * time.Second)
			continue
		}

		client.executeAuthenticationSequence(activeSocketConnection, musicAssistantTokenString, applicationContext)
	}
}

func (client *MusicAssistantClient) retrieveWebSocketCredentials() (string, string, bool) {
	var musicAssistantUrlString string
	var musicAssistantTokenString string

	client.systemDataSource.Read("music_assistant_url", &musicAssistantUrlString)
	client.systemDataSource.Read("music_assistant_token", &musicAssistantTokenString)

	areCredentialsValid := musicAssistantUrlString != "" && musicAssistantTokenString != ""
	return musicAssistantUrlString, musicAssistantTokenString, areCredentialsValid
}

func (client *MusicAssistantClient) formatWebSocketUrl(baseHttpUrlString string) string {
	formattedUrlString := strings.Replace(baseHttpUrlString, "http://", "ws://", 1)
	formattedUrlString = strings.Replace(formattedUrlString, "https://", "wss://", 1)
	formattedUrlString = strings.TrimRight(formattedUrlString, "/") + "/ws"
	return formattedUrlString
}

func (client *MusicAssistantClient) establishNetworkConnection(webSocketEndpointString string) (*websocket.Conn, error) {
	activeSocketConnection, _, dialError := websocket.DefaultDialer.Dial(webSocketEndpointString, nil)
	if dialError != nil {
		fmt.Printf("Music Assistant WebSocket offline, retrying... (%v)\n", dialError)
		return nil, dialError
	}
	return activeSocketConnection, nil
}

func (client *MusicAssistantClient) executeAuthenticationSequence(activeSocketConnection *websocket.Conn, authenticationTokenString string, applicationContext context.Context) {
	fmt.Println("Music Assistant WebSocket connected. Authenticating...")

	client.initializeUnauthenticatedConnectionState(activeSocketConnection)

	listenerTerminationChannel := make(chan struct{})
	go client.startBackgroundEventListener(activeSocketConnection, applicationContext, listenerTerminationChannel)

	authenticationArguments := map[string]interface{}{
		"token": authenticationTokenString,
	}
	_, authenticationError := client.executeRemoteProcedureCall("auth", authenticationArguments)

	if authenticationError != nil {
		client.handleAuthenticationFailure(authenticationError, listenerTerminationChannel)
		return
	}

	client.markConnectionAsAuthenticated()
	fmt.Println("Music Assistant WebSocket Stream Online & Authenticated!")

	client.monitorConnectionLifecycle(listenerTerminationChannel, applicationContext)
}

func (client *MusicAssistantClient) initializeUnauthenticatedConnectionState(activeSocketConnection *websocket.Conn) {
	client.webSocketMutex.Lock()
	defer client.webSocketMutex.Unlock()

	client.webSocketConnection = activeSocketConnection
	client.isAuthenticated = false
}

func (client *MusicAssistantClient) markConnectionAsAuthenticated() {
	client.webSocketMutex.Lock()
	defer client.webSocketMutex.Unlock()

	client.isAuthenticated = true
}

func (client *MusicAssistantClient) startBackgroundEventListener(activeSocketConnection *websocket.Conn, applicationContext context.Context, listenerTerminationChannel chan struct{}) {
	client.listenForServerEvents(activeSocketConnection, applicationContext)
	close(listenerTerminationChannel)
}

func (client *MusicAssistantClient) handleAuthenticationFailure(authenticationError error, listenerTerminationChannel chan struct{}) {
	fmt.Printf("Music Assistant WebSocket Auth Failed: %v\n", authenticationError)
	client.closeActiveConnection()
	<-listenerTerminationChannel
	time.Sleep(2 * time.Second)
}

func (client *MusicAssistantClient) monitorConnectionLifecycle(listenerTerminationChannel chan struct{}, applicationContext context.Context) {
	select {
	case <-listenerTerminationChannel:
		fmt.Println("Music Assistant WebSocket dropped unexpectedly. Reconnecting...")
	case <-applicationContext.Done():
		fmt.Println("Shutting down Music Assistant Client...")
		client.closeActiveConnection()
		<-listenerTerminationChannel
		return
	}

	client.resetConnectionState()
	time.Sleep(2 * time.Second)
}

func (client *MusicAssistantClient) closeActiveConnection() {
	client.webSocketMutex.Lock()
	defer client.webSocketMutex.Unlock()

	if client.webSocketConnection != nil {
		client.webSocketConnection.Close()
		client.webSocketConnection = nil
	}
}

func (client *MusicAssistantClient) resetConnectionState() {
	client.webSocketMutex.Lock()
	defer client.webSocketMutex.Unlock()

	client.webSocketConnection = nil
	client.isAuthenticated = false
}

func (client *MusicAssistantClient) listenForServerEvents(activeSocketConnection *websocket.Conn, applicationContext context.Context) {
	for {
		select {
		case <-applicationContext.Done():
			return
		default:
			_, incomingMessageBytes, readError := activeSocketConnection.ReadMessage()
			if readError != nil {
				return
			}
			client.processIncomingWebSocketPayload(incomingMessageBytes)
		}
	}
}

func (client *MusicAssistantClient) processIncomingWebSocketPayload(incomingMessageBytes []byte) {
	var incomingPayloadMap map[string]interface{}
	decodeError := json.Unmarshal(incomingMessageBytes, &incomingPayloadMap)
	if decodeError != nil {
		return
	}

	messageIdentifier, isResponsePayload := client.extractMessageIdentifierFromPayload(incomingPayloadMap)

	if isResponsePayload {
		client.routePayloadToPendingRequest(messageIdentifier, incomingPayloadMap)
	} else {
		client.broadcastServerEventToSystem(incomingPayloadMap)
	}
}

func (client *MusicAssistantClient) extractMessageIdentifierFromPayload(incomingPayloadMap map[string]interface{}) (uint64, bool) {
	identifierValue, containsIdentifier := incomingPayloadMap["message_id"]
	if !containsIdentifier || identifierValue == nil {
		return 0, false
	}

	switch typedValue := identifierValue.(type) {
	case float64:
		return uint64(typedValue), true
	case string:
		parsedIdentifier, parseError := strconv.ParseUint(typedValue, 10, 64)
		if parseError == nil {
			return parsedIdentifier, true
		}
	}
	return 0, false
}

func (client *MusicAssistantClient) routePayloadToPendingRequest(messageIdentifier uint64, incomingPayloadMap map[string]interface{}) {
	client.requestsMutex.Lock()
	responseChannel, requestExists := client.pendingRequests[messageIdentifier]
	client.requestsMutex.Unlock()

	if requestExists {
		responseChannel <- incomingPayloadMap
		return
	}

	if errorValue, containsError := incomingPayloadMap["error"]; containsError {
		fmt.Printf("Music Assistant rejected fire-and-forget command (msg %d): %v\n", messageIdentifier, errorValue)
	} else {
	}
}

func (client *MusicAssistantClient) broadcastServerEventToSystem(incomingPayloadMap map[string]interface{}) {
	if eventNameString, isEventStringValid := incomingPayloadMap["event"].(string); isEventStringValid {
		eventDataPayload := incomingPayloadMap["data"]
		specificEventTopicString := fmt.Sprintf("ma_event_%s", eventNameString)
		client.systemDataSource.Publish(specificEventTopicString, eventDataPayload)
	}
}

func (client *MusicAssistantClient) ValidateSystemCredentials() error {
	_, _, areCredentialsValid := client.retrieveWebSocketCredentials()
	if !areCredentialsValid {
		return fmt.Errorf("credentials are empty or not configured in database")
	}

	client.webSocketMutex.Lock()
	isConnected := client.webSocketConnection != nil
	isAuthenticated := client.isAuthenticated
	client.webSocketMutex.Unlock()

	if !isConnected {
		return fmt.Errorf("not connected to Music Assistant — check the URL and ensure the server is reachable")
	}

	if !isAuthenticated {
		return fmt.Errorf("connected but not yet authenticated — the token may be incorrect")
	}

	return nil
}
