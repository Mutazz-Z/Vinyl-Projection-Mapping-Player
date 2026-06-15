/*
 * Looks up all albums in the MusicAssistant library and returns their title and item ID.
 */

package musicassistant

import (
	"fmt"
	"vinyl-orchestrator/typedefs"

	"github.com/mitchellh/mapstructure"
)

type RawAlbumsInLibrary_t struct {
	ItemId     string `json:"item_id" mapstructure:"item_id"`
	Provider   string `json:"provider" mapstructure:"provider"`
	MediaTitle string `json:"name" mapstructure:"name"`

	Artists []struct {
		Name string `json:"name" mapstructure:"name"`
	} `json:"artists" mapstructure:"artists"`

	Metadata struct {
		Images []struct {
			Path string `json:"path" mapstructure:"path"`
		} `json:"images" mapstructure:"images"`
	} `json:"metadata" mapstructure:"metadata"`
}

func (plugin *MusicAssistantPlugin) getAllAlbumsFromMusicAssistantLibrary() ([]typedefs.AlbumsInLibrary_t, error) {
	response, err := plugin.messageRouter.ExecuteRemoteProcedureCall("music/albums/library_items", map[string]interface{}{})
	if err != nil {
		return nil, err
	}

	rawResult, ok := response["result"]
	if !ok {
		return nil, fmt.Errorf("response did not contain a 'result' field")
	}

	var rawAlbums []RawAlbumsInLibrary_t

	err = mapstructure.Decode(rawResult, &rawAlbums)
	if err != nil {
		return nil, fmt.Errorf("failed to decode albums: %w", err)
	}

	var albums []typedefs.AlbumsInLibrary_t
	for _, rawAlbum := range rawAlbums {
		album := typedefs.AlbumsInLibrary_t{
			ItemId:     rawAlbum.ItemId,
			Provider:   rawAlbum.Provider,
			MediaTitle: rawAlbum.MediaTitle,
		}
		if len(rawAlbum.Artists) > 0 {
			album.Artist = rawAlbum.Artists[0].Name
		}
		if len(rawAlbum.Metadata.Images) > 0 {
			album.CoverImage = rawAlbum.Metadata.Images[0].Path
		}
		albums = append(albums, album)
	}

	return albums, nil
}
