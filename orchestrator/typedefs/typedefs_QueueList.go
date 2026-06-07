package typedefs

type QueueList_t struct {
	Tracks              []TrackListItem_t `json:"tracks"`
	CurrentPlayingIndex int               `json:"currentPlayingIndex"`
}
