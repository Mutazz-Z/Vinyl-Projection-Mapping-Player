/*
 * Data associated and saved to NFC tag.
 */

package typedefinitions

type VinylRecordTagData struct {
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
