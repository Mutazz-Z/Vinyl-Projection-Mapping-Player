package typedefs

type WidgetState_t uint8

const (
	WidgetState_Hide WidgetState_t = iota
	WidgetState_Show
	WidgetState_Pause
	WidgetState_Resume

	WidgetState_Loading
)
