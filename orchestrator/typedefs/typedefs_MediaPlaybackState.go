package typedefs

type MediaPlaybackState_t uint8

const (
	PlayerState_Playing MediaPlaybackState_t = iota
	PlayerState_Paused
	PlayerState_Idle
	PlayerState_Buffering
	PlayerState_Unknown
	PlayerState_Stopped
	PlayerState_Error
	PlayerState_Offline
)