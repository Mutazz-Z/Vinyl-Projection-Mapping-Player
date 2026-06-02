/*
 * Grabs the status of the media player while media is playing and updates the system data source accordingly
 */

package musicassistant

import (
	"fmt"
	"strings"
	"vinyl-orchestrator/typedefs"

	"github.com/mitchellh/mapstructure"
)

type RawMediaPlayerStatus_t struct {
	State       string  `mapstructure:"state"`
	ElapsedTime float64 `mapstructure:"elapsed_time"`
	CurrentItem struct {
		Duration  float64 `mapstructure:"duration"`
		Name      string  `mapstructure:"name"`
		MediaItem struct {
			ItemId   string    `mapstructure:"item_id"`
			Provider string `mapstructure:"provider"`

			Album struct {
				ItemId   string    `mapstructure:"item_id"`
				Provider string `mapstructure:"provider"`
				Name     string `mapstructure:"name"`
			} `mapstructure:"album"`
		} `mapstructure:"media_item"`
	} `mapstructure:"current_item"`
}

type MediaPlayerStatus_t struct {
	State         typedefs.MediaPlaybackState_t `json:"state"`
	ElapsedTime   float64                       `json:"elapsed_time"`
	TotalDuration float64                       `json:"total_duration"`
	ActiveTrack   typedefs.ActiveTrack_t        `json:"active_track"`
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

	var parsedState RawMediaPlayerStatus_t
	mapstructure.Decode(rawResult, &parsedState)

	return MediaPlayerStatus_t{
		State:         parsePlayerState(parsedState.State),
		ElapsedTime:   parsedState.ElapsedTime,
		TotalDuration: parsedState.CurrentItem.Duration,
		ActiveTrack: typedefs.ActiveTrack_t{
			TrackName:   parsedState.CurrentItem.Name,
			TrackItemId: parsedState.CurrentItem.MediaItem.ItemId,
			AlbumItemId: parsedState.CurrentItem.MediaItem.Album.ItemId,
			Provider:    parsedState.CurrentItem.MediaItem.Provider,
		},
	}
}

func parsePlayerState(rawState string) typedefs.MediaPlaybackState_t {
	switch strings.ToLower(rawState) {
	case "playing":
		return typedefs.PlayerState_Playing
	case "paused":
		return typedefs.PlayerState_Paused
	case "idle":
		return typedefs.PlayerState_Idle
	case "buffering":
		return typedefs.PlayerState_Buffering
	case "stopped":
		return typedefs.PlayerState_Stopped
	case "off", "standby":
		return typedefs.PlayerState_Offline
	case "error":
		return typedefs.PlayerState_Error
	default:
		return typedefs.PlayerState_Unknown
	}
}
