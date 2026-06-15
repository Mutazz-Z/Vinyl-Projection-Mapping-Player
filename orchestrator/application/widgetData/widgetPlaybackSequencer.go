package widgetdata

import (
	"fmt"
	"time"

	"vinyl-orchestrator/application/database"
	"vinyl-orchestrator/core"
	"vinyl-orchestrator/typedefs"
	"vinyl-orchestrator/utils"
)

func (instance *WidgetPlaybackSequencer_t) targetMediaPlayerIsPlaying() bool {
	var mediaPlayerStatus typedefs.MediaPlaybackState_t
	utils.Read(instance._private.systemDataSource, core.Global_MediaPlaybackState, &mediaPlayerStatus)

	switch mediaPlayerStatus {
	case typedefs.PlayerState_Playing, typedefs.PlayerState_Paused, typedefs.PlayerState_Buffering:
		return true
	}
	return false
}

func (instance *WidgetPlaybackSequencer_t) startProjectorPlayback() {
	utils.Write(instance._private.systemDataSource, core.Global_LoadingWidgetState, typedefs.WidgetState_Hide)

	var lyricsData typedefs.LyricData_t
	utils.Read(instance._private.systemDataSource, core.Global_LyricsWidgetData, &lyricsData)
	instance.syncLyricsAndVisualizerWidgetState(lyricsData)

	utils.Write(instance._private.systemDataSource, core.Global_InfoWidgetState, typedefs.WidgetState_Show)
	utils.Write(instance._private.systemDataSource, core.Global_OverlayWidgetState, typedefs.WidgetState_Show)
	utils.Write(instance._private.systemDataSource, core.Global_RecordWidgetState, typedefs.WidgetState_Show)
	utils.Write(instance._private.systemDataSource, core.Global_TrackListWidgetState, typedefs.WidgetState_Show)
	utils.Write(instance._private.systemDataSource, core.Global_ProgressWidgetState, typedefs.WidgetState_Show)

}

func (instance *WidgetPlaybackSequencer_t) widgetsAreReadyForProjectorPlayback(widgetsStatus []bool) bool {
	for _, status := range widgetsStatus {
		if !status {
			return false
		}
	}
	return true
}

func (instance *WidgetPlaybackSequencer_t) checkIfReadyForProjectorPlayback() {
	var titleAndArtist typedefs.TitleAndArtist_t
	utils.Read(instance._private.systemDataSource, core.Global_InfoWidgetData, &titleAndArtist)

	var recordDesignData typedefs.RecordDesignData_t
	utils.Read(instance._private.systemDataSource, core.Global_RecordWidgetData, &recordDesignData)

	var overlayData typedefs.OverlayData_t
	utils.Read(instance._private.systemDataSource, core.Global_OverlayWidgetData, &overlayData)

	var trackListData typedefs.TrackListWidgetData_t
	utils.Read(instance._private.systemDataSource, core.Global_TrackListWidgetData, &trackListData)

	var progressData typedefs.ProgressData_t
	utils.Read(instance._private.systemDataSource, core.Global_ProgressWidgetData, &progressData)

	var lyricsData typedefs.LyricData_t
	utils.Read(instance._private.systemDataSource, core.Global_LyricsWidgetData, &lyricsData)

	var widgetsStatus = []bool{
		titleAndArtist.ReadyForDisplay,
		recordDesignData.ReadyForDisplay,
		overlayData.ReadyForDisplay,
		trackListData.ReadyForDisplay,
		progressData.ReadyForDisplay,
		lyricsData.ReadyForDisplay}

	fmt.Println("Checking if widgets are ready", widgetsStatus)

	if instance.widgetsAreReadyForProjectorPlayback(widgetsStatus) && instance.targetMediaPlayerIsPlaying() {
		fmt.Println("All widgets are ready for projector playback. Starting playback...")
		utils.StopTimer(&instance._private.timer)

		instance.startProjectorPlayback()
	}
}

func (instance *WidgetPlaybackSequencer_t) stopProjectorPlayback() {
	utils.StopTimer(&instance._private.timer)
	utils.Write(instance._private.systemDataSource, core.Global_InfoWidgetState, typedefs.WidgetState_Hide)
	utils.Write(instance._private.systemDataSource, core.Global_OverlayWidgetState, typedefs.WidgetState_Hide)
	utils.Write(instance._private.systemDataSource, core.Global_RecordWidgetState, typedefs.WidgetState_Hide)
	utils.Write(instance._private.systemDataSource, core.Global_TrackListWidgetState, typedefs.WidgetState_Hide)
	utils.Write(instance._private.systemDataSource, core.Global_ProgressWidgetState, typedefs.WidgetState_Hide)
	utils.Write(instance._private.systemDataSource, core.Global_LyricsWidgetState, typedefs.WidgetState_Hide)
	utils.Write(instance._private.systemDataSource, core.Global_VisualizerWidgetState, typedefs.WidgetState_Hide)
	utils.Write(instance._private.systemDataSource, core.Global_QrCodeWidgetState, typedefs.WidgetState_Hide)
	utils.Write(instance._private.systemDataSource, core.Global_PlaybackErrorMessageState, typedefs.WidgetState_Hide)

	time.Sleep(1 * time.Second)

	utils.Write(instance._private.systemDataSource, core.Global_LoadingWidgetState, typedefs.WidgetState_Idle)
	utils.Write(instance._private.systemDataSource, core.Global_DefinedProjectorErrorMessage, "")

}

func (instance *WidgetPlaybackSequencer_t) showPlaybackErrorMessage() {
	utils.StopTimer(&instance._private.timer)
	utils.Write(instance._private.systemDataSource, core.Global_InfoWidgetState, typedefs.WidgetState_Hide)
	utils.Write(instance._private.systemDataSource, core.Global_OverlayWidgetState, typedefs.WidgetState_Hide)
	utils.Write(instance._private.systemDataSource, core.Global_TrackListWidgetState, typedefs.WidgetState_Hide)
	utils.Write(instance._private.systemDataSource, core.Global_ProgressWidgetState, typedefs.WidgetState_Hide)
	utils.Write(instance._private.systemDataSource, core.Global_LyricsWidgetState, typedefs.WidgetState_Hide)
	utils.Write(instance._private.systemDataSource, core.Global_VisualizerWidgetState, typedefs.WidgetState_Hide)
	utils.Write(instance._private.systemDataSource, core.Global_QrCodeWidgetState, typedefs.WidgetState_Hide)
	utils.Write(instance._private.systemDataSource, core.Global_PlaybackErrorMessageState, typedefs.WidgetState_Hide)
	utils.Write(instance._private.systemDataSource, core.Global_RecordWidgetState, typedefs.WidgetState_Hide)

	time.Sleep(1 * time.Second)

	utils.Write(instance._private.systemDataSource, core.Global_RecordWidgetState, typedefs.WidgetState_EjectRecord)

	time.Sleep(250 * time.Millisecond)

	utils.Write(instance._private.systemDataSource, core.Global_PlaybackErrorMessageState, typedefs.WidgetState_Show)
}

func (instance *WidgetPlaybackSequencer_t) syncLyricsAndVisualizerWidgetState(lyricsData typedefs.LyricData_t) {

	var lyricsWidgetState typedefs.WidgetState_t
	utils.Read(instance._private.systemDataSource, core.Global_LyricsWidgetState, &lyricsWidgetState)

	var visualizerWidgetState typedefs.WidgetState_t
	utils.Read(instance._private.systemDataSource, core.Global_VisualizerWidgetState, &visualizerWidgetState)

	if !instance.targetMediaPlayerIsPlaying() {
		return
	}

	if lyricsData.TrackLyrics.TrackSupportsLyrics {
		fmt.Println("Track supports lyrics. Showing lyrics widget and hiding visualizer widget.")
		if lyricsWidgetState != typedefs.WidgetState_Show {
			utils.Write(instance._private.systemDataSource, core.Global_LyricsWidgetState, typedefs.WidgetState_Show)
		}
		if visualizerWidgetState != typedefs.WidgetState_Hide {
			utils.Write(instance._private.systemDataSource, core.Global_VisualizerWidgetState, typedefs.WidgetState_Hide)
		}
		return
	}

	if !lyricsData.TrackLyrics.TrackSupportsLyrics {
		fmt.Println("Track does not support lyrics. Hiding lyrics widget and showing visualizer widget.")
		if lyricsWidgetState != typedefs.WidgetState_Hide {
			utils.Write(instance._private.systemDataSource, core.Global_LyricsWidgetState, typedefs.WidgetState_Hide)
		}
		if visualizerWidgetState != typedefs.WidgetState_Show {
			utils.Write(instance._private.systemDataSource, core.Global_VisualizerWidgetState, typedefs.WidgetState_Show)
		}
	}
}

func (instance *WidgetPlaybackSequencer_t) showRegistrationQrCodeWidget() {
	var qrCodeData typedefs.QrCodeData_t
	utils.Read(instance._private.systemDataSource, core.Global_QrCodeWidgetData, &qrCodeData)

	if qrCodeData.ReadyForDisplay {
		utils.StopTimer(&instance._private.timer)
		utils.Write(instance._private.systemDataSource, core.Global_QrCodeWidgetState, typedefs.WidgetState_Show)
	}
}

func (instance *WidgetPlaybackSequencer_t) pauseVisualPlayback() {
	var visualizerWidgetState typedefs.WidgetState_t
	utils.Read(instance._private.systemDataSource, core.Global_VisualizerWidgetState, &visualizerWidgetState)

	if visualizerWidgetState == typedefs.WidgetState_Show {
		utils.Write(instance._private.systemDataSource, core.Global_VisualizerWidgetState, typedefs.WidgetState_Pause)
	}
	utils.Write(instance._private.systemDataSource, core.Global_OverlayWidgetState, typedefs.WidgetState_Pause)
	utils.Write(instance._private.systemDataSource, core.Global_RecordWidgetState, typedefs.WidgetState_Pause)
}

func (instance *WidgetPlaybackSequencer_t) resumeVisualPlayback() {
	var visualizerWidgetState typedefs.WidgetState_t
	utils.Read(instance._private.systemDataSource, core.Global_VisualizerWidgetState, &visualizerWidgetState)

	if visualizerWidgetState == typedefs.WidgetState_Pause {
		utils.Write(instance._private.systemDataSource, core.Global_VisualizerWidgetState, typedefs.WidgetState_Resume)
	}
	utils.Write(instance._private.systemDataSource, core.Global_OverlayWidgetState, typedefs.WidgetState_Resume)
	utils.Write(instance._private.systemDataSource, core.Global_RecordWidgetState, typedefs.WidgetState_Resume)
}

func (instance *WidgetPlaybackSequencer_t) onDataSourceChanged(dataSourceChanged <-chan database.Event) {
	go utils.ListenToDataSourceEvents(dataSourceChanged, func(args core.OnDataSourceChangedArgs_t) {

		switch args.Variable {
		case core.Global_CurrentShelfStatus.Key:
			currentShelfStatus, _ := args.Data.(typedefs.ShelfStatus_t)
			if currentShelfStatus == typedefs.ShelfStatus_Empty {
				instance.stopProjectorPlayback()
			}

		case core.Global_LastKnownUidScanned.Key:
			utils.Write(instance._private.systemDataSource, core.Global_LoadingWidgetState, typedefs.WidgetState_Loading)
			utils.StartPeriodicTimer(&instance._private.timer, 250, instance.checkIfReadyForProjectorPlayback)

		case core.Global_LastUnknownUidScanned.Key:
			utils.StartPeriodicTimer(&instance._private.timer, 250, instance.showRegistrationQrCodeWidget)

		case core.Global_LyricsWidgetData.Key:
			lyricsData, _ := args.Data.(typedefs.LyricData_t)
			if lyricsData.ReadyForDisplay {
				instance.syncLyricsAndVisualizerWidgetState(lyricsData)
			}

		case core.Global_MediaPlaybackState.Key:
			mediaPlaybackState, _ := args.Data.(typedefs.MediaPlaybackState_t)
			if mediaPlaybackState == typedefs.PlayerState_Paused {
				instance.pauseVisualPlayback()
			}
			if mediaPlaybackState == typedefs.PlayerState_Playing {
				instance.resumeVisualPlayback()
			}

		case core.Global_DefinedProjectorErrorMessage.Key:
			errorMessage, _ := args.Data.(string)
			if errorMessage != "" {
				instance.showPlaybackErrorMessage()
			}
		}
	})
}

type WidgetPlaybackSequencer_t struct {
	_private struct {
		systemDataSource database.DataSource
		albumLibrary     database.AlbumLibrary
		timer            utils.Timer_t
	}
}

func (instance *WidgetPlaybackSequencer_t) Init(dataSource database.DataSource, albumLibrary database.AlbumLibrary) {
	instance._private.systemDataSource = dataSource
	instance._private.albumLibrary = albumLibrary

	dsChannel := instance._private.systemDataSource.Subscribe("datasource")
	go instance.onDataSourceChanged(dsChannel)
}
