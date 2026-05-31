package typedefs

type AlbumsInLibrary_t struct {
	ItemId     string `json:"item_id" mapstructure:"item_id"`
	Provider   string `json:"provider" mapstructure:"provider"`
	MediaTitle string `json:"media_title" mapstructure:"media_title"`
	Artist     string `json:"artist" mapstructure:"artist"`
	CoverImage string `json:"cover_image" mapstructure:"cover_image"`
}

type AvailableMediaPlayers_t struct {
	PlayerID    string `json:"player_id" mapstructure:"player_id"`
	DisplayName string `json:"display_name" mapstructure:"display_name"`
}

type VisualDataState_t uint8

const (
	VisualDataState_DisplayAlbumVisuals VisualDataState_t = iota
	VisualDataState_DisplayErrorMessage
	VisualDataState_DisplayTagRegistration
	VisualDataState_DisplayIdle
)

// typeshare
type ReaderStatus_t bool

const (
	ReaderStatus_Offline ReaderStatus_t = false
	ReaderStatus_Online  ReaderStatus_t = true
)

// typeshare
type ShelfStatus_t bool

const (
	ShelfStatus_Empty    ShelfStatus_t = false
	ShelfStatus_Occupied ShelfStatus_t = true
)

// typeshare
type MediaPlaybackState_t uint8

const (
	PlayerState_Playing MediaPlaybackState_t = iota
	PlayerState_Paused
	PlayerState_Idle
	PlayerState_Buffering
	PlayerState_Unknown
	PlayerState_Stopped
	PlayerState_Error
	PlayerState_Offline
)

type AlbumTrackList_t struct {
	Track      string `json:"track" mapstructure:"track"`
	Duration   int    `json:"duration" mapstructure:"duration"`
	CoverImage string `json:"cover_image" mapstructure:"cover_image"`
}

type VinylRecordTagData_t struct {
	TagUid            string             `json:"tag_uid" gorm:"primaryKey;column:tag_uid"`
	ItemId            string             `json:"item_id" gorm:"column:item_id"`
	Provider          string             `json:"provider" gorm:"column:provider"`
	MediaTitle        string             `json:"media_title" gorm:"column:media_title"`
	Artist            string             `json:"artist" gorm:"column:artist"`
	TrackList         []AlbumTrackList_t `json:"track_list" gorm:"column:tracks;serializer:json"`
	CoverImage        string             `json:"cover_image" gorm:"column:cover_image"`
	LabelColor        string             `json:"label_color" gorm:"column:label_color"`
	LabelImage        string             `json:"label_image" gorm:"column:label_image"`
	OuterRingColor    string             `json:"outer_ring_color" gorm:"column:outer_ring_color"`
	OuterRingImage    string             `json:"outer_ring_image" gorm:"column:outer_ring_image"`
	ProjectionOverlay string             `json:"projection_overlay" gorm:"column:projection_overlay"`
}

// typeshare
type ProjectorData_t struct {
	TagData         VinylRecordTagData_t `json:"tag_data"`
	VisualDataState VisualDataState_t    `json:"visual_data_state"`
	RegisterTagUrl  string               `json:"register_tag_url"`
	ErrorMessage    string               `json:"error_message"`
}
