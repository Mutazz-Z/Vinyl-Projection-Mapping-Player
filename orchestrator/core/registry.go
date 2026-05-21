package core

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
	"GLOBAL_MusicAssistantUrl":                  {StorageType: NonVolatile, DataType: TypeString, DefaultDataValue: ""},
	"GLOBAL_MusicAssistantToken":                {StorageType: NonVolatile, DataType: TypeString, DefaultDataValue: ""},
	"GLOBAL_MusicAssistantTargetPlayerId":       {StorageType: NonVolatile, DataType: TypeString, DefaultDataValue: ""},
	"GLOBAL_FlutterWebUrl":                      {StorageType: NonVolatile, DataType: TypeString, DefaultDataValue: "localhost"},
	"GLOBAL_FlutterWebPort":                     {StorageType: NonVolatile, DataType: TypeString, DefaultDataValue: "8080"},
	"GLOBAL_LastScannedNfcTag":                  {StorageType: Volatile, DataType: TypeString, DefaultDataValue: ""},
	"GLOBAL_LastUnknownNfcTag":                  {StorageType: Volatile, DataType: TypeString, DefaultDataValue: ""},
	"GLOBAL_CurrentProjectorData":               {StorageType: Volatile, DataType: TypeJSON, DefaultDataValue: nil},
	"GLOBAL_MqttBrokerHostAddress":              {StorageType: NonVolatile, DataType: TypeString, DefaultDataValue: "127.0.0.1"},
	"GLOBAL_MqttWebSocketPort":                  {StorageType: NonVolatile, DataType: TypeInt, DefaultDataValue: 9001},
	"GLOBAL_MqttTcpPort":                        {StorageType: NonVolatile, DataType: TypeInt, DefaultDataValue: 1883},
	"GLOBAL_ActiveRecordUid":                    {StorageType: Volatile, DataType: TypeString, DefaultDataValue: ""},
	"GLOBAL_ActiveRecordTrackName":              {StorageType: Volatile, DataType: TypeString, DefaultDataValue: "Unknown"},
	"GLOBAL_ActiveRecordPlaybackState":          {StorageType: Volatile, DataType: TypeString, DefaultDataValue: "idle"},
	"GLOBAL_ActiveTrackProgressInSeconds":       {StorageType: Volatile, DataType: TypeFloat, DefaultDataValue: 0.0},
	"GLOBAL_ActiveTrackTotalDurationInSeconds":  {StorageType: Volatile, DataType: TypeFloat, DefaultDataValue: 0.0},
	"GLOBAL_CurrentShelfStatus":                 {StorageType: Volatile, DataType: TypeString, DefaultDataValue: "empty"},
	"GLOBAL_TargetDisplayWidthInPixels":         {StorageType: NonVolatile, DataType: TypeString, DefaultDataValue: "1920"},
	"GLOBAL_TargetDisplayHeightInPixels":        {StorageType: NonVolatile, DataType: TypeString, DefaultDataValue: "1080"},
	"GLOBAL_ProjectorHeartbeatSignal":           {StorageType: Volatile, DataType: TypeJSON, DefaultDataValue: nil},
	"GLOBAL_ProjectorHeartbeat":                 {StorageType: Volatile, DataType: TypeJSON, DefaultDataValue: nil},
	"GLOBAL_CurrentMaptasticProjectorPositions": {StorageType: NonVolatile, DataType: TypeString, DefaultDataValue: ""},
	"GLOBAL_SavedMaptasticProjectorPositions":   {StorageType: NonVolatile, DataType: TypeString, DefaultDataValue: ""},
}
