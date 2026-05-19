package core

type StorageMechanism int

const (
	NonVolatile StorageMechanism = iota
	Volatile
)

type SystemVariableDefinition struct {
	StorageType      StorageMechanism
	DefaultDataValue interface{}
}

var SystemRegistry = map[string]SystemVariableDefinition{
	"home_assistant_url": {
		StorageType:      NonVolatile,
		DefaultDataValue: "",
	},
	"home_assistant_token": {
		StorageType:      NonVolatile,
		DefaultDataValue: "",
	},
	"home_assistant_player_entity_id": {
		StorageType:      NonVolatile,
		DefaultDataValue: "",
	},
	"home_assistant_api_path": {
		StorageType:      NonVolatile,
		DefaultDataValue: "",
	},
	"mqtt_broker_host_address": {
		StorageType:      NonVolatile,
		DefaultDataValue: "127.0.0.1",
	},
	"mqtt_websocket_port": {
		StorageType:      NonVolatile,
		DefaultDataValue: 9001,
	},
	"mqtt_tcp_port": {
		StorageType:      NonVolatile,
		DefaultDataValue: 1883,
	},

	"active_record_unique_identifier": {
		StorageType:      Volatile,
		DefaultDataValue: "",
	},
	"active_track_name": {
		StorageType:      Volatile,
		DefaultDataValue: "Unknown",
	},
	"active_playback_state": {
		StorageType:      Volatile,
		DefaultDataValue: "idle",
	},
	"active_track_progress_seconds": {
		StorageType:      Volatile,
		DefaultDataValue: 0,
	},
	"active_track_duration_seconds": {
		StorageType:      Volatile,
		DefaultDataValue: 0,
	},
	"physical_shelf_status": {
		StorageType:      Volatile,
		DefaultDataValue: "removed",
	},
}
