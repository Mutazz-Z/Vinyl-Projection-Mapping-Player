package typedefs

type TitleAndArtist_t struct {
	Title           string `json:"title"`
	Artist          string `json:"artist"`
	ReadyForDisplay bool   `json:"readyForDisplay"`
}
