package core

import (
	"context"
	typedefinitions "vinyl-orchestrator/type_definitions"
)

type Event struct {
	Topic   string
	Payload interface{}
}

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

type DataSourceChangedArgs struct {
	Variable string      `json:"variable"`
	Data     interface{} `json:"data"`
}

type DataSource interface {
	Read(key string, destination interface{}) error
	Write(key string, value interface{}) error
	Publish(topic string, payload interface{})
	Subscribe(topic string) <-chan Event
}

type MediaPlayer interface {
	PlayMedia(mediaUri string) error
	StopMedia() error
	GetState() (string, error)
}

type AlbumLibrary interface {
	SaveAlbumRecord(albumRecord typedefinitions.VinylRecordTagData) error
	RetrieveAlbumByNfcIdentifier(nfcUniqueIdentifier string) (typedefinitions.VinylRecordTagData, error)
	RetrieveAllSavedAlbums() ([]typedefinitions.VinylRecordTagData, error)
	DeleteAlbumRecord(nfcUniqueIdentifier string) error
}

type Plugin interface {
	Name() string
	Init(dataSource DataSource, AlbumLibrary AlbumLibrary) error
	StartPlugin(context context.Context) error
	StopPlugin(context context.Context) error
}
