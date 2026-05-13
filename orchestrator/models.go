package main

type TagPayload struct {
	UID    string `json:"uid"`
	Source string `json:"source"`
}

type RegistrationPayload struct {
	UID      string `json:"uid"`
	Artist   string `json:"artist"`
	Album    string `json:"album"`
	Tracks   string `json:"tracks"`
	MediaURI string `json:"media_uri"`
}

type LibraryResponse struct {
	Albums []RegistrationPayload `json:"albums"`
}