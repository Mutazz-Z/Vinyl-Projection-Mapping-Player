/*
 * Retrieves the current queue list of track names for a specific media player in MusicAssistant.
 */

package musicassistant

import (
	"fmt"
	"strconv"

	"vinyl-orchestrator/typedefs"

	"github.com/mitchellh/mapstructure"
)

type RawQueueItem_t struct {
	Index       int    `json:"index" mapstructure:"index"`
	DisplayName string `json:"name" mapstructure:"name"`
	MediaItem   struct {
		Name string `json:"name" mapstructure:"name"`
	} `json:"media_item" mapstructure:"media_item"`
}

func parseQueueCurrentPlayingIndex(fallback int, payloads ...interface{}) int {
	for _, payload := range payloads {
		resultMap, ok := payload.(map[string]interface{})
		if !ok {
			continue
		}

		rawIndex, exists := resultMap["current_index"]
		if !exists {
			rawIndex, exists = resultMap["currentIndex"]
			if !exists {
				continue
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
	}

	return fallback
}

func (instance *SystemMediaPlayer_t) getMediaPlayerQueueList(targetPlayerIdentifier string) (typedefs.QueueList_t, error) {

	response, err := instance._private.messageRouter.ExecuteRemoteProcedureCall("player_queues/items", map[string]interface{}{
		"queue_id": targetPlayerIdentifier,
	})
	if err != nil {
		return typedefs.QueueList_t{}, err
	}

	rawResult, ok := response["result"]
	if !ok {
		return typedefs.QueueList_t{}, fmt.Errorf("response did not contain a 'result' field")
	}

	var rawQueueList []RawQueueItem_t

	err = mapstructure.Decode(rawResult, &rawQueueList)
	if err != nil {
		return typedefs.QueueList_t{}, fmt.Errorf("failed to decode queue list: %w", err)
	}

	currentPlayingIndex := parseQueueCurrentPlayingIndex(0, rawResult, response)
	tracks := make([]typedefs.TrackListItem_t, 0, len(rawQueueList))
	for i := range rawQueueList {
		trackIndex := rawQueueList[i].Index
		if trackIndex < 0 {
			trackIndex = i
		}

		tracks = append(tracks, typedefs.TrackListItem_t{
			TrackIndex: trackIndex,
			Track:      rawQueueList[i].MediaItem.Name,
		})
	}

	result := typedefs.QueueList_t{
		Tracks:              tracks,
		CurrentPlayingIndex: currentPlayingIndex,
	}

	return result, nil
}
