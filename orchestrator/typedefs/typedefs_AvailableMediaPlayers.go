package typedefs

type AvailableMediaPlayers_t struct {
	PlayerID    string `json:"player_id" mapstructure:"player_id"`
	DisplayName string `json:"display_name" mapstructure:"display_name"`
}
