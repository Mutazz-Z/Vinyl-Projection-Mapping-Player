package typedefs

type AlbumsInLibrary_t struct {
	ItemId     string `json:"item_id" mapstructure:"item_id"`
	Provider   string `json:"provider" mapstructure:"provider"`
	MediaTitle string `json:"media_title" mapstructure:"media_title"`
	Artist     string `json:"artist" mapstructure:"artist"`
	CoverImage string `json:"cover_image" mapstructure:"cover_image"`
}
