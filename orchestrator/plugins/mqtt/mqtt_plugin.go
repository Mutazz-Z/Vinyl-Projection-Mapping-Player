package mqtt

import (
	"context"
	"encoding/json"
	"fmt"
	"strings"

	eclipseMqtt "github.com/eclipse/paho.mqtt.golang"
	"vinyl-orchestrator/core"
)

type HardwareTagPayload struct {
	UniqueIdentifier string `json:"uid"`
}

type BrokerPlugin struct {
	systemDataSource  core.DataSource
	libraryRepository core.LibraryRepository
	mqttClient        eclipseMqtt.Client
}

func NewBrokerPlugin() *BrokerPlugin {
	return &BrokerPlugin{}
}

func (plugin *BrokerPlugin) Name() string {
	return "Hardware_MQTT_Broker_Bridge"
}

func (plugin *BrokerPlugin) Init(dataSource core.DataSource, libraryRepository core.LibraryRepository) error {
	plugin.systemDataSource = dataSource
	plugin.libraryRepository = libraryRepository
	return nil
}

func (plugin *BrokerPlugin) StartPlugin(applicationContext context.Context) error {
	var mqttHostAddress string
	var mqttTcpPort int

	readHostError := plugin.systemDataSource.Read("mqtt_broker_host_address", &mqttHostAddress)
	if readHostError != nil {
		return readHostError
	}

	readPortError := plugin.systemDataSource.Read("mqtt_tcp_port", &mqttTcpPort)
	if readPortError != nil {
		return readPortError
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

	internalVisualUpdateChannel := plugin.systemDataSource.Subscribe("projector_visual_update")
	go plugin.forwardVisualUpdatesToHardwareBroker(internalVisualUpdateChannel)

	return connectionToken.Error()
}

func (plugin *BrokerPlugin) forwardVisualUpdatesToHardwareBroker(updateChannel <-chan core.Event) {
	for incomingEvent := range updateChannel {
		visualPayloadStruct, isVisualPayload := incomingEvent.Payload.(core.VisualEffectPayload)
		if !isVisualPayload {
			continue
		}

		marshaledPayloadBytes, marshalError := json.Marshal(visualPayloadStruct)
		if marshalError != nil {
			continue
		}

		if plugin.mqttClient != nil && plugin.mqttClient.IsConnected() {
			plugin.mqttClient.Publish("vinyl/shelf/visuals", 0, false, marshaledPayloadBytes)
		}
	}
}

func (plugin *BrokerPlugin) handleSuccessfulConnection(connectedClient eclipseMqtt.Client) {
	fmt.Println("Hardware MQTT Broker Bridge Online")

	hardwareTagTopic := "vinyl/shelf/tag"
	tagSubscriptionToken := connectedClient.Subscribe(hardwareTagTopic, 0, plugin.handleIncomingTagMessage)
	tagSubscriptionToken.Wait()

	hardwareStatusTopic := "vinyl/shelf/status"
	statusSubscriptionToken := connectedClient.Subscribe(hardwareStatusTopic, 0, plugin.handleIncomingStatusMessage)
	statusSubscriptionToken.Wait()
}

func (plugin *BrokerPlugin) handleLostConnection(disconnectedClient eclipseMqtt.Client, connectionError error) {
	fmt.Printf("Hardware MQTT Broker Bridge Offline: %v\n", connectionError)
}

func (plugin *BrokerPlugin) handleIncomingTagMessage(client eclipseMqtt.Client, incomingMessage eclipseMqtt.Message) {
	var tagPayload HardwareTagPayload
	unmarshalError := json.Unmarshal(incomingMessage.Payload(), &tagPayload)
	if unmarshalError != nil {
		return
	}

	normalizedUniqueIdentifier := strings.ToUpper(strings.TrimSpace(tagPayload.UniqueIdentifier))
	if normalizedUniqueIdentifier == "" {
		return
	}

	fmt.Printf("Hardware Event: Scanned Tag %s\n", normalizedUniqueIdentifier)

	plugin.systemDataSource.Write("physical_shelf_status", "occupied")
	plugin.systemDataSource.Write("active_record_unique_identifier", normalizedUniqueIdentifier)
	plugin.systemDataSource.Publish("hardware_record_scanned", normalizedUniqueIdentifier)
}

func (plugin *BrokerPlugin) handleIncomingStatusMessage(client eclipseMqtt.Client, incomingMessage eclipseMqtt.Message) {
	shelfStatusString := strings.TrimSpace(string(incomingMessage.Payload()))

	if shelfStatusString == "removed" {
		fmt.Println("Hardware Event: Record Removed")
		plugin.systemDataSource.Write("physical_shelf_status", "empty")
		plugin.systemDataSource.Publish("hardware_record_removed", nil)
	}
}

func (plugin *BrokerPlugin) StopPlugin(applicationContext context.Context) error {
	if plugin.mqttClient != nil && plugin.mqttClient.IsConnected() {
		disconnectTimeoutMilliseconds := uint(250)
		plugin.mqttClient.Disconnect(disconnectTimeoutMilliseconds)
	}
	return nil
}
