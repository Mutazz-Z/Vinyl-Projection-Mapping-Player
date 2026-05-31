/*
 * Looks up all tracks in a specific album in the MusicAssistant library and returns their details.
 */

package musicassistant

import (
	"fmt"
	"vinyl-orchestrator/typedefs"

	"github.com/mitchellh/mapstructure"
)

type RawAlbumTrackList_t struct {
	Track    string `json:"name" mapstructure:"name"`
	Duration int    `json:"duration" mapstructure:"duration"`
	Metadata struct {
		Images []struct {
			Path string `json:"path"`
		} `json:"images"`
	} `json:"metadata"`
}

func (plugin *MusicAssistantPlugin) getAlbumTrackList(itemId string, provider string) ([]typedefs.AlbumTrackList_t, error) {

	response, err := plugin.messageRouter.ExecuteRemoteProcedureCall("music/albums/album_tracks", map[string]interface{}{
		"item_id":                        itemId,
		"provider_instance_id_or_domain": provider,
	})
	if err != nil {
		return nil, err
	}

	rawResult, ok := response["result"]
	if !ok {
		return nil, fmt.Errorf("response did not contain a 'result' field")
	}

	var albumTrackList []RawAlbumTrackList_t

	err = mapstructure.Decode(rawResult, &albumTrackList)
	if err != nil {
		return nil, fmt.Errorf("failed to decode albums: %w", err)
	}

	var result []typedefs.AlbumTrackList_t
	for i := range albumTrackList {
		track := typedefs.AlbumTrackList_t{
			Track:    albumTrackList[i].Track,
			Duration: albumTrackList[i].Duration,
		}
		if len(albumTrackList[i].Metadata.Images) > 0 {
			track.CoverImage = albumTrackList[i].Metadata.Images[0].Path
		}
		result = append(result, track)
	}

	return result, nil
}
