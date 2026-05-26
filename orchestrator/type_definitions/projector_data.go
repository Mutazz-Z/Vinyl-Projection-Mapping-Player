/*
 * Data sent to the projector
 */

package typedefinitions

const (
	PlayerState_Playing = "playing"
	PlayerState_Unknown = "unknown"
	PlayerState_Stopped = "stopped"
	PlayerState_Error   = "error"
)

type ProjectorData struct {
	TagData        VinylRecordTagData `json:"tag_data"`
	PlayerState    string             `json:"player_state"`
	RegisterTagUrl string             `json:"register_tag_url"`
	ErrorMessage   string             `json:"error_message"`
}
