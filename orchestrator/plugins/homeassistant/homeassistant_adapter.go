package homeassistant

import (
	"bytes"
	"context"
	"crypto/tls"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"

	"vinyl-orchestrator/core"
)

type HomeAssistantAdapter struct {
	systemDataSource core.DataSource
	httpClient       *http.Client
}

func NewHomeAssistantAdapter() *HomeAssistantAdapter {
	tlsConfiguration := &tls.Config{InsecureSkipVerify: true}
	secureTransport := &http.Transport{TLSClientConfig: tlsConfiguration}

	return &HomeAssistantAdapter{
		httpClient: &http.Client{
			Timeout:   5 * time.Second,
			Transport: secureTransport,
		},
	}
}

func (adapter *HomeAssistantAdapter) Name() string {
	return "Home_Assistant_Media_Adapter"
}

func (adapter *HomeAssistantAdapter) Init(dataSource core.DataSource, libraryRepository core.LibraryRepository) error {
	adapter.systemDataSource = dataSource
	return nil
}

func (adapter *HomeAssistantAdapter) StartPlugin(applicationContext context.Context) error {
	return nil
}

func (adapter *HomeAssistantAdapter) StopPlugin(applicationContext context.Context) error {
	return nil
}

func (adapter *HomeAssistantAdapter) retrieveConnectionCredentials() (string, string, string, error) {
	var homeAssistantUrl string
	var homeAssistantToken string
	var homeAssistantPlayerEntityId string

	adapter.systemDataSource.Read("home_assistant_url", &homeAssistantUrl)
	adapter.systemDataSource.Read("home_assistant_token", &homeAssistantToken)
	adapter.systemDataSource.Read("home_assistant_player_entity_id", &homeAssistantPlayerEntityId)

	if homeAssistantUrl == "" || homeAssistantToken == "" || homeAssistantPlayerEntityId == "" {
		return "", "", "", fmt.Errorf("missing home assistant credentials")
	}

	return homeAssistantUrl, homeAssistantToken, homeAssistantPlayerEntityId, nil
}

func (adapter *HomeAssistantAdapter) executeHttpServiceCall(domainName string, serviceName string, servicePayload map[string]interface{}) error {
	targetUrl, authorizationToken, _, credentialError := adapter.retrieveConnectionCredentials()
	if credentialError != nil {
		return credentialError
	}

	jsonPayloadBytes, encodingError := json.Marshal(servicePayload)
	if encodingError != nil {
		return encodingError
	}

	endpointPath := fmt.Sprintf("%s/api/services/%s/%s", targetUrl, domainName, serviceName)
	httpRequest, requestCreationError := http.NewRequest("POST", endpointPath, bytes.NewBuffer(jsonPayloadBytes))
	if requestCreationError != nil {
		return requestCreationError
	}

	httpRequest.Header.Set("Authorization", "Bearer "+authorizationToken)
	httpRequest.Header.Set("Content-Type", "application/json")

	httpResponse, requestExecutionError := adapter.httpClient.Do(httpRequest)
	if requestExecutionError != nil {
		return requestExecutionError
	}
	defer httpResponse.Body.Close()

	if httpResponse.StatusCode >= 200 && httpResponse.StatusCode < 300 {
		return nil
	}

	responseBodyBytes, _ := io.ReadAll(httpResponse.Body)
	return fmt.Errorf("api rejected request: %s", string(responseBodyBytes))
}

func (adapter *HomeAssistantAdapter) PlayMedia(mediaUri string) error {
	_, _, targetPlayerEntityId, credentialError := adapter.retrieveConnectionCredentials()
	if credentialError != nil {
		return credentialError
	}

	playMediaPayload := map[string]interface{}{
		"entity_id":          targetPlayerEntityId,
		"media_content_id":   mediaUri,
		"media_content_type": "music",
		"enqueue":            "replace",
	}

	musicAssistantError := adapter.executeHttpServiceCall("mass", "play_media", playMediaPayload)
	if musicAssistantError != nil {
		return adapter.executeHttpServiceCall("media_player", "play_media", playMediaPayload)
	}
	return nil
}

func (adapter *HomeAssistantAdapter) StopMedia() error {
	_, _, targetPlayerEntityId, credentialError := adapter.retrieveConnectionCredentials()
	if credentialError != nil {
		return credentialError
	}

	stopMediaPayload := map[string]interface{}{
		"entity_id": targetPlayerEntityId,
	}

	return adapter.executeHttpServiceCall("media_player", "media_stop", stopMediaPayload)
}

func (adapter *HomeAssistantAdapter) GetState() (string, error) {
	targetUrl, authorizationToken, targetPlayerEntityId, credentialError := adapter.retrieveConnectionCredentials()
	if credentialError != nil {
		return "", credentialError
	}

	endpointPath := fmt.Sprintf("%s/api/states/%s", targetUrl, targetPlayerEntityId)
	httpRequest, requestCreationError := http.NewRequest("GET", endpointPath, nil)
	if requestCreationError != nil {
		return "", requestCreationError
	}

	httpRequest.Header.Set("Authorization", "Bearer "+authorizationToken)

	httpResponse, requestExecutionError := adapter.httpClient.Do(httpRequest)
	if requestExecutionError != nil {
		return "", requestExecutionError
	}
	defer httpResponse.Body.Close()

	var stateData map[string]interface{}
	decodingError := json.NewDecoder(httpResponse.Body).Decode(&stateData)
	if decodingError != nil {
		return "", decodingError
	}

	playerStateString, isString := stateData["state"].(string)
	if !isString {
		return "", fmt.Errorf("state field missing or invalid")
	}

	return playerStateString, nil
}
