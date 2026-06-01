/*
 * Retrieves the current queue list of track names for a specific media player in MusicAssistant.
 */

package musicassistant

import (
	"fmt"

	"github.com/mitchellh/mapstructure"
	"vinyl-orchestrator/typedefs"
)

type RawQueueItem_t struct {
	DisplayName string `json:"name" mapstructure:"name"`
	MediaItem   struct {
		Name string `json:"name" mapstructure:"name"`
	} `json:"media_item" mapstructure:"media_item"`
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

	var trackNames []string
	for i := range rawQueueList {
		trackNames = append(trackNames, rawQueueList[i].MediaItem.Name)
	}

	result := typedefs.QueueList_t{
		Tracks: trackNames,
	}

	return result, nil
}
