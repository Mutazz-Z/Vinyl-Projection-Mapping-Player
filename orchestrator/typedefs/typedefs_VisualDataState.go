package typedefs

type VisualDataState_t uint8

const (
	VisualDataState_DisplayAlbumVisuals VisualDataState_t = iota
	VisualDataState_DisplayErrorMessage
	VisualDataState_DisplayTagRegistration
	VisualDataState_DisplayIdle
)
