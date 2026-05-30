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

func (instance *RpcMessageRouter_t) ExecuteRemoteProcedureCall(procedureCommand string, commandArguments map[string]interface{}) (map[string]interface{}, error) {
	activeConnection, isConnectionAuthenticated := instance._private.webSocketManager.RetrieveActiveConnectionState()

	connectionError := instance.validateConnectionAndAuthenticationState(activeConnection, isConnectionAuthenticated, procedureCommand)
	if connectionError != nil {
		return nil, connectionError
	}

	messageIdentifier := atomic.AddUint64(&instance._private.messageIdentifierCounter, 1)
	responseChannel := make(chan map[string]interface{}, 1)

	instance.registerPendingRequest(messageIdentifier, responseChannel)
	defer instance.removePendingRequest(messageIdentifier)

	procedurePayload := instance.constructProcedurePayload(messageIdentifier, procedureCommand, commandArguments)

	writeError := instance._private.webSocketManager.SendPayloadOverWebSocket(activeConnection, procedurePayload)
	if writeError != nil {
		return nil, writeError
	}

	return instance.waitForProcedureResponseOrTimeout(responseChannel, procedureCommand)
}

func (instance *RpcMessageRouter_t) SendFireAndForgetCommand(procedureCommand string, commandArguments map[string]interface{}) error {
	activeConnection, isConnectionAuthenticated := instance._private.webSocketManager.RetrieveActiveConnectionState()

	connectionError := instance.validateConnectionAndAuthenticationState(activeConnection, isConnectionAuthenticated, procedureCommand)
	if connectionError != nil {
		return connectionError
	}

	messageIdentifier := atomic.AddUint64(&instance._private.messageIdentifierCounter, 1)
	procedurePayload := instance.constructProcedurePayload(messageIdentifier, procedureCommand, commandArguments)
	return instance._private.webSocketManager.SendPayloadOverWebSocket(activeConnection, procedurePayload)
}

func (instance *RpcMessageRouter_t) validateConnectionAndAuthenticationState(activeConnection interface{}, isConnectionAuthenticated bool, procedureCommand string) error {
	if activeConnection == nil {
		return fmt.Errorf("[RPC Message Router]: music assistant websocket is not connected")
	}

	if !isConnectionAuthenticated && procedureCommand != "auth" {
		return fmt.Errorf("[RPC Message Router]: music assistant websocket is currently authenticating, please try again")
	}

	return nil
}

func (instance *RpcMessageRouter_t) registerPendingRequest(messageIdentifier uint64, responseChannel chan map[string]interface{}) {
	instance._private.requestsMutex.Lock()
	defer instance._private.requestsMutex.Unlock()
	instance._private.pendingRequests[messageIdentifier] = responseChannel
}

func (instance *RpcMessageRouter_t) removePendingRequest(messageIdentifier uint64) {
	instance._private.requestsMutex.Lock()
	defer instance._private.requestsMutex.Unlock()
	delete(instance._private.pendingRequests, messageIdentifier)
}

func (instance *RpcMessageRouter_t) constructProcedurePayload(messageIdentifier uint64, procedureCommand string, commandArguments map[string]interface{}) map[string]interface{} {
	procedurePayload := map[string]interface{}{
		"message_id": messageIdentifier,
		"command":    procedureCommand,
	}
	if commandArguments != nil {
		procedurePayload["args"] = commandArguments
	}
	return procedurePayload
}

func (instance *RpcMessageRouter_t) waitForProcedureResponseOrTimeout(responseChannel chan map[string]interface{}, procedureCommand string) (map[string]interface{}, error) {
	select {
	case responseData := <-responseChannel:
		if errorCode, hasErrorCode := responseData["error_code"]; hasErrorCode {
			detailsString, _ := responseData["details"].(string)
			return nil, fmt.Errorf("[RPC Message Router]: music assistant error %v: %s", errorCode, detailsString)
		}
		return responseData, nil

	case <-time.After(10 * time.Second):
		return nil, fmt.Errorf("[RPC Message Router]: timeout waiting for music assistant RPC response (Command: %s)", procedureCommand)
	}
}

func (instance *RpcMessageRouter_t) ProcessIncomingWebSocketPayload(incomingMessageBytes []byte) {
	var incomingPayloadMap map[string]interface{}
	decodeError := json.Unmarshal(incomingMessageBytes, &incomingPayloadMap)
	if decodeError != nil {
		return
	}

	messageIdentifier, isResponsePayload := instance.extractMessageIdentifierFromPayload(incomingPayloadMap)

	if isResponsePayload {
		instance.routePayloadToPendingRequest(messageIdentifier, incomingPayloadMap)
	} else {
		instance.broadcastServerEventToSystem(incomingPayloadMap)
	}
}

func (instance *RpcMessageRouter_t) extractMessageIdentifierFromPayload(incomingPayloadMap map[string]interface{}) (uint64, bool) {
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

func (instance *RpcMessageRouter_t) routePayloadToPendingRequest(messageIdentifier uint64, incomingPayloadMap map[string]interface{}) {
	instance._private.requestsMutex.Lock()
	responseChannel, requestExists := instance._private.pendingRequests[messageIdentifier]
	instance._private.requestsMutex.Unlock()

	if requestExists {
		responseChannel <- incomingPayloadMap
		return
	}

	if errorValue, containsError := incomingPayloadMap["error"]; containsError {
		fmt.Printf("[RPC Message Router]: Music Assistant rejected fire-and-forget command (msg %d): %v\n", messageIdentifier, errorValue)
	}
}

func (instance *RpcMessageRouter_t) broadcastServerEventToSystem(incomingPayloadMap map[string]interface{}) {
	if eventNameString, isEventStringValid := incomingPayloadMap["event"].(string); isEventStringValid {
		eventDataPayload := incomingPayloadMap["data"]
		specificEventTopicString := fmt.Sprintf("ma_event_%s", eventNameString)
		instance._private.systemDataSource.Publish(specificEventTopicString, eventDataPayload)
	}
}

type RpcMessageRouter_t struct {
	_private struct {
		systemDataSource         database.DataSource
		webSocketManager         *WebSocketManager_t
		messageIdentifierCounter uint64
		pendingRequests          map[uint64]chan map[string]interface{}
		requestsMutex            sync.Mutex
	}
}

func (instance *RpcMessageRouter_t) Init(dataSource database.DataSource, webSocketManager *WebSocketManager_t) {
	instance._private.systemDataSource = dataSource
	instance._private.webSocketManager = webSocketManager
	instance._private.pendingRequests = make(map[uint64]chan map[string]interface{})
}
