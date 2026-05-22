package musicassistant

import (
	"fmt"
	"strings"

	"vinyl-orchestrator/core"
)

type SystemMediaPlayer struct {
	systemDataSource core.DataSource
	messageRouter    *RpcMessageRouter
}

func NewSystemMediaPlayer(routerInstance *RpcMessageRouter) *SystemMediaPlayer {
	return &SystemMediaPlayer{
		messageRouter: routerInstance,
	}
}

func (player *SystemMediaPlayer) SetDataSource(dataSource core.DataSource) {
	player.systemDataSource = dataSource
}

func (player *SystemMediaPlayer) retrieveTargetPlayerIdentifier() (string, error) {
	var targetPlayerIdentifier string
	player.systemDataSource.Read("GLOBAL_MusicAssistantTargetPlayerId", &targetPlayerIdentifier)

	if targetPlayerIdentifier == "" {
		return "", fmt.Errorf("player entity id not set")
	}
	return targetPlayerIdentifier, nil
}

func (player *SystemMediaPlayer) PlayMedia(mediaResourceIdentifier string) error {
	targetPlayerIdentifier, retrievalError := player.retrieveTargetPlayerIdentifier()
	if retrievalError != nil {
		return retrievalError
	}

	commandArguments := map[string]interface{}{
		"queue_id": targetPlayerIdentifier,
		"media":    []string{mediaResourceIdentifier},
	}

	return player.messageRouter.SendFireAndForgetCommand("player_queues/play_media", commandArguments)
}

func (player *SystemMediaPlayer) StopMedia() error {
	targetPlayerIdentifier, retrievalError := player.retrieveTargetPlayerIdentifier()
	if retrievalError != nil {
		return retrievalError
	}

	commandArguments := map[string]interface{}{
		"queue_id": targetPlayerIdentifier,
	}

	return player.messageRouter.SendFireAndForgetCommand("player_queues/stop", commandArguments)
}

func (player *SystemMediaPlayer) GetState() (string, error) {
	activeConnection, isConnectionAuthenticated := player.messageRouter.connectionManager.RetrieveActiveConnectionState()
	if activeConnection == nil || !isConnectionAuthenticated {
		return "idle", nil
	}

	targetPlayerIdentifier, retrievalError := player.retrieveTargetPlayerIdentifier()
	if retrievalError != nil {
		return "", retrievalError
	}

	commandArguments := map[string]interface{}{
		"queue_id": targetPlayerIdentifier,
	}

	remoteProcedureCallResponseData, executionError := player.messageRouter.ExecuteRemoteProcedureCall("player_queues/get", commandArguments)
	if executionError != nil {
		return "", executionError
	}

	return player.extractAndBroadcastState(remoteProcedureCallResponseData), nil
}

type MediaPlayerInfo struct {
	PlayerID    string `json:"player_id"`
	DisplayName string `json:"display_name"`
}

func (player *SystemMediaPlayer) GetAvailablePlayers() (interface{}, error) {
	responseData, executionError := player.messageRouter.ExecuteRemoteProcedureCall("players/all", nil)
	if executionError != nil {
		return nil, executionError
	}

	rawResultArray, isArrayValid := responseData["result"].([]interface{})
	if !isArrayValid {
		return nil, fmt.Errorf("unexpected result format from players/all")
	}

	var availablePlayers []MediaPlayerInfo
	for _, rawItem := range rawResultArray {
		if playerMap, isMapValid := rawItem.(map[string]interface{}); isMapValid {
			playerID, _ := playerMap["player_id"].(string)
			displayName, _ := playerMap["display_name"].(string)

			if displayName == "" {
				displayName, _ = playerMap["name"].(string)
			}

			if playerID != "" {
				availablePlayers = append(availablePlayers, MediaPlayerInfo{
					PlayerID:    playerID,
					DisplayName: displayName,
				})
			}
		}
	}

	return availablePlayers, nil
}

func (player *SystemMediaPlayer) extractAndBroadcastState(remoteProcedureCallResponseData map[string]interface{}) string {
	responseResultData, isMapValid := remoteProcedureCallResponseData["result"].(map[string]interface{})
	if !isMapValid {
		return "idle"
	}

	playerStateString, isStringValid := responseResultData["state"].(string)
	if !isStringValid {
		return "idle"
	}
	currentStateString := strings.ToLower(playerStateString)

	var trackPositionInSeconds float64
	var trackDurationInSeconds float64
	var activeTrackNameString string

	if elapsedSecondsValue, containsElapsedSeconds := responseResultData["elapsed_time"].(float64); containsElapsedSeconds {
		trackPositionInSeconds = elapsedSecondsValue
	}

	if currentItemDataMap, containsCurrentItem := responseResultData["current_item"].(map[string]interface{}); containsCurrentItem {
		if durationSecondsValue, containsDurationSeconds := currentItemDataMap["duration"].(float64); containsDurationSeconds {
			trackDurationInSeconds = durationSecondsValue
		}
		if nameStringValue, containsNameString := currentItemDataMap["name"].(string); containsNameString {
			activeTrackNameString = nameStringValue
		}
	}

	player.systemDataSource.Write("GLOBAL_ActiveRecordPlaybackState", currentStateString)
	player.systemDataSource.Write("GLOBAL_ActiveTrackProgressInSeconds", trackPositionInSeconds)
	player.systemDataSource.Write("GLOBAL_ActiveTrackTotalDurationInSeconds", trackDurationInSeconds)

	if activeTrackNameString != "" {
		player.systemDataSource.Write("GLOBAL_ActiveRecordTrackName", activeTrackNameString)
	}

	return currentStateString
}
