package typedefs

type AlbumTrackList_t struct {
	Track      string        `json:"track" mapstructure:"track"`
	Duration   int           `json:"duration" mapstructure:"duration"`
	CoverImage string        `json:"cover_image" mapstructure:"cover_image"`
	Lyrics     TrackLyrics_t `json:"lyrics" mapstructure:"lyrics"`
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
