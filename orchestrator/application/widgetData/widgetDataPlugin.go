package widgetdata

import (
	"vinyl-orchestrator/application/database"
)

type WidgetDataPlugin struct {
	_private struct {
		systemDataSource database.DataSource
		albumLibrary     database.AlbumLibrary
	}
}

func (instance *WidgetDataPlugin) Init(dataSource database.DataSource, albumLibrary database.AlbumLibrary) {
	instance._private.systemDataSource = dataSource
	instance._private.albumLibrary = albumLibrary

	titleAndArtistWidget := &TitleAndArtist_t{}
	widgetPlaybackSequencer := &WidgetPlaybackSequencer_t{}
	recordAndOverlayArtWidget := &RecordAndOverlayArt{}
	trackListWidgetDataUpdater := &TrackListWidgetDataUpdater{}

	recordAndOverlayArtWidget.Init(instance._private.systemDataSource, instance._private.albumLibrary)
	titleAndArtistWidget.Init(instance._private.systemDataSource, instance._private.albumLibrary)
	trackListWidgetDataUpdater.Init(instance._private.systemDataSource)
	widgetPlaybackSequencer.Init(instance._private.systemDataSource, instance._private.albumLibrary)
}
