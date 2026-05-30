package musicassistant

import (
	"fmt"
	"strings"

	"vinyl-orchestrator/application/database"
	"vinyl-orchestrator/core"

	"github.com/mitchellh/mapstructure"
)

func (instance *SystemMediaPlayer_t) retrieveTargetPlayerIdentifier() string {
	var targetPlayerIdentifier string
	instance._private.systemDataSource.Read(core.Global_MusicAssistantTargetPlayerId, &targetPlayerIdentifier)

	return targetPlayerIdentifier
}

func (instance *SystemMediaPlayer_t) PlayMedia(mediaUri string) error {
	targetPlayerIdentifier := instance.retrieveTargetPlayerIdentifier()

	commandArguments := map[string]interface{}{
		"queue_id": targetPlayerIdentifier,
		"media":    []string{mediaUri},
	}

	return instance._private.messageRouter.SendFireAndForgetCommand("player_queues/play_media", commandArguments)
}

func (instance *SystemMediaPlayer_t) StopMedia() error {
	targetPlayerIdentifier := instance.retrieveTargetPlayerIdentifier()

	commandArguments := map[string]interface{}{
		"queue_id": targetPlayerIdentifier,
	}

	return instance._private.messageRouter.SendFireAndForgetCommand("player_queues/stop", commandArguments)
}

func (instance *SystemMediaPlayer_t) fetchRawPlayerState() (map[string]interface{}, error) {
	activeConnection, isAuthenticated := instance._private.messageRouter.connectionManager.RetrieveActiveConnectionState()
	if activeConnection == nil || !isAuthenticated {
		return nil, fmt.Errorf("music assistant connection is offline or unauthenticated")
	}

	targetPlayerIdentifier := instance.retrieveTargetPlayerIdentifier()
	commandArguments := map[string]interface{}{
		"queue_id": targetPlayerIdentifier,
	}

	return instance._private.messageRouter.ExecuteRemoteProcedureCall("player_queues/get", commandArguments)
}

type PlayerStateResult_t struct {
	State       string  `mapstructure:"state"`
	ElapsedTime float64 `mapstructure:"elapsed_time"`
	CurrentItem struct {
		Duration float64 `mapstructure:"duration"`
		Name     string  `mapstructure:"name"`
	} `mapstructure:"current_item"`
}

func (instance *SystemMediaPlayer_t) parsePlayerStateResponse(rpcResponse map[string]interface{}) PlayerStateResult_t {
	var parsedState PlayerStateResult_t
	rawResult, ok := rpcResponse["result"]
	if !ok {
		return parsedState
	}
	
	mapstructure.Decode(rawResult, &parsedState)
	return parsedState
}

func (instance *SystemMediaPlayer_t) broadcastStateToDatabase(parsedState PlayerStateResult_t, typedState core.PlayerState_t) {
	mediaPlaybackState := core.MediaPlaybackState_t{
		State:        typedState,
		ErrorMessage: "",
	}
	
	instance._private.systemDataSource.Write(core.Global_MediaPlaybackState, mediaPlaybackState)
	instance._private.systemDataSource.Write(core.Global_ActiveTrackProgressInSeconds, parsedState.ElapsedTime)
	instance._private.systemDataSource.Write(core.Global_ActiveTrackTotalDurationInSeconds, parsedState.CurrentItem.Duration)

	if parsedState.CurrentItem.Name != "" {
		instance._private.systemDataSource.Write(core.Global_ActiveRecordTrackName, parsedState.CurrentItem.Name)
	}
}

func (instance *SystemMediaPlayer_t) UpdateState() (core.PlayerState_t, error) {
	rawRpcResponse, err := instance.fetchRawPlayerState()
	if err != nil {
		return core.PlayerState_Unknown, err
	}

	parsedState := instance.parsePlayerStateResponse(rawRpcResponse)
	playerState := parsePlayerState(parsedState.State)

	instance.broadcastStateToDatabase(parsedState, playerState)

	return playerState, nil
}

type AvailableMediaPlayers_t struct {
	PlayerID    string `json:"player_id" mapstructure:"player_id"`
	DisplayName string `json:"display_name" mapstructure:"display_name"`
}

func (instance *SystemMediaPlayer_t) GetAvailablePlayers() (interface{}, error) {
	responseData, executionError := instance._private.messageRouter.ExecuteRemoteProcedureCall("players/all", nil)
	if executionError != nil {
		return nil, executionError
	}

	rawResult, ok := responseData["result"]
	if !ok {
		return nil, fmt.Errorf("response did not contain a 'result' field")
	}

	var availablePlayers []AvailableMediaPlayers_t
	err := mapstructure.Decode(rawResult, &availablePlayers)
	if err != nil {
		return nil, fmt.Errorf("failed to decode players: %w", err)
	}

	return availablePlayers, nil
}

func parsePlayerState(rawState string) core.PlayerState_t {
	switch strings.ToLower(rawState) {
	case "playing":
		return core.PlayerState_Playing
	case "paused":
		return core.PlayerState_Paused
	case "idle":
		return core.PlayerState_Idle
	case "buffering":
		return core.PlayerState_Buffering
	case "stopped":
		return core.PlayerState_Stopped
	case "off", "standby":
		return core.PlayerState_Off
	case "error":
		return core.PlayerState_Error
	default:
		return core.PlayerState_Unknown
	}
}

type MediaPlayer interface {
	PlayMedia(mediaUri string) error
	StopMedia() error
	UpdateState() (core.PlayerState_t, error)
}

type SystemMediaPlayer_t struct {
	_private struct {
		systemDataSource database.DataSource
		messageRouter    *RpcMessageRouter
	}
}

func (instance *SystemMediaPlayer_t) Init(dataSource database.DataSource, routerInstance *RpcMessageRouter) {
	instance._private.systemDataSource = dataSource
	instance._private.messageRouter = routerInstance
}
