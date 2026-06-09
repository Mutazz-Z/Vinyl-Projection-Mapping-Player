package typedefs

type ProgressData_t struct {
	CurrentDurationInTrack float64 `json:"currentDurationInTrack"`
	TotalDurationInTrack   float64 `json:"totalDurationInTrack"`
	ReadyForDisplay        bool    `json:"readyForDisplay"`
}
