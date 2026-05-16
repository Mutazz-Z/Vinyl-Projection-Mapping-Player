package models

// VisualEffect represents the type of visual animation or state to display on the projector.
type VisualEffect string

const (
	VisualEffectUnknown VisualEffect = "unknown"
	VisualEffectPlay    VisualEffect = "play"
	VisualEffectStop    VisualEffect = "stop"
)

// String returns the native string representation of the VisualEffect.
func (visualEffect VisualEffect) String() string {
	return string(visualEffect)
}

// PlaybackState represents the current operational state of the media player.
type PlaybackState string

const (
	PlaybackStatePlaying PlaybackState = "playing"
	PlaybackStatePaused  PlaybackState = "paused"
	PlaybackStateStopped PlaybackState = "stopped"
)

// String returns the native string representation of the PlaybackState.
func (playbackState PlaybackState) String() string {
	return string(playbackState)
}

// SkipEvent represents track navigation and seeking timeline events.
type SkipEvent string

const (
	SkipEventForward  SkipEvent = "skip_forward"
	SkipEventBackward SkipEvent = "skip_backward"
	SkipEventSeek     SkipEvent = "seek"
)

// String returns the native string representation of the SkipEvent.
func (skipEvent SkipEvent) String() string {
	return string(skipEvent)
}

// MusicAssistantServiceDomain represents valid Home Assistant / Music Assistant service domains.
type MusicAssistantServiceDomain string

const (
	DomainMusicAssistant MusicAssistantServiceDomain = "music_assistant"
	DomainMass           MusicAssistantServiceDomain = "mass"
	DomainMediaPlayer    MusicAssistantServiceDomain = "media_player"
)

// String returns the native string representation of the MusicAssistantServiceDomain.
func (serviceDomain MusicAssistantServiceDomain) String() string {
	return string(serviceDomain)
}

// MusicAssistantServiceAction represents valid execution commands for the media subsystem.
type MusicAssistantServiceAction string

const (
	ActionPlayMedia          MusicAssistantServiceAction = "play_media"
	ActionMediaPlayPause     MusicAssistantServiceAction = "media_play_pause"
	ActionMediaNextTrack     MusicAssistantServiceAction = "media_next_track"
	ActionMediaPreviousTrack MusicAssistantServiceAction = "media_previous_track"
	ActionMediaStop          MusicAssistantServiceAction = "media_stop"
)

// String returns the native string representation of the MusicAssistantServiceAction.
func (serviceAction MusicAssistantServiceAction) String() string {
	return string(serviceAction)
}

// ============================================================================
// Network Communication Payloads
// ============================================================================

// PlaybackEventPayload represents incoming state updates streaming from your media player.
type PlaybackEventPayload struct {
	Event      string `json:"event"`
	TrackIndex int    `json:"track_index"`
	TrackName  string `json:"track_name"`
	Position   int    `json:"position"`
	Duration   int    `json:"duration"`
}

// VisualEffectPayload defines the structured format transmitted to your projector display system.
// Thanks to 'omitempty', this single struct cleanly handles 'play', 'stop', and 'unknown' event shapes.
type VisualEffectPayload struct {
	Effect           VisualEffect `json:"effect"`
	UID              string       `json:"uid,omitempty"`
	Artist           string       `json:"artist,omitempty"`
	Album            string       `json:"album,omitempty"`
	Tracks           string       `json:"tracks,omitempty"`
	MediaURI         string       `json:"media_uri,omitempty"`
	InnerRecordColor string       `json:"inner_record_color,omitempty"`
	InnerRecordImage string       `json:"inner_record_image,omitempty"`
	OuterDesignColor string       `json:"outer_design_color,omitempty"`
	OuterDesignImage string       `json:"outer_design_image,omitempty"`
	OverlayArt       string       `json:"overlay_art,omitempty"`
	AlbumCoverArt    string       `json:"album_cover_art,omitempty"`
	RegistrationURL  string       `json:"registration_url,omitempty"`
}
