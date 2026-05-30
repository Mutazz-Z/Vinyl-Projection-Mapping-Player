/*
 * Looks up all tracks in a specific album in the MusicAssistant library and returns their details.
 */

package musicassistant

import (
	"fmt"

	"github.com/mitchellh/mapstructure"
)

type RawAlbumTrackList struct {
	Track    string `json:"name" mapstructure:"name"`
	Duration int    `json:"duration" mapstructure:"duration"`
	Metadata struct {
		Images []struct {
			Path string `json:"path"`
		} `json:"images"`
	} `json:"metadata"`
}

type AlbumTrackList struct {
	Track      string `json:"track" mapstructure:"track"`
	Duration   int    `json:"duration" mapstructure:"duration"`
	CoverImage string `json:"cover_image" mapstructure:"cover_image"`
}

func (plugin *MusicAssistantPlugin) getAlbumTrackList(itemId string, provider string) ([]AlbumTrackList, error) {

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

	var albumTrackList []RawAlbumTrackList

	err = mapstructure.Decode(rawResult, &albumTrackList)
	if err != nil {
		return nil, fmt.Errorf("failed to decode albums: %w", err)
	}

	var result []AlbumTrackList
	for i := range albumTrackList {
		track := AlbumTrackList{
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
