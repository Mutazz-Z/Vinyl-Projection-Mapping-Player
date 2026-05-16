package models

type RegistrationPayload struct {
	UID              string `json:"uid"`
	Artist           string `json:"artist"`
	Album            string `json:"album"`
	Tracks           string `json:"tracks"`
	MediaURI         string `json:"media_uri"`
	InnerRecordColor string `json:"inner_record_color"`
	InnerRecordImage string `json:"inner_record_image"`
	OuterDesignColor string `json:"outer_design_color"`
	OuterDesignImage string `json:"outer_design_image"`
	OverlayArt       string `json:"overlay_art"`
	AlbumCoverArt    string `json:"album_cover_art"`
}
