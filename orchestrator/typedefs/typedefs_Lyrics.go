package typedefs

type LyricLine_t struct {
	TimeStart float64 `json:"time_start"`
	Text      string  `json:"text"`
}

type TrackLyrics_t struct {
	TrackSupportsLyrics bool          `json:"track_supports_lyrics"`
	Lines               []LyricLine_t `json:"lines"`
}

type LyricData_t struct {
	TrackLyrics     TrackLyrics_t `json:"track_lyrics"`
	ReadyForDisplay bool          `json:"readyForDisplay"`
}
