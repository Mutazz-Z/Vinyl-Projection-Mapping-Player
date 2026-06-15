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
	Track     string `json:"name" mapstructure:"name"`
	Duration  int    `json:"duration" mapstructure:"duration"`
	ItemID    string `json:"item_id" mapstructure:"item_id"`
	Provider  string `json:"provider" mapstructure:"provider"`
	MediaItem struct {
		ItemID   string `json:"item_id" mapstructure:"item_id"`
		Provider string `json:"provider" mapstructure:"provider"`
	} `json:"media_item" mapstructure:"media_item"`
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
		resolvedItemID := albumTrackList[i].ItemID
		if resolvedItemID == "" {
			resolvedItemID = albumTrackList[i].MediaItem.ItemID
		}

		resolvedProvider := albumTrackList[i].Provider
		if resolvedProvider == "" {
			resolvedProvider = albumTrackList[i].MediaItem.Provider
		}
		if resolvedProvider == "" {
			resolvedProvider = provider
		}

		lyrics, lyricsError := plugin.GetTrackLyrics(resolvedItemID, resolvedProvider)
		if lyricsError != nil {
			lyrics = typedefs.TrackLyrics_t{}
		}

		track := typedefs.AlbumTrackList_t{
			Track:    albumTrackList[i].Track,
			Duration: albumTrackList[i].Duration,
			Lyrics:   lyrics,
		}
		if len(albumTrackList[i].Metadata.Images) > 0 {
			track.CoverImage = albumTrackList[i].Metadata.Images[0].Path
		}
		result = append(result, track)
	}

	return result, nil
}
