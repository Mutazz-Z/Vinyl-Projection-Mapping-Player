package typedefs

type ProgressData_t struct {
	CurrentDurationInTrack int  `json:"currentDurationInTrack"`
	TotalDurationInTrack   int  `json:"totalDurationInTrack"`
	ReadyForDisplay        bool `json:"readyForDisplay"`
}
