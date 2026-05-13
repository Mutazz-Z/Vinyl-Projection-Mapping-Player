package models

type RegistrationPayload struct {
	UID      string `json:"uid"`
	Artist   string `json:"artist"`
	Album    string `json:"album"`
	Tracks   string `json:"tracks"`
	MediaURI string `json:"media_uri"`
}