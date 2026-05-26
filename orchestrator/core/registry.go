package core

type DataType int

const (
	TypeString DataType = iota
	TypeInt
	TypeBool
	TypeFloat
	TypeJSON
)

func (dataType DataType) String() string {
	switch dataType {
	case TypeString:
		return "string"
	case TypeInt:
		return "int"
	case TypeBool:
		return "bool"
	case TypeFloat:
		return "float"
	case TypeJSON:
		return "json"
	default:
		return "unknown"
	}
}

type StorageMechanism int

const (
	NonVolatile StorageMechanism = iota
	Volatile
)

type SystemVariableDefinition struct {
	StorageType      StorageMechanism
	DataType         DataType
	DefaultDataValue interface{}
}

var SystemRegistry = map[string]SystemVariableDefinition{
	// ── Music Assistant credentials & config ─────────────────────────────────
	"GLOBAL_MusicAssistantUrl":            {StorageType: NonVolatile, DataType: TypeString, DefaultDataValue: ""},
	"GLOBAL_MusicAssistantToken":          {StorageType: NonVolatile, DataType: TypeString, DefaultDataValue: ""},
	"GLOBAL_MusicAssistantTargetPlayerId": {StorageType: NonVolatile, DataType: TypeString, DefaultDataValue: ""},

	// ── Web / network ────────────────────────────────────────────────────────
	"GLOBAL_FlutterWebUrl":  {StorageType: NonVolatile, DataType: TypeString, DefaultDataValue: "localhost"},
	"GLOBAL_FlutterWebPort": {StorageType: NonVolatile, DataType: TypeString, DefaultDataValue: "8080"},

	// ── MQTT ────────────────────────────────────────────────────────────────
	"GLOBAL_MqttBrokerHostAddress": {StorageType: NonVolatile, DataType: TypeString, DefaultDataValue: "127.0.0.1"},
	"GLOBAL_MqttWebSocketPort":     {StorageType: NonVolatile, DataType: TypeInt, DefaultDataValue: 9001},
	"GLOBAL_MqttTcpPort":           {StorageType: NonVolatile, DataType: TypeInt, DefaultDataValue: 1883},

	// ── NFC reader ───────────────────────────────────────────────────────────
	"GLOBAL_LastScannedNfcTag":      {StorageType: Volatile, DataType: TypeString, DefaultDataValue: ""},
	"GLOBAL_ReaderConnectionStatus": {StorageType: Volatile, DataType: TypeString, DefaultDataValue: "offline"},
	"GLOBAL_LastUnknownNfcTag":      {StorageType: Volatile, DataType: TypeString, DefaultDataValue: ""},

	// ── Projector ────────────────────────────────────────────────────────────
	"GLOBAL_CurrentProjectorData":               {StorageType: Volatile, DataType: TypeJSON, DefaultDataValue: nil},
	"GLOBAL_ProjectorHeartbeatSignal":           {StorageType: Volatile, DataType: TypeJSON, DefaultDataValue: nil},
	"GLOBAL_ProjectorHeartbeat":                 {StorageType: Volatile, DataType: TypeJSON, DefaultDataValue: nil},
	"GLOBAL_TargetDisplayWidthInPixels":         {StorageType: NonVolatile, DataType: TypeString, DefaultDataValue: "1920"},
	"GLOBAL_TargetDisplayHeightInPixels":        {StorageType: NonVolatile, DataType: TypeString, DefaultDataValue: "1080"},
	"GLOBAL_CurrentMaptasticProjectorPositions": {StorageType: NonVolatile, DataType: TypeString, DefaultDataValue: ""},
	"GLOBAL_SavedMaptasticProjectorPositions":   {StorageType: NonVolatile, DataType: TypeString, DefaultDataValue: ""},

	// ── Active record shelf ──────────────────────────────────────────────────
	"GLOBAL_ActiveRecordUid":    {StorageType: Volatile, DataType: TypeString, DefaultDataValue: ""},
	"GLOBAL_CurrentShelfStatus": {StorageType: Volatile, DataType: TypeString, DefaultDataValue: "empty"},
	"GLOBAL_CurrentAlbumState":  {StorageType: Volatile, DataType: TypeJSON, DefaultDataValue: nil},

	"GLOBAL_ActiveRecordPlaybackState":         {StorageType: Volatile, DataType: TypeString, DefaultDataValue: "idle"},
	"GLOBAL_ActiveRecordTrackName":             {StorageType: Volatile, DataType: TypeString, DefaultDataValue: "Unknown"},
	"GLOBAL_ActiveTrackProgressInSeconds":      {StorageType: Volatile, DataType: TypeFloat, DefaultDataValue: 0.0},
	"GLOBAL_ActiveTrackTotalDurationInSeconds": {StorageType: Volatile, DataType: TypeFloat, DefaultDataValue: 0.0},
}
