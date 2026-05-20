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
	"music_assistant_url": {
		StorageType:      NonVolatile,
		DefaultDataValue: "",
	},
	"music_assistant_token": {
		StorageType:      NonVolatile,
		DefaultDataValue: "",
	},
	"music_assistant_player_id": {
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

	"mapping_width": {
		StorageType:      NonVolatile,
		DefaultDataValue: "1920",
	},
	"mapping_height": {
		StorageType:      NonVolatile,
		DefaultDataValue: "1080",
	},
	"mapping_tlX": {
		StorageType:      NonVolatile,
		DefaultDataValue: "0",
	},
	"mapping_tlY": {
		StorageType:      NonVolatile,
		DefaultDataValue: "0",
	},
	"mapping_trX": {
		StorageType:      NonVolatile,
		DefaultDataValue: "1920",
	},
	"mapping_trY": {
		StorageType:      NonVolatile,
		DefaultDataValue: "0",
	},
	"mapping_brX": {
		StorageType:      NonVolatile,
		DefaultDataValue: "1920",
	},
	"mapping_brY": {
		StorageType:      NonVolatile,
		DefaultDataValue: "1080",
	},
	"mapping_blX": {
		StorageType:      NonVolatile,
		DefaultDataValue: "0",
	},
	"mapping_blY": {
		StorageType:      NonVolatile,
		DefaultDataValue: "1080",
	},

	"mapping_preset_tlX": {
		StorageType:      NonVolatile,
		DefaultDataValue: "",
	},
	"mapping_preset_tlY": {
		StorageType:      NonVolatile,
		DefaultDataValue: "",
	},
	"mapping_preset_trX": {
		StorageType:      NonVolatile,
		DefaultDataValue: "",
	},
	"mapping_preset_trY": {
		StorageType:      NonVolatile,
		DefaultDataValue: "",
	},
	"mapping_preset_brX": {
		StorageType:      NonVolatile,
		DefaultDataValue: "",
	},
	"mapping_preset_brY": {
		StorageType:      NonVolatile,
		DefaultDataValue: "",
	},
	"mapping_preset_blX": {
		StorageType:      NonVolatile,
		DefaultDataValue: "",
	},
	"mapping_preset_blY": {
		StorageType:      NonVolatile,
		DefaultDataValue: "",
	},
}
