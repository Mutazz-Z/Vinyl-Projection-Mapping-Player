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

	var progressData typedefs.ProgressData_t
	utils.Read(instance._private.systemDataSource, core.Global_ProgressWidgetData, &progressData)

	return progressData.TotalDurationInTrack > 0 || progressData.CurrentDurationInTrack > 0
}

func (instance *WidgetPlaybackSequencer_t) startProjectorPlayback() {
	utils.Write(instance._private.systemDataSource, core.Global_LoadingWidgetState, typedefs.WidgetState_Hide)

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

	var widgetsStatus = []bool{
		titleAndArtist.ReadyForDisplay,
		recordDesignData.ReadyForDisplay,
		overlayData.ReadyForDisplay,
		trackListData.ReadyForDisplay,
		progressData.ReadyForDisplay}

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

	time.Sleep(1 * time.Second)

	utils.Write(instance._private.systemDataSource, core.Global_LoadingWidgetState, typedefs.WidgetState_Idle)
}

func (instance *WidgetPlaybackSequencer_t) onDataSourceChanged(dataSourceChanged <-chan database.Event) {
	go utils.ListenToDataSourceEvents(dataSourceChanged, func(args core.OnDataSourceChangedArgs_t) {

		switch args.Variable {
		case core.Global_CurrentShelfStatus.Key:
			currentShelfStatus, _ := args.Data.(typedefs.ShelfStatus_t)
			if currentShelfStatus == typedefs.ShelfStatus_Empty {
				utils.StopTimer(&instance._private.timer)
				instance.stopProjectorPlayback()

			} else {
				utils.Write(instance._private.systemDataSource, core.Global_LoadingWidgetState, typedefs.WidgetState_Loading)
				utils.StartPeriodicTimer(&instance._private.timer, 250, instance.checkIfReadyForProjectorPlayback)
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
