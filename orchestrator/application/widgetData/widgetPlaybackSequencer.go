package widgetdata

import (
	"fmt"
	"vinyl-orchestrator/application/database"
	"vinyl-orchestrator/core"
	"vinyl-orchestrator/typedefs"
	"vinyl-orchestrator/utils"
)

func (instance *WidgetPlaybackSequencer_t) startProjectorPlayback() {
	utils.Write(instance._private.systemDataSource, core.Global_InfoWidgetState, typedefs.WidgetState_Show)
	utils.Write(instance._private.systemDataSource, core.Global_OverlayWidgetState, typedefs.WidgetState_Show)
	utils.Write(instance._private.systemDataSource, core.Global_RecordWidgetState, typedefs.WidgetState_Show)

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
	utils.Read(instance._private.systemDataSource, core.Global_CurrentPlayingAlbumTitleAndArtist, &titleAndArtist)

	var recordDesignData typedefs.RecordDesignData_t
	utils.Read(instance._private.systemDataSource, core.Global_CurrentPlayingAlbumRecordDesign, &recordDesignData)

	var overlayData typedefs.OverlayData_t
	utils.Read(instance._private.systemDataSource, core.Global_CurrentPlayingAlbumOverlay, &overlayData)

	var widgetsStatus = []bool{
		titleAndArtist.ReadyForDisplay,
		recordDesignData.ReadyForDisplay,
		overlayData.ReadyForDisplay}

	if instance.widgetsAreReadyForProjectorPlayback(widgetsStatus) {
		fmt.Println("All widgets are ready for projector playback. Starting playback...")
		utils.StopTimer(&instance._private.timer)
		instance.startProjectorPlayback()
	} else {
		return
	}
}

func (instance *WidgetPlaybackSequencer_t) stopProjectorPlayback() {
	utils.StopTimer(&instance._private.timer)
	utils.Write(instance._private.systemDataSource, core.Global_InfoWidgetState, typedefs.WidgetState_Hide)
	utils.Write(instance._private.systemDataSource, core.Global_OverlayWidgetState, typedefs.WidgetState_Hide)
	utils.Write(instance._private.systemDataSource, core.Global_RecordWidgetState, typedefs.WidgetState_Hide)

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
