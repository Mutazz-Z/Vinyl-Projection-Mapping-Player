package core

// typeshare
type ReaderStatus_t bool

const (
	EspReaderStatus_Offline ReaderStatus_t = false
	EspReaderStatus_Online  ReaderStatus_t = true
)

// typeshare
type ShelfStatus_t bool

const (
	ShelfStatus_Empty    ShelfStatus_t = false
	ShelfStatus_Occupied ShelfStatus_t = true
)

// typeshare
type PlayerState_t uint8

const (
	PlayerState_Playing PlayerState_t = iota // 0
	PlayerState_Unknown                      // 1
	PlayerState_Stopped                      // 2
	PlayerState_Error                        // 3
)

// typeshare
type VinylRecordTagData_t struct {
	TagUid            string                   `json:"tag_uid" gorm:"primaryKey;column:tag_uid"`
	ItemId            string                   `json:"item_id" gorm:"column:item_id"`
	Provider          string                   `json:"provider" gorm:"column:provider"`
	MediaTitle        string                   `json:"media_title" gorm:"column:media_title"`
	Artist            string                   `json:"artist" gorm:"column:artist"`
	TrackList         []map[string]interface{} `json:"track_list" gorm:"column:tracks;serializer:json"`
	CoverImage        string                   `json:"cover_image" gorm:"column:cover_image"`
	LabelColor        string                   `json:"label_color" gorm:"column:label_color"`
	LabelImage        string                   `json:"label_image" gorm:"column:label_image"`
	OuterRingColor    string                   `json:"outer_ring_color" gorm:"column:outer_ring_color"`
	OuterRingImage    string                   `json:"outer_ring_image" gorm:"column:outer_ring_image"`
	ProjectionOverlay string                   `json:"projection_overlay" gorm:"column:projection_overlay"`
}

// typeshare
type ProjectorData_t struct {
	TagData        VinylRecordTagData_t `json:"tag_data"`
	PlayerState    PlayerState_t        `json:"player_state"`
	RegisterTagUrl string               `json:"register_tag_url"`
	ErrorMessage   string               `json:"error_message"`
}
