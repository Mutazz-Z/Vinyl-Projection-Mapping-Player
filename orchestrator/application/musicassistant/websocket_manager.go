package musicassistant

import (
	"context"
	"fmt"
	"strings"
	"sync"
	"time"

	"vinyl-orchestrator/application/database"
	"vinyl-orchestrator/core"
	"vinyl-orchestrator/utils"

	"github.com/gorilla/websocket"
)

func (instance *WebSocketManager_t) RetrieveActiveConnectionState() (*websocket.Conn, bool) {
	instance._private.webSocketMutex.Lock()
	defer instance._private.webSocketMutex.Unlock()
	return instance._private.webSocketConnection, instance._private.isAuthenticated
}

func (instance *WebSocketManager_t) SendPayloadOverWebSocket(activeConnection *websocket.Conn, procedurePayload map[string]interface{}) error {
	instance._private.webSocketMutex.Lock()
	defer instance._private.webSocketMutex.Unlock()

	writeError := activeConnection.WriteJSON(procedurePayload)
	if writeError != nil {
		return fmt.Errorf("[WebSocket Manager]: failed to send RPC message over websocket: %v", writeError)
	}
	return nil
}

func (instance *WebSocketManager_t) CloseActiveConnection() {
	instance._private.webSocketMutex.Lock()
	defer instance._private.webSocketMutex.Unlock()

	if instance._private.webSocketConnection != nil {
		instance._private.webSocketConnection.Close()
		instance._private.webSocketConnection = nil
	}
}

func (instance *WebSocketManager_t) maintainWebSocketConnection(applicationContext context.Context) {
	for {
		if instance.checkApplicationContextForTermination(applicationContext) {
			return
		}

		musicAssistantUrlString, musicAssistantTokenString, areCredentialsValid := instance.retrieveWebSocketCredentials()
		if !areCredentialsValid {
			instance.pauseBeforeReconnectionAttempt(2)
			continue
		}

		webSocketEndpointString := instance.formatWebSocketUrl(musicAssistantUrlString)
		activeSocketConnection, connectionError := instance.establishNetworkConnection(webSocketEndpointString)
		if connectionError != nil {
			instance.pauseBeforeReconnectionAttempt(5)
			continue
		}

		instance.executeAuthenticationSequence(activeSocketConnection, musicAssistantTokenString, applicationContext)
	}
}

func (instance *WebSocketManager_t) checkApplicationContextForTermination(applicationContext context.Context) bool {
	select {
	case <-applicationContext.Done():
		return true
	default:
		return false
	}
}

func (instance *WebSocketManager_t) pauseBeforeReconnectionAttempt(durationInSeconds time.Duration) {
	time.Sleep(durationInSeconds * time.Second)
}

func (instance *WebSocketManager_t) retrieveWebSocketCredentials() (string, string, bool) {
	var musicAssistantUrlString string
	var musicAssistantTokenString string

	utils.Read(instance._private.systemDataSource, core.Global_MusicAssistantUrl, &musicAssistantUrlString)
	utils.Read(instance._private.systemDataSource, core.Global_MusicAssistantToken, &musicAssistantTokenString)

	areCredentialsValid := musicAssistantUrlString != "" && musicAssistantTokenString != ""
	return musicAssistantUrlString, musicAssistantTokenString, areCredentialsValid
}

func (instance *WebSocketManager_t) formatWebSocketUrl(baseHttpUrlString string) string {
	formattedUrlString := strings.Replace(baseHttpUrlString, "http://", "ws://", 1)
	formattedUrlString = strings.Replace(formattedUrlString, "https://", "wss://", 1)
	formattedUrlString = strings.TrimRight(formattedUrlString, "/") + "/ws"
	return formattedUrlString
}

func (instance *WebSocketManager_t) establishNetworkConnection(webSocketEndpointString string) (*websocket.Conn, error) {
	activeSocketConnection, _, dialError := websocket.DefaultDialer.Dial(webSocketEndpointString, nil)
	if dialError != nil {
		fmt.Printf("[WebSocket Manager]: Music Assistant WebSocket offline, retrying... (%v)\n", dialError)
		return nil, dialError
	}
	return activeSocketConnection, nil
}

func (instance *WebSocketManager_t) executeAuthenticationSequence(activeSocketConnection *websocket.Conn, authenticationTokenString string, applicationContext context.Context) {
	fmt.Println("[WebSocket Manager]: Music Assistant WebSocket connected. Authenticating...")

	instance.initializeUnauthenticatedConnectionState(activeSocketConnection)

	listenerTerminationChannel := make(chan struct{})
	go instance.startBackgroundEventListener(activeSocketConnection, applicationContext, listenerTerminationChannel)

	authenticationArguments := map[string]interface{}{
		"token": authenticationTokenString,
	}
	_, authenticationError := instance._private.messageRouter.ExecuteRemoteProcedureCall("auth", authenticationArguments)

	if authenticationError != nil {
		instance.handleAuthenticationFailure(authenticationError, listenerTerminationChannel)
		return
	}

	instance.markConnectionAsAuthenticated()
	fmt.Println("[WebSocket Manager]: Music Assistant WebSocket Stream Online & Authenticated!")

	instance.monitorConnectionLifecycle(listenerTerminationChannel, applicationContext)
}

func (instance *WebSocketManager_t) initializeUnauthenticatedConnectionState(activeSocketConnection *websocket.Conn) {
	instance._private.webSocketMutex.Lock()
	defer instance._private.webSocketMutex.Unlock()

	instance._private.webSocketConnection = activeSocketConnection
	instance._private.isAuthenticated = false
}

func (instance *WebSocketManager_t) markConnectionAsAuthenticated() {
	instance._private.webSocketMutex.Lock()
	defer instance._private.webSocketMutex.Unlock()

	instance._private.isAuthenticated = true
}

func (instance *WebSocketManager_t) startBackgroundEventListener(activeSocketConnection *websocket.Conn, applicationContext context.Context, listenerTerminationChannel chan struct{}) {
	instance.listenForServerEvents(activeSocketConnection, applicationContext)
	close(listenerTerminationChannel)
}

func (instance *WebSocketManager_t) handleAuthenticationFailure(authenticationError error, listenerTerminationChannel chan struct{}) {
	fmt.Printf("[WebSocket Manager]: Music Assistant WebSocket Auth Failed: %v\n", authenticationError)
	instance.CloseActiveConnection()
	<-listenerTerminationChannel
	instance.pauseBeforeReconnectionAttempt(2)
}

func (instance *WebSocketManager_t) monitorConnectionLifecycle(listenerTerminationChannel chan struct{}, applicationContext context.Context) {
	select {
	case <-listenerTerminationChannel:
		fmt.Println("[WebSocket Manager]: Music Assistant WebSocket dropped unexpectedly. Reconnecting...")
	case <-applicationContext.Done():
		fmt.Println("[WebSocket Manager]: Shutting down Music Assistant Client...")
		instance.CloseActiveConnection()
		<-listenerTerminationChannel
		return
	}

	instance.resetConnectionState()
	instance.pauseBeforeReconnectionAttempt(2)
}

func (instance *WebSocketManager_t) resetConnectionState() {
	instance._private.webSocketMutex.Lock()
	defer instance._private.webSocketMutex.Unlock()

	instance._private.webSocketConnection = nil
	instance._private.isAuthenticated = false
}

func (instance *WebSocketManager_t) listenForServerEvents(activeSocketConnection *websocket.Conn, applicationContext context.Context) {
	for {
		if instance.checkApplicationContextForTermination(applicationContext) {
			return
		}
		_, incomingMessageBytes, readError := activeSocketConnection.ReadMessage()
		if readError != nil {
			return
		}
		instance._private.messageRouter.ProcessIncomingWebSocketPayload(incomingMessageBytes)
	}
}

type WebSocketManager_t struct {
	_private struct {
		systemDataSource    database.DataSource
		messageRouter       *RpcMessageRouter_t
		webSocketConnection *websocket.Conn
		isAuthenticated     bool
		webSocketMutex      sync.Mutex
	}
}

func (instance *WebSocketManager_t) Init(ctx context.Context, dataSource database.DataSource, routerInstance *RpcMessageRouter_t) {
	instance._private.systemDataSource = dataSource
	instance._private.messageRouter = routerInstance

	go instance.maintainWebSocketConnection(ctx)
}
