package widgetdata

import (
	"vinyl-orchestrator/application/database"
	"vinyl-orchestrator/application/musicassistant"
)

type WidgetDataPlugin struct {
	_private struct {
		systemDataSource database.DataSource
		albumLibrary     database.AlbumLibrary
		queueProvider    musicassistant.QueueListProvider
		statusProvider   musicassistant.MediaPlayerStatusProvider
	}
}

func (instance *WidgetDataPlugin) Init(dataSource database.DataSource, albumLibrary database.AlbumLibrary, queueProvider musicassistant.QueueListProvider, statusProvider musicassistant.MediaPlayerStatusProvider) {
	instance._private.systemDataSource = dataSource
	instance._private.albumLibrary = albumLibrary
	instance._private.queueProvider = queueProvider
	instance._private.statusProvider = statusProvider

	titleAndArtistWidget := &TitleAndArtist_t{}
	widgetPlaybackSequencer := &WidgetPlaybackSequencer_t{}
	recordAndOverlayArtWidget := &RecordAndOverlayArt{}
	trackListWidgetDataUpdater := &TrackListWidgetDataUpdater{}
	progressWidget := &Progress_t{}

	progressWidget.Init(instance._private.systemDataSource, instance._private.statusProvider)
	recordAndOverlayArtWidget.Init(instance._private.systemDataSource, instance._private.albumLibrary)
	titleAndArtistWidget.Init(instance._private.systemDataSource, instance._private.albumLibrary)
	trackListWidgetDataUpdater.Init(instance._private.systemDataSource, instance._private.queueProvider)
	widgetPlaybackSequencer.Init(instance._private.systemDataSource, instance._private.albumLibrary)
}
