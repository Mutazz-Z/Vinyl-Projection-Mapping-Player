package widgetdata

import (
	"vinyl-orchestrator/application/database"
	"vinyl-orchestrator/application/musicassistant"
	"vinyl-orchestrator/core"
	"vinyl-orchestrator/typedefs"
	"vinyl-orchestrator/utils"
)

func (instance *Progress_t) clearProgressWidgetData() {
	clearedProgressWidgetData := typedefs.ProgressData_t{
		CurrentDurationInTrack: 0,
		TotalDurationInTrack:   0,
		ReadyForDisplay:        false,
	}

	utils.Write(instance._private.systemDataSource, core.Global_ProgressWidgetData, clearedProgressWidgetData)
}

func (instance *Progress_t) writeProgressWidgetData(currentDuration float64, totalDuration float64) {
	nextProgressWidgetData := typedefs.ProgressData_t{
		CurrentDurationInTrack: int(currentDuration),
		TotalDurationInTrack:   int(totalDuration),
		ReadyForDisplay:        true,
	}
	utils.Write(instance._private.systemDataSource, core.Global_ProgressWidgetData, nextProgressWidgetData)
}

func (instance *Progress_t) updateProgressWidgetData() {
	mediaPlayerStatus, _ := instance._private.statusProvider.GetCurrentMediaPlayerStatus()
	if mediaPlayerStatus.State == typedefs.PlayerState_Playing {
		instance.writeProgressWidgetData(mediaPlayerStatus.ElapsedTime, mediaPlayerStatus.TotalDuration)
	}
}

func (instance *Progress_t) onDataSourceChanged(dataSourceChanged <-chan database.Event) {
	go utils.ListenToDataSourceEvents(dataSourceChanged, func(args core.OnDataSourceChangedArgs_t) {
		switch args.Variable {
		case core.Global_CurrentShelfStatus.Key:
			currentShelfStatus, _ := args.Data.(typedefs.ShelfStatus_t)
			if currentShelfStatus == typedefs.ShelfStatus_Empty {
				utils.StopTimer(&instance._private.timer)
				instance.clearProgressWidgetData()
			} else {
				utils.StartPeriodicTimer(&instance._private.timer, 250, instance.updateProgressWidgetData)
			}
		}
	})
}

type Progress_t struct {
	_private struct {
		systemDataSource database.DataSource
		statusProvider   musicassistant.MediaPlayerStatusProvider
		timer            utils.Timer_t
	}
}

func (instance *Progress_t) Init(dataSource database.DataSource, statusProvider musicassistant.MediaPlayerStatusProvider) {
	instance._private.systemDataSource = dataSource
	instance._private.statusProvider = statusProvider

	onDataSourceChangedSubscription := instance._private.systemDataSource.Subscribe("datasource")
	go instance.onDataSourceChanged(onDataSourceChangedSubscription)
}
