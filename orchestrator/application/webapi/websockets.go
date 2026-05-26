package webapi

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"

	"vinyl-orchestrator/application/database"
	"vinyl-orchestrator/core"

	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
)

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

var websocketUpgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool { return true },
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

func (plugin *WebServerPlugin) handleDataSourceMessage(
	msg DataSourceMessage,
	mergedEventChannel chan database.Event,
	responseChan chan DataSourceResponse,
	clientContext context.Context,
) {
	switch msg.Action {

	case "read":
		var value interface{}
		err := plugin.dataSource.Read(msg.Key, &value)
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
		if err := plugin.dataSource.Write(msg.Key, msg.Value); err != nil {
			fmt.Printf("DataSource bridge write error [%s]: %v\n", msg.Key, err)
		}

	case "subscribe":
		subChan := plugin.dataSource.Subscribe(msg.Topic)
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

func (plugin *WebServerPlugin) handleWebSockets(c *gin.Context) {
	conn, upgradeError := websocketUpgrader.Upgrade(c.Writer, c.Request, nil)
	if upgradeError != nil {
		fmt.Printf("WebSocket Upgrade Error: %v\n", upgradeError)
		return
	}
	defer conn.Close()

	clientContext, cancelClient := context.WithCancel(context.Background())
	defer cancelClient()

	mergedEventChannel := make(chan database.Event, 100)
	responseChan := make(chan DataSourceResponse, 20)

	dsChan := plugin.dataSource.Subscribe("datasource")
	go func(c <-chan database.Event) {
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

			var incomingEvent database.Event
			if err := json.Unmarshal(rawBytes, &incomingEvent); err == nil {
				if incomingEvent.Topic != "" {
					plugin.dataSource.Publish(incomingEvent.Topic, incomingEvent.Payload)
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
