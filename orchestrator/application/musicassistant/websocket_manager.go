package musicassistant

import (
	"context"
	"fmt"
	"strings"
	"sync"
	"time"

	"vinyl-orchestrator/application/database"

	"github.com/gorilla/websocket"
)

func (manager *WebSocketManager) RetrieveActiveConnectionState() (*websocket.Conn, bool) {
	manager.webSocketMutex.Lock()
	defer manager.webSocketMutex.Unlock()
	return manager.webSocketConnection, manager.isAuthenticated
}

func (manager *WebSocketManager) SendPayloadOverWebSocket(activeConnection *websocket.Conn, procedurePayload map[string]interface{}) error {
	manager.webSocketMutex.Lock()
	defer manager.webSocketMutex.Unlock()

	writeError := activeConnection.WriteJSON(procedurePayload)
	if writeError != nil {
		return fmt.Errorf("failed to send RPC message over websocket: %v", writeError)
	}
	return nil
}

func (manager *WebSocketManager) CloseActiveConnection() {
	manager.webSocketMutex.Lock()
	defer manager.webSocketMutex.Unlock()

	if manager.webSocketConnection != nil {
		manager.webSocketConnection.Close()
		manager.webSocketConnection = nil
	}
}

func (manager *WebSocketManager) MaintainWebSocketConnection(applicationContext context.Context) {
	for {
		if manager.checkApplicationContextForTermination(applicationContext) {
			return
		}

		musicAssistantUrlString, musicAssistantTokenString, areCredentialsValid := manager.retrieveWebSocketCredentials()
		if !areCredentialsValid {
			manager.pauseBeforeReconnectionAttempt(2)
			continue
		}

		webSocketEndpointString := manager.formatWebSocketUrl(musicAssistantUrlString)
		activeSocketConnection, connectionError := manager.establishNetworkConnection(webSocketEndpointString)
		if connectionError != nil {
			manager.pauseBeforeReconnectionAttempt(5)
			continue
		}

		manager.executeAuthenticationSequence(activeSocketConnection, musicAssistantTokenString, applicationContext)
	}
}

func (manager *WebSocketManager) checkApplicationContextForTermination(applicationContext context.Context) bool {
	select {
	case <-applicationContext.Done():
		return true
	default:
		return false
	}
}

func (manager *WebSocketManager) pauseBeforeReconnectionAttempt(durationInSeconds time.Duration) {
	time.Sleep(durationInSeconds * time.Second)
}

func (manager *WebSocketManager) retrieveWebSocketCredentials() (string, string, bool) {
	var musicAssistantUrlString string
	var musicAssistantTokenString string

	manager.systemDataSource.Read("GLOBAL_MusicAssistantUrl", &musicAssistantUrlString)
	manager.systemDataSource.Read("GLOBAL_MusicAssistantToken", &musicAssistantTokenString)

	areCredentialsValid := musicAssistantUrlString != "" && musicAssistantTokenString != ""
	return musicAssistantUrlString, musicAssistantTokenString, areCredentialsValid
}

func (manager *WebSocketManager) formatWebSocketUrl(baseHttpUrlString string) string {
	formattedUrlString := strings.Replace(baseHttpUrlString, "http://", "ws://", 1)
	formattedUrlString = strings.Replace(formattedUrlString, "https://", "wss://", 1)
	formattedUrlString = strings.TrimRight(formattedUrlString, "/") + "/ws"
	return formattedUrlString
}

func (manager *WebSocketManager) establishNetworkConnection(webSocketEndpointString string) (*websocket.Conn, error) {
	activeSocketConnection, _, dialError := websocket.DefaultDialer.Dial(webSocketEndpointString, nil)
	if dialError != nil {
		fmt.Printf("Music Assistant WebSocket offline, retrying... (%v)\n", dialError)
		return nil, dialError
	}
	return activeSocketConnection, nil
}

func (manager *WebSocketManager) executeAuthenticationSequence(activeSocketConnection *websocket.Conn, authenticationTokenString string, applicationContext context.Context) {
	fmt.Println("Music Assistant WebSocket connected. Authenticating...")

	manager.initializeUnauthenticatedConnectionState(activeSocketConnection)

	listenerTerminationChannel := make(chan struct{})
	go manager.startBackgroundEventListener(activeSocketConnection, applicationContext, listenerTerminationChannel)

	authenticationArguments := map[string]interface{}{
		"token": authenticationTokenString,
	}
	_, authenticationError := manager.messageRouter.ExecuteRemoteProcedureCall("auth", authenticationArguments)

	if authenticationError != nil {
		manager.handleAuthenticationFailure(authenticationError, listenerTerminationChannel)
		return
	}

	manager.markConnectionAsAuthenticated()
	fmt.Println("Music Assistant WebSocket Stream Online & Authenticated!")

	manager.monitorConnectionLifecycle(listenerTerminationChannel, applicationContext)
}

func (manager *WebSocketManager) initializeUnauthenticatedConnectionState(activeSocketConnection *websocket.Conn) {
	manager.webSocketMutex.Lock()
	defer manager.webSocketMutex.Unlock()

	manager.webSocketConnection = activeSocketConnection
	manager.isAuthenticated = false
}

func (manager *WebSocketManager) markConnectionAsAuthenticated() {
	manager.webSocketMutex.Lock()
	defer manager.webSocketMutex.Unlock()

	manager.isAuthenticated = true
}

func (manager *WebSocketManager) startBackgroundEventListener(activeSocketConnection *websocket.Conn, applicationContext context.Context, listenerTerminationChannel chan struct{}) {
	manager.listenForServerEvents(activeSocketConnection, applicationContext)
	close(listenerTerminationChannel)
}

func (manager *WebSocketManager) handleAuthenticationFailure(authenticationError error, listenerTerminationChannel chan struct{}) {
	fmt.Printf("Music Assistant WebSocket Auth Failed: %v\n", authenticationError)
	manager.CloseActiveConnection()
	<-listenerTerminationChannel
	manager.pauseBeforeReconnectionAttempt(2)
}

func (manager *WebSocketManager) monitorConnectionLifecycle(listenerTerminationChannel chan struct{}, applicationContext context.Context) {
	select {
	case <-listenerTerminationChannel:
		fmt.Println("Music Assistant WebSocket dropped unexpectedly. Reconnecting...")
	case <-applicationContext.Done():
		fmt.Println("Shutting down Music Assistant Client...")
		manager.CloseActiveConnection()
		<-listenerTerminationChannel
		return
	}

	manager.resetConnectionState()
	manager.pauseBeforeReconnectionAttempt(2)
}

func (manager *WebSocketManager) resetConnectionState() {
	manager.webSocketMutex.Lock()
	defer manager.webSocketMutex.Unlock()

	manager.webSocketConnection = nil
	manager.isAuthenticated = false
}

func (manager *WebSocketManager) listenForServerEvents(activeSocketConnection *websocket.Conn, applicationContext context.Context) {
	for {
		if manager.checkApplicationContextForTermination(applicationContext) {
			return
		}
		_, incomingMessageBytes, readError := activeSocketConnection.ReadMessage()
		if readError != nil {
			return
		}
		manager.messageRouter.ProcessIncomingWebSocketPayload(incomingMessageBytes)
	}
}

func (manager *WebSocketManager) Init(ctx context.Context, dataSource database.DataSource, routerInstance *RpcMessageRouter) {
	manager.systemDataSource = dataSource
	manager.messageRouter = routerInstance

	go manager.MaintainWebSocketConnection(ctx)
}

type WebSocketManager struct {
	systemDataSource    database.DataSource
	messageRouter       *RpcMessageRouter
	webSocketConnection *websocket.Conn
	isAuthenticated     bool
	webSocketMutex      sync.Mutex
}
