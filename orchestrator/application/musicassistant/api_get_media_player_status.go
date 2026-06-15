/*
 * Grabs the status of the media player while media is playing and updates the system data source accordingly
 */

package musicassistant

import (
	"fmt"
	"math"
	"strconv"
	"strings"
	"time"
	"vinyl-orchestrator/typedefs"

	"github.com/mitchellh/mapstructure"
)

type RawMediaPlayerStatus_t struct {
	State        string  `mapstructure:"state"`
	ElapsedTime  float64 `mapstructure:"elapsed_time"`
	CurrentIndex int     `mapstructure:"current_index"`
	CurrentItem  struct {
		Duration  float64 `mapstructure:"duration"`
		Name      string  `mapstructure:"name"`
		MediaItem struct {
			ItemId   string `mapstructure:"item_id"`
			Provider string `mapstructure:"provider"`

			Album struct {
				ItemId   string `mapstructure:"item_id"`
				Provider string `mapstructure:"provider"`
				Name     string `mapstructure:"name"`
			} `mapstructure:"album"`
		} `mapstructure:"media_item"`
	} `mapstructure:"current_item"`
}

func parseUnixTimestampSeconds(value interface{}) (float64, bool) {
	switch typedValue := value.(type) {
	case int:
		return float64(typedValue), true
	case int32:
		return float64(typedValue), true
	case int64:
		return float64(typedValue), true
	case float32:
		return float64(typedValue), true
	case float64:
		return typedValue, true
	case string:
		if typedValue == "" {
			return 0, false
		}

		if numericValue, parseError := strconv.ParseFloat(typedValue, 64); parseError == nil {
			return numericValue, true
		}

		if parsedTime, parseError := time.Parse(time.RFC3339Nano, typedValue); parseError == nil {
			return float64(parsedTime.UnixNano()) / 1_000_000_000, true
		}

		if parsedTime, parseError := time.Parse(time.RFC3339, typedValue); parseError == nil {
			return float64(parsedTime.UnixNano()) / 1_000_000_000, true
		}
	}

	return 0, false
}

func resolveElapsedTimeAtRead(rawResult interface{}, parsedElapsedSeconds float64, parsedPlaybackState typedefs.MediaPlaybackState_t) float64 {
	if parsedPlaybackState != typedefs.PlayerState_Playing {
		return parsedElapsedSeconds
	}

	resultMap, ok := rawResult.(map[string]interface{})
	if !ok {
		return parsedElapsedSeconds
	}

	rawLastUpdated, exists := resultMap["elapsed_time_last_updated"]
	if !exists {
		rawLastUpdated, exists = resultMap["elapsedTimeLastUpdated"]
		if !exists {
			return parsedElapsedSeconds
		}
	}

	lastUpdatedUnixSeconds, parsed := parseUnixTimestampSeconds(rawLastUpdated)
	if !parsed {
		return parsedElapsedSeconds
	}

	if lastUpdatedUnixSeconds > 1_000_000_000_000 {
		lastUpdatedUnixSeconds = lastUpdatedUnixSeconds / 1000
	}

	nowUnixSeconds := float64(time.Now().UnixNano()) / 1_000_000_000
	ageSeconds := nowUnixSeconds - lastUpdatedUnixSeconds
	if ageSeconds <= 0 {
		return parsedElapsedSeconds
	}

	// Prevent large jumps from bad clocks or stale payload timestamps.
	ageSeconds = math.Min(ageSeconds, 3)
	return parsedElapsedSeconds + ageSeconds
}

func parseQueueTrackIndex(rawResult interface{}, fallback int) int {
	resultMap, ok := rawResult.(map[string]interface{})
	if !ok {
		return fallback
	}

	rawIndex, exists := resultMap["current_index"]
	if !exists {
		rawIndex, exists = resultMap["currentIndex"]
		if !exists {
			return fallback
		}
	}

	switch value := rawIndex.(type) {
	case int:
		return value
	case int32:
		return int(value)
	case int64:
		return int(value)
	case float32:
		return int(value)
	case float64:
		return int(value)
	case string:
		parsed, err := strconv.Atoi(value)
		if err == nil {
			return parsed
		}
	}

	return fallback
}

type MediaPlayerStatus_t struct {
	State         typedefs.MediaPlaybackState_t `json:"state"`
	ElapsedTime   float64                       `json:"elapsed_time"`
	TotalDuration float64                       `json:"total_duration"`
	ActiveTrack   typedefs.ActiveTrack_t        `json:"active_track"`
}

func (instance *SystemMediaPlayer_t) getMediaPlayerStatus(targetPlayerIdentifier string) (MediaPlayerStatus_t, error) {
	commandArguments := map[string]interface{}{
		"queue_id": targetPlayerIdentifier,
	}
	response, responseError := instance._private.messageRouter.ExecuteRemoteProcedureCall("player_queues/get", commandArguments)
	if responseError != nil {
		return MediaPlayerStatus_t{}, responseError
	}

	rawResult, ok := response["result"]
	if !ok {
		return MediaPlayerStatus_t{}, fmt.Errorf("response did not contain a 'result' field")
	}

	var parsedState RawMediaPlayerStatus_t
	if decodeError := mapstructure.Decode(rawResult, &parsedState); decodeError != nil {
		return MediaPlayerStatus_t{}, fmt.Errorf("failed to decode media player status: %w", decodeError)
	}
	resolvedPlaybackState := parsePlayerState(parsedState.State)
	resolvedElapsedTime := resolveElapsedTimeAtRead(rawResult, parsedState.ElapsedTime, resolvedPlaybackState)
	resolvedTrackIndex := parseQueueTrackIndex(rawResult, parsedState.CurrentIndex)

	return MediaPlayerStatus_t{
		State:         resolvedPlaybackState,
		ElapsedTime:   resolvedElapsedTime,
		TotalDuration: parsedState.CurrentItem.Duration,
		ActiveTrack: typedefs.ActiveTrack_t{
			TrackName:   parsedState.CurrentItem.Name,
			TrackIndex:  resolvedTrackIndex,
			TrackItemId: parsedState.CurrentItem.MediaItem.ItemId,
			AlbumItemId: parsedState.CurrentItem.MediaItem.Album.ItemId,
			Provider:    parsedState.CurrentItem.MediaItem.Provider,
		},
	}, nil
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
