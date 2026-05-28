package mqtt

import (
	"context"
	"encoding/json"
	"fmt"
	"sync"
	"time"

	"vinyl-orchestrator/application/database"

	eclipseMqtt "github.com/eclipse/paho.mqtt.golang"
)

func (mqttPlugin *MqttPlugin_t) handleSuccessfulConnection(connectedClient eclipseMqtt.Client) {
	fmt.Println("[Mqtt Plugin]: MQTT Broker Bridge Online")
	connectedClient.Subscribe("vinyl/shelf/state", 0, mqttPlugin.handleIncomingMessage).Wait()
	connectedClient.Subscribe("vinyl/shelf/pong", 0, func(c eclipseMqtt.Client, m eclipseMqtt.Message) {
		mqttPlugin._private.systemDataSource.Write("GLOBAL_ReaderConnectionStatus", "online")
	}).Wait()

	commandChannel := mqttPlugin._private.systemDataSource.Subscribe("CMD_PingReader")
	go func() {
		for range commandChannel {
			mqttPlugin._private.systemDataSource.Write("GLOBAL_ReaderConnectionStatus", "pending")
			connectedClient.Publish("vinyl/shelf/command/ping", 0, false, "ping")
		}
	}()
}
func (mqttPlugin *MqttPlugin_t) handleLostConnection(disconnectedClient eclipseMqtt.Client, connectionError error) {
	fmt.Printf("[Mqtt Plugin]: MQTT Broker Bridge Offline: %v\n", connectionError)
}

func (mqttPlugin *MqttPlugin_t) startWatchdogTimer() {
	mqttPlugin._private.timerMutex.Lock()
	defer mqttPlugin._private.timerMutex.Unlock()

	if mqttPlugin._private.watchdogTimer != nil {
		mqttPlugin._private.watchdogTimer.Stop()
	}

	mqttPlugin._private.watchdogTimer = time.AfterFunc(mqttPlugin._private.WatchdogTimeout, func() {
		mqttPlugin._private.systemDataSource.Write("GLOBAL_CurrentUidScanned", "")
		mqttPlugin._private.systemDataSource.Write("GLOBAL_CurrentShelfStatus", "empty")
	})
}

func (mqttPlugin *MqttPlugin_t) handleIncomingMessage(client eclipseMqtt.Client, incomingMessage eclipseMqtt.Message) {
	var vinylShelfMessage VinylShelfMessage_t
	json.Unmarshal(incomingMessage.Payload(), &vinylShelfMessage)

	if vinylShelfMessage.ShelfIsOccupied {
		if mqttPlugin._private.watchdogTimer != nil {
			mqttPlugin._private.watchdogTimer.Stop()
		}

		var previousUidScanned string
		mqttPlugin._private.systemDataSource.Read("GLOBAL_CurrentUidScanned", &previousUidScanned)

		if previousUidScanned == vinylShelfMessage.UidScanned {
			fmt.Printf("[Mqtt Plugin]: Tag %s already active, ignoring duplicate scan\n", vinylShelfMessage.UidScanned)
		} else {

			fmt.Printf("[Mqtt Plugin]: Scanned Tag %s\n", vinylShelfMessage.UidScanned)

			mqttPlugin._private.systemDataSource.Write("GLOBAL_CurrentShelfStatus", vinylShelfMessage.ShelfIsOccupied)
			mqttPlugin._private.systemDataSource.Write("GLOBAL_CurrentUidScanned", vinylShelfMessage.UidScanned)
		}

	} else {
		mqttPlugin.startWatchdogTimer()

	}
}

func (mqttPlugin *MqttPlugin_t) StopPlugin(applicationContext context.Context) error {
	if mqttPlugin._private.mqttClient != nil && mqttPlugin._private.mqttClient.IsConnected() {
		mqttPlugin._private.mqttClient.Disconnect(250)
	}
	return nil
}

type VinylShelfMessage_t struct {
	UidScanned      string `json:"uid"`
	ShelfIsOccupied bool   `json:"shelfStatus"`
}

type MqttPlugin_t struct {
	_private struct {
		systemDataSource database.DataSource
		mqttClient       eclipseMqtt.Client

		watchdogTimer    *time.Timer
		WatchdogTimeout  time.Duration
		timerMutex          sync.Mutex
	}
}

func (mqttPlugin *MqttPlugin_t) getBrokerServer() string {
	var mqttHostAddress string
	var mqttTcpPort int

	mqttPlugin._private.systemDataSource.Read("GLOBAL_MqttBrokerHostAddress", &mqttHostAddress)
	mqttPlugin._private.systemDataSource.Read("GLOBAL_MqttTcpPort", &mqttTcpPort)

	return fmt.Sprintf("tcp://%s:%d", mqttHostAddress, mqttTcpPort)
}

func (mqttPlugin *MqttPlugin_t) Init(dataSource database.DataSource) error {
	mqttPlugin._private.systemDataSource = dataSource
	mqttPlugin._private.WatchdogTimeout = 1 * time.Second

	clientConnectionOptions := eclipseMqtt.NewClientOptions()
	clientConnectionOptions.AddBroker(mqttPlugin.getBrokerServer())
	clientConnectionOptions.SetClientID("Vinyl_Go_Orchestrator_Internal_Bridge")
	clientConnectionOptions.SetCleanSession(true)
	clientConnectionOptions.SetOnConnectHandler(mqttPlugin.handleSuccessfulConnection)
	clientConnectionOptions.SetConnectionLostHandler(mqttPlugin.handleLostConnection)

	mqttPlugin._private.mqttClient = eclipseMqtt.NewClient(clientConnectionOptions)
	connectionToken := mqttPlugin._private.mqttClient.Connect()
	connectionToken.Wait()

	return connectionToken.Error()
}
