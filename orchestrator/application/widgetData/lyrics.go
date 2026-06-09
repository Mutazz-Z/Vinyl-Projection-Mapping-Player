package widgetdata

import (
	"vinyl-orchestrator/application/database"
	"vinyl-orchestrator/application/musicassistant"
	"vinyl-orchestrator/core"
	"vinyl-orchestrator/typedefs"
	"vinyl-orchestrator/utils"
)

func (instance *Lyrics_t) mediaPlaybackIsActive() bool {
	var currentMediaPlaybackState typedefs.MediaPlaybackState_t
	utils.Read(instance._private.systemDataSource, core.Global_MediaPlaybackState, &currentMediaPlaybackState)

	switch currentMediaPlaybackState {
	case typedefs.PlayerState_Playing, typedefs.PlayerState_Paused, typedefs.PlayerState_Buffering:
		return true
	default:
		return false
	}
}

func (instance *Lyrics_t) clearLyricsWidgetData() {
	clearedLyricsWidgetData := typedefs.LyricData_t{
		TrackLyrics: typedefs.TrackLyrics_t{
			TrackSupportsLyrics: false,
			Lines:               []typedefs.LyricLine_t{},
		},
		ReadyForDisplay: false,
	}

	utils.Write(instance._private.systemDataSource, core.Global_LyricsWidgetData, clearedLyricsWidgetData)
}

func (instance *Lyrics_t) writeLyricsWidgetData(trackLyrics typedefs.TrackLyrics_t) {
	nextLyricsWidgetData := typedefs.LyricData_t{
		TrackLyrics:     trackLyrics,
		ReadyForDisplay: true,
	}
	utils.Write(instance._private.systemDataSource, core.Global_LyricsWidgetData, nextLyricsWidgetData)
}

func (instance *Lyrics_t) updateLyricsWidgetDataForTrack(activeTrack typedefs.ActiveTrack_t) {
	expectedTrackItemID := activeTrack.TrackItemId
	expectedProvider := activeTrack.Provider

	trackLyrics, _ := instance._private.lyricsProvider.GetTrackLyrics(activeTrack.TrackItemId, activeTrack.Provider)

	var latestActiveTrack typedefs.ActiveTrack_t
	utils.Read(instance._private.systemDataSource, core.Global_ActiveTrack, &latestActiveTrack)

	if latestActiveTrack.TrackItemId != expectedTrackItemID || latestActiveTrack.Provider != expectedProvider {
		return
	}

	instance.writeLyricsWidgetData(trackLyrics)
}

func (instance *Lyrics_t) onDataSourceChanged(dataSourceChanged <-chan database.Event) {
	go utils.ListenToDataSourceEvents(dataSourceChanged, func(args core.OnDataSourceChangedArgs_t) {
		switch args.Variable {
		case core.Global_CurrentShelfStatus.Key:
			currentShelfStatus, _ := args.Data.(typedefs.ShelfStatus_t)
			if currentShelfStatus == typedefs.ShelfStatus_Empty {
				instance.clearLyricsWidgetData()
			}

		case core.Global_ActiveTrack.Key:
			activeTrack, _ := args.Data.(typedefs.ActiveTrack_t)
			instance.updateLyricsWidgetDataForTrack(activeTrack)

		}
	})
}

type Lyrics_t struct {
	_private struct {
		systemDataSource database.DataSource
		statusProvider   musicassistant.MediaPlayerStatusProvider
		lyricsProvider   musicassistant.TrackLyricsProvider
	}
}

func (instance *Lyrics_t) Init(dataSource database.DataSource, statusProvider musicassistant.MediaPlayerStatusProvider, lyricsProvider musicassistant.TrackLyricsProvider) {
	instance._private.systemDataSource = dataSource
	instance._private.statusProvider = statusProvider
	instance._private.lyricsProvider = lyricsProvider

	onDataSourceChangedSubscription := instance._private.systemDataSource.Subscribe("datasource")
	go instance.onDataSourceChanged(onDataSourceChangedSubscription)
}
