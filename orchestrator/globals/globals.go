package globals

import (
	"database/sql"
	"time"

	"vinyl-orchestrator/models"
	mqtt "github.com/eclipse/paho.mqtt.golang"
)

var (
	Database                *sql.DB
	MQTTClient              mqtt.Client
	RecordRemovedTimer      *time.Timer
	CurrentPlayingUID       string
	
	// Playback state tracking
	CurrentTrackIndex      int
	CurrentTrackName       string
	PlaybackPositionInMsec int
	PlaybackDurationInMsec int
	PlaybackState          models.PlaybackState
	LastSkipEvent          models.SkipEvent
	LastSkipEventTime      time.Time
)

const (
	RecordRemovedTimeout   = 3 * time.Second
)
