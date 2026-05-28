package mqtt

import (
	"context"
	"encoding/json"
	"fmt"
	"strings"

	"vinyl-orchestrator/application/database"

	eclipseMqtt "github.com/eclipse/paho.mqtt.golang"
)

type HardwareTagPayload struct {
	UniqueIdentifier string `json:"uid"`
}

type BrokerPlugin struct {
	systemDataSource database.DataSource
	AlbumLibrary     database.AlbumLibrary
	mqttClient       eclipseMqtt.Client
}

func (plugin *BrokerPlugin) handleSuccessfulConnection(connectedClient eclipseMqtt.Client) {
	fmt.Println("Hardware MQTT Broker Bridge Online")
	connectedClient.Subscribe("vinyl/shelf/tag", 0, plugin.handleIncomingTagMessage).Wait()
	connectedClient.Subscribe("vinyl/shelf/status", 0, plugin.handleIncomingStatusMessage).Wait()
	connectedClient.Subscribe("vinyl/shelf/pong", 0, func(c eclipseMqtt.Client, m eclipseMqtt.Message) {
		plugin.systemDataSource.Write("GLOBAL_ReaderConnectionStatus", "online")
	}).Wait()

	commandChannel := plugin.systemDataSource.Subscribe("CMD_PingReader")
	go func() {
		for range commandChannel {
			plugin.systemDataSource.Write("GLOBAL_ReaderConnectionStatus", "pending")
			connectedClient.Publish("vinyl/shelf/command/ping", 0, false, "ping")
		}
	}()
}
func (plugin *BrokerPlugin) handleLostConnection(disconnectedClient eclipseMqtt.Client, connectionError error) {
	fmt.Printf("Hardware MQTT Broker Bridge Offline: %v\n", connectionError)
}

func (plugin *BrokerPlugin) handleIncomingTagMessage(client eclipseMqtt.Client, incomingMessage eclipseMqtt.Message) {
	var tagPayload HardwareTagPayload
	if err := json.Unmarshal(incomingMessage.Payload(), &tagPayload); err != nil {
		fmt.Printf("Hardware Error: Failed to parse tag JSON payload '%s': %v\n", string(incomingMessage.Payload()), err)
		return
	}

	normalizedUniqueIdentifier := strings.ToUpper(strings.TrimSpace(tagPayload.UniqueIdentifier))
	if normalizedUniqueIdentifier == "" {
		fmt.Printf("Hardware Error: Received empty UID from payload: %s\n", string(incomingMessage.Payload()))
		return
	}

	var currentStatus, currentActiveUID string
	plugin.systemDataSource.Read("GLOBAL_CurrentShelfStatus", &currentStatus)
	plugin.systemDataSource.Read("GLOBAL_ActiveRecordUid", &currentActiveUID)

	if currentStatus == "occupied" && currentActiveUID == normalizedUniqueIdentifier {
		fmt.Printf("Hardware Event: Tag %s already active, ignoring duplicate scan\n", normalizedUniqueIdentifier)
		return
	}

	fmt.Printf("Hardware Event: Scanned Tag %s\n", normalizedUniqueIdentifier)
	plugin.systemDataSource.Write("GLOBAL_CurrentShelfStatus", "occupied")
	plugin.systemDataSource.Write("GLOBAL_ActiveRecordUid", normalizedUniqueIdentifier)
	plugin.systemDataSource.Write("GLOBAL_LastScannedNfcTag", normalizedUniqueIdentifier)
}

func (plugin *BrokerPlugin) handleIncomingStatusMessage(client eclipseMqtt.Client, incomingMessage eclipseMqtt.Message) {
	shelfStatusString := strings.TrimSpace(string(incomingMessage.Payload()))

	if shelfStatusString == "removed" {
		fmt.Println("Hardware Event: Record Removed")
		plugin.systemDataSource.Write("GLOBAL_CurrentShelfStatus", "empty")
	}
}

func NewBrokerPlugin() *BrokerPlugin {
	return &BrokerPlugin{}
}

func (plugin *BrokerPlugin) Name() string {
	return "Hardware_MQTT_Broker_Bridge"
}

func (plugin *BrokerPlugin) Init(dataSource database.DataSource, AlbumLibrary database.AlbumLibrary) error {
	plugin.systemDataSource = dataSource
	plugin.AlbumLibrary = AlbumLibrary
	return nil
}

func (plugin *BrokerPlugin) StartPlugin(applicationContext context.Context) error {
	var mqttHostAddress string
	var mqttTcpPort int

	if err := plugin.systemDataSource.Read("GLOBAL_MqttBrokerHostAddress", &mqttHostAddress); err != nil {
		return err
	}
	if err := plugin.systemDataSource.Read("GLOBAL_MqttTcpPort", &mqttTcpPort); err != nil {
		return err
	}

	brokerConnectionString := fmt.Sprintf("tcp://%s:%d", mqttHostAddress, mqttTcpPort)

	clientConnectionOptions := eclipseMqtt.NewClientOptions()
	clientConnectionOptions.AddBroker(brokerConnectionString)
	clientConnectionOptions.SetClientID("Vinyl_Go_Orchestrator_Internal_Bridge")
	clientConnectionOptions.SetCleanSession(true)
	clientConnectionOptions.SetOnConnectHandler(plugin.handleSuccessfulConnection)
	clientConnectionOptions.SetConnectionLostHandler(plugin.handleLostConnection)

	plugin.mqttClient = eclipseMqtt.NewClient(clientConnectionOptions)
	connectionToken := plugin.mqttClient.Connect()
	connectionToken.Wait()

	return connectionToken.Error()
}

func (plugin *BrokerPlugin) StopPlugin(applicationContext context.Context) error {
	if plugin.mqttClient != nil && plugin.mqttClient.IsConnected() {
		plugin.mqttClient.Disconnect(250)
	}
	return nil
}
