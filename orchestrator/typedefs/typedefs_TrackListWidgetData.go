package typedefs

type TrackListItem_t struct {
	TrackIndex int    `json:"trackIndex"`
	Track      string `json:"track"`
}

type TrackListWidgetData_t struct {
	Tracks              []TrackListItem_t `json:"tracks"`
	CurrentPlayingIndex int               `json:"currentPlayingIndex"`
	ReadyForDisplay     bool              `json:"readyForDisplay"`
}
