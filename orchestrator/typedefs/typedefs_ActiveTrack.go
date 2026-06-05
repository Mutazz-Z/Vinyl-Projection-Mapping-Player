package typedefs

type ActiveTrack_t struct {
	TrackName   string `json:"track_name"`
	TrackIndex  int    `json:"track_index"`
	Provider    string `json:"provider"`
	TrackItemId string `json:"track_item_id"`
	AlbumItemId string `json:"album_item_id"`
}
