package typedefs

type ProjectorHeartbeatSignal_t struct {
	Action    string `json:"action"`
	TargetId  string `json:"targetId,omitempty"`
	Data      string `json:"data,omitempty"`
	Timestamp int64  `json:"timestamp,omitempty"`
}

type ProjectorHeartbeat_t struct {
	Id        string  `json:"id"`
	Width     float64 `json:"width"`
	Height    float64 `json:"height"`
	Timestamp int64   `json:"timestamp"`
}

type MaptasticProjectorPositions_t struct {
	LayoutJson string `json:"layoutJson"`
}
