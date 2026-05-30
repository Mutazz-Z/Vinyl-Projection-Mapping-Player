/*
 * Grabs the status of the media player while media is playing and updates the system data source accordingly
 */

package musicassistant

import (
	"fmt"
	"strings"
	"vinyl-orchestrator/core"

	"github.com/mitchellh/mapstructure"
)

type PlayerStateResult_t struct {
	State       string  `mapstructure:"state"`
	ElapsedTime float64 `mapstructure:"elapsed_time"`
	CurrentItem struct {
		Duration float64 `mapstructure:"duration"`
		Name     string  `mapstructure:"name"`
	} `mapstructure:"current_item"`
}

type MediaPlayerStatus_t struct {
	State         core.PlayerState_t `json:"state"`
	ElapsedTime   float64            `json:"elapsed_time"`
	TotalDuration float64            `json:"total_duration"`
	TrackName     string             `json:"track_name"`
}

func (instance *SystemMediaPlayer_t) getMediaPlayerStatus(targetPlayerIdentifier string) MediaPlayerStatus_t {
	commandArguments := map[string]interface{}{
		"queue_id": targetPlayerIdentifier,
	}
	response, _ := instance._private.messageRouter.ExecuteRemoteProcedureCall("player_queues/get", commandArguments)

	rawResult, ok := response["result"]
	if !ok {
		fmt.Println("Response did not contain a 'result' field")
		return MediaPlayerStatus_t{}
	}

	var parsedState PlayerStateResult_t
	mapstructure.Decode(rawResult, &parsedState)

	return MediaPlayerStatus_t{
		State:         parsePlayerState(parsedState.State),
		ElapsedTime:   parsedState.ElapsedTime,
		TotalDuration: parsedState.CurrentItem.Duration,
		TrackName:     parsedState.CurrentItem.Name,
	}
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
