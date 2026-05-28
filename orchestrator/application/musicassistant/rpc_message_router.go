package musicassistant

import (
	"encoding/json"
	"fmt"
	"strconv"
	"sync"
	"sync/atomic"
	"time"

	"vinyl-orchestrator/application/database"
)

func (router *RpcMessageRouter) ExecuteRemoteProcedureCall(procedureCommand string, commandArguments map[string]interface{}) (map[string]interface{}, error) {
	activeConnection, isConnectionAuthenticated := router.connectionManager.RetrieveActiveConnectionState()

	connectionError := router.validateConnectionAndAuthenticationState(activeConnection, isConnectionAuthenticated, procedureCommand)
	if connectionError != nil {
		return nil, connectionError
	}

	messageIdentifier := atomic.AddUint64(&router.messageIdentifierCounter, 1)
	responseChannel := make(chan map[string]interface{}, 1)

	router.registerPendingRequest(messageIdentifier, responseChannel)
	defer router.removePendingRequest(messageIdentifier)

	procedurePayload := router.constructProcedurePayload(messageIdentifier, procedureCommand, commandArguments)

	writeError := router.connectionManager.SendPayloadOverWebSocket(activeConnection, procedurePayload)
	if writeError != nil {
		return nil, writeError
	}

	return router.waitForProcedureResponseOrTimeout(responseChannel, procedureCommand)
}

func (router *RpcMessageRouter) SendFireAndForgetCommand(procedureCommand string, commandArguments map[string]interface{}) error {
	activeConnection, isConnectionAuthenticated := router.connectionManager.RetrieveActiveConnectionState()

	connectionError := router.validateConnectionAndAuthenticationState(activeConnection, isConnectionAuthenticated, procedureCommand)
	if connectionError != nil {
		return connectionError
	}

	messageIdentifier := atomic.AddUint64(&router.messageIdentifierCounter, 1)
	procedurePayload := router.constructProcedurePayload(messageIdentifier, procedureCommand, commandArguments)
	return router.connectionManager.SendPayloadOverWebSocket(activeConnection, procedurePayload)
}

func (router *RpcMessageRouter) validateConnectionAndAuthenticationState(activeConnection interface{}, isConnectionAuthenticated bool, procedureCommand string) error {
	if activeConnection == nil {
		return fmt.Errorf("music assistant websocket is not connected")
	}

	if !isConnectionAuthenticated && procedureCommand != "auth" {
		return fmt.Errorf("music assistant websocket is currently authenticating, please try again")
	}

	return nil
}

func (router *RpcMessageRouter) registerPendingRequest(messageIdentifier uint64, responseChannel chan map[string]interface{}) {
	router.requestsMutex.Lock()
	defer router.requestsMutex.Unlock()
	router.pendingRequests[messageIdentifier] = responseChannel
}

func (router *RpcMessageRouter) removePendingRequest(messageIdentifier uint64) {
	router.requestsMutex.Lock()
	defer router.requestsMutex.Unlock()
	delete(router.pendingRequests, messageIdentifier)
}

func (router *RpcMessageRouter) constructProcedurePayload(messageIdentifier uint64, procedureCommand string, commandArguments map[string]interface{}) map[string]interface{} {
	procedurePayload := map[string]interface{}{
		"message_id": messageIdentifier,
		"command":    procedureCommand,
	}
	if commandArguments != nil {
		procedurePayload["args"] = commandArguments
	}
	return procedurePayload
}

func (router *RpcMessageRouter) waitForProcedureResponseOrTimeout(responseChannel chan map[string]interface{}, procedureCommand string) (map[string]interface{}, error) {
	select {
	case responseData := <-responseChannel:
		if errorCode, hasErrorCode := responseData["error_code"]; hasErrorCode {
			detailsString, _ := responseData["details"].(string)
			return nil, fmt.Errorf("music assistant error %v: %s", errorCode, detailsString)
		}
		return responseData, nil

	case <-time.After(10 * time.Second):
		return nil, fmt.Errorf("timeout waiting for music assistant RPC response (Command: %s)", procedureCommand)
	}
}

func (router *RpcMessageRouter) ProcessIncomingWebSocketPayload(incomingMessageBytes []byte) {
	var incomingPayloadMap map[string]interface{}
	decodeError := json.Unmarshal(incomingMessageBytes, &incomingPayloadMap)
	if decodeError != nil {
		return
	}

	messageIdentifier, isResponsePayload := router.extractMessageIdentifierFromPayload(incomingPayloadMap)

	if isResponsePayload {
		router.routePayloadToPendingRequest(messageIdentifier, incomingPayloadMap)
	} else {
		router.broadcastServerEventToSystem(incomingPayloadMap)
	}
}

func (router *RpcMessageRouter) extractMessageIdentifierFromPayload(incomingPayloadMap map[string]interface{}) (uint64, bool) {
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

func (router *RpcMessageRouter) routePayloadToPendingRequest(messageIdentifier uint64, incomingPayloadMap map[string]interface{}) {
	router.requestsMutex.Lock()
	responseChannel, requestExists := router.pendingRequests[messageIdentifier]
	router.requestsMutex.Unlock()

	if requestExists {
		responseChannel <- incomingPayloadMap
		return
	}

	if errorValue, containsError := incomingPayloadMap["error"]; containsError {
		fmt.Printf("Music Assistant rejected fire-and-forget command (msg %d): %v\n", messageIdentifier, errorValue)
	}
}

func (router *RpcMessageRouter) broadcastServerEventToSystem(incomingPayloadMap map[string]interface{}) {
	if eventNameString, isEventStringValid := incomingPayloadMap["event"].(string); isEventStringValid {
		eventDataPayload := incomingPayloadMap["data"]
		specificEventTopicString := fmt.Sprintf("ma_event_%s", eventNameString)
		router.systemDataSource.Publish(specificEventTopicString, eventDataPayload)
	}
}

func (router *RpcMessageRouter) Init(dataSource database.DataSource, managerInstance *WebSocketManager) {
	router.systemDataSource = dataSource
	router.connectionManager = managerInstance
	router.pendingRequests = make(map[uint64]chan map[string]interface{})
}

type RpcMessageRouter struct {
	systemDataSource         database.DataSource
	connectionManager        *WebSocketManager
	messageIdentifierCounter uint64
	pendingRequests          map[uint64]chan map[string]interface{}
	requestsMutex            sync.Mutex
}
