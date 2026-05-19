package core

import "context"

type Event struct {
	Topic   string
	Payload interface{}
}

type DataSource interface {
	Read(key string, destination interface{}) error
	Write(key string, value interface{}) error
	Publish(topic string, payload interface{})
	Subscribe(topic string) <-chan Event
}

type VinylAlbumRecord struct {
	NfcUniqueIdentifier string
	ArtistName          string
	AlbumTitle          string
	TrackList           string
	MediaResourceUri    string
	InnerRecordColor    string
	InnerRecordImage    string
	OuterDesignColor    string
	OuterDesignImage    string
	OverlayArt          string
	AlbumCoverArt       string
}

type LibraryRepository interface {
	SaveAlbumRecord(albumRecord VinylAlbumRecord) error
	RetrieveAlbumByNfcIdentifier(nfcUniqueIdentifier string) (VinylAlbumRecord, error)
	RetrieveAllSavedAlbums() ([]VinylAlbumRecord, error)
	DeleteAlbumRecord(nfcUniqueIdentifier string) error
}

type MediaPlayer interface {
	PlayMedia(mediaUri string) error
	StopMedia() error
	GetState() (string, error)
}

type Plugin interface {
	Name() string
	Init(dataSource DataSource, libraryRepository LibraryRepository) error
	StartPlugin(context context.Context) error
	StopPlugin(context context.Context) error
}

const (
	VisualEffectPlay    = "play"
	VisualEffectUnknown = "unknown"
	VisualEffectStop    = "stop"
	VisualEffectError   = "error"
)

type VisualEffectPayload struct {
	Effect           string `json:"effect"`
	UniqueIdentifier string `json:"uid,omitempty"`
	RegistrationURL  string `json:"registration_url,omitempty"`
	ArtistName       string `json:"artist,omitempty"`
	AlbumTitle       string `json:"album,omitempty"`
	TrackList        string `json:"tracks,omitempty"`
	MediaResourceUri string `json:"media_uri,omitempty"`
	InnerRecordColor string `json:"inner_record_color,omitempty"`
	InnerRecordImage string `json:"inner_record_image,omitempty"`
	OuterDesignColor string `json:"outer_design_color,omitempty"`
	OuterDesignImage string `json:"outer_design_image,omitempty"`
	OverlayArt       string `json:"overlay_art,omitempty"`
	AlbumCoverArt    string `json:"album_cover_art,omitempty"`
	ErrorMessage     string `json:"message,omitempty"`
}
