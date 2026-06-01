package typedefs

type LyricLine_t struct {
	TimeStart float64 `json:"time_start"`
	Text      string  `json:"text"`
}

type TrackLyrics_t struct {
	Lines []LyricLine_t `json:"lines"`
}
