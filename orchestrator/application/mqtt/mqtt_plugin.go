/*
 * Mqtt Plugin to communicate with esp based device with nfc reader
 */

package mqtt

import (
	"context"
	"encoding/json"
	"fmt"
	"sync"
	"time"

	"vinyl-orchestrator/application/database"
	"vinyl-orchestrator/core"

	eclipseMqtt "github.com/eclipse/paho.mqtt.golang"
)

func (instance *MqttPlugin_t) handleSuccessfulConnection(connectedClient eclipseMqtt.Client) {
	fmt.Println("[Mqtt Plugin]: Mqtt Broker Bridge Online")
	connectedClient.Subscribe("vinyl/shelf/state", 0, instance.handleIncomingMessage).Wait()
	connectedClient.Subscribe("vinyl/shelf/status", 0, instance.handleDeviceStatus).Wait()
}

func (instance *MqttPlugin_t) handleLostConnection(disconnectedClient eclipseMqtt.Client, connectionError error) {
	fmt.Printf("[Mqtt Plugin]: Mqtt Broker Bridge Offline: %v\n", connectionError)
}

func (instance *MqttPlugin_t) handleDeviceStatus(client eclipseMqtt.Client, incomingMessage eclipseMqtt.Message) {
	var status core.ReaderStatus_t
	json.Unmarshal(incomingMessage.Payload(), &status)

	if status == core.EspReaderStatus_Online {
		fmt.Printf("[Mqtt Plugin]: ESP Reader Status changed to: Online\n")
	} else {
		fmt.Printf("[Mqtt Plugin]: ESP Reader Status changed to: Offline\n")
	}

	instance._private.systemDataSource.Write(core.Global_ReaderConnectionStatus, status)
}

func (instance *MqttPlugin_t) startWatchdogTimer() {
	instance._private.timerMutex.Lock()
	defer instance._private.timerMutex.Unlock()

	if instance._private.watchdogTimer != nil {
		instance._private.watchdogTimer.Stop()
	}

	instance._private.watchdogTimer = time.AfterFunc(instance._private.WatchdogTimeout, func() {
		instance._private.systemDataSource.Write(core.Global_CurrentShelfStatus, core.ShelfStatus_Empty)
		instance._private.watchdogExpired = true
	})
}

func (instance *MqttPlugin_t) checkUidAgainstLibrary(uid string) {
	exists := instance._private.AlbumLibrary.CheckUidExistsInLibrary(uid)
	if !exists {
		fmt.Printf("[Mqtt Plugin]: Unknown Tag %s, writing to registry for registration\n", uid)
		instance._private.systemDataSource.Write(core.Global_LastUnknownUidScanned, uid)
	} else {
		fmt.Printf("[Mqtt Plugin]: Scanned Tag %s\n", uid)
		instance._private.systemDataSource.Write(core.Global_LastKnownUidScanned, uid)
	}
	instance._private.systemDataSource.Write(core.Global_CurrentShelfStatus, core.ShelfStatus_Occupied)
}

func (instance *MqttPlugin_t) scannedUidIsTheSameAsPreviousAndWatchdogNotExpired(uid string) bool {
	var previousKnownUidScanned, previousUnknownUidScanned string
	instance._private.systemDataSource.Read(core.Global_LastKnownUidScanned, &previousKnownUidScanned)
	instance._private.systemDataSource.Read(core.Global_LastUnknownUidScanned, &previousUnknownUidScanned)

	return (previousKnownUidScanned == uid || previousUnknownUidScanned == uid) && !instance._private.watchdogExpired
}

func (instance *MqttPlugin_t) handleIncomingMessage(client eclipseMqtt.Client, incomingMessage eclipseMqtt.Message) {
	var vinylShelfMessage VinylShelfMessage_t
	json.Unmarshal(incomingMessage.Payload(), &vinylShelfMessage)

	if vinylShelfMessage.ShelfStatus == core.ShelfStatus_Occupied {
		if instance._private.watchdogTimer != nil {
			instance._private.watchdogTimer.Stop()
		}

		if instance.scannedUidIsTheSameAsPreviousAndWatchdogNotExpired(vinylShelfMessage.UidScanned) {
			fmt.Printf("[Mqtt Plugin]: Tag %s already active, ignoring duplicate scan\n", vinylShelfMessage.UidScanned)
		} else {
			instance.checkUidAgainstLibrary(vinylShelfMessage.UidScanned)
		}

	} else {
		instance._private.watchdogExpired = false
		instance.startWatchdogTimer()
	}
}

func (instance *MqttPlugin_t) getBrokerServer() string {
	var mqttHostAddress string
	var mqttTcpPort int

	instance._private.systemDataSource.Read(core.Global_MqttBrokerHostAddress, &mqttHostAddress)
	instance._private.systemDataSource.Read(core.Global_MqttTcpPort, &mqttTcpPort)

	return fmt.Sprintf("tcp://%s:%d", mqttHostAddress, mqttTcpPort)
}

type VinylShelfMessage_t struct {
	UidScanned  string             `json:"uid"`
	ShelfStatus core.ShelfStatus_t `json:"shelfStatus"`
}

type MqttPlugin_t struct {
	_private struct {
		systemDataSource database.DataSource
		mqttClient       eclipseMqtt.Client
		AlbumLibrary     database.AlbumLibrary

		watchdogTimer   *time.Timer
		WatchdogTimeout time.Duration
		timerMutex      sync.Mutex
		watchdogExpired bool
	}
}

func (instance *MqttPlugin_t) Init(dataSource database.DataSource, albumLibrary database.AlbumLibrary) error {
	instance._private.systemDataSource = dataSource
	instance._private.AlbumLibrary = albumLibrary
	instance._private.WatchdogTimeout = 1 * time.Second

	clientConnectionOptions := eclipseMqtt.NewClientOptions()
	clientConnectionOptions.AddBroker(instance.getBrokerServer())
	clientConnectionOptions.SetClientID("Vinyl_Go_Orchestrator_Internal_Bridge")
	clientConnectionOptions.SetCleanSession(true)
	clientConnectionOptions.SetOnConnectHandler(instance.handleSuccessfulConnection)
	clientConnectionOptions.SetConnectionLostHandler(instance.handleLostConnection)

	instance._private.mqttClient = eclipseMqtt.NewClient(clientConnectionOptions)
	connectionToken := instance._private.mqttClient.Connect()
	connectionToken.Wait()

	return connectionToken.Error()
}

func (instance *MqttPlugin_t) StopPlugin(applicationContext context.Context) error {
	if instance._private.mqttClient != nil && instance._private.mqttClient.IsConnected() {
		instance._private.mqttClient.Disconnect(250)
	}
	return nil
}
