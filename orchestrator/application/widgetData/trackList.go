package widgetdata

import (
	"vinyl-orchestrator/application/database"
	"vinyl-orchestrator/application/musicassistant"
	"vinyl-orchestrator/core"
	"vinyl-orchestrator/typedefs"
	"vinyl-orchestrator/utils"
)

func (instance *TrackListWidgetDataUpdater) clearTrackListWidgetData() {
	clearedTrackListData := typedefs.TrackListWidgetData_t{
		Tracks:              []typedefs.TrackListItem_t{},
		CurrentPlayingIndex: 0,
		ReadyForDisplay:     false,
	}

	utils.Write(instance._private.systemDataSource, core.Global_TrackListWidgetData, clearedTrackListData)
}

func (instance *TrackListWidgetDataUpdater) applyTrackListWidgetData(nextTrackListData typedefs.TrackListWidgetData_t) {
	nextTrackListData.ReadyForDisplay = len(nextTrackListData.Tracks) > 0
	utils.Write(instance._private.systemDataSource, core.Global_TrackListWidgetData, nextTrackListData)
}

func (instance *TrackListWidgetDataUpdater) pollCurrentQueueList() {
	queueList, _ := instance._private.queueProvider.GetCurrentQueueList()

	var activeTrack typedefs.ActiveTrack_t
	utils.Read(instance._private.systemDataSource, core.Global_ActiveTrack, &activeTrack)

	currentPlayingIndex := activeTrack.TrackIndex

	instance.applyTrackListWidgetData(typedefs.TrackListWidgetData_t{
		Tracks:              queueList.Tracks,
		CurrentPlayingIndex: currentPlayingIndex,
	})
}

func (instance *TrackListWidgetDataUpdater) onDataSourceChanged(dataSourceChanged <-chan database.Event) {
	go utils.ListenToDataSourceEvents(dataSourceChanged, func(args core.OnDataSourceChangedArgs_t) {
		switch args.Variable {
		case core.Global_CurrentShelfStatus.Key:
			currentShelfStatus, _ := args.Data.(typedefs.ShelfStatus_t)
			if currentShelfStatus == typedefs.ShelfStatus_Empty {
				utils.StopTimer(&instance._private.pollTimer)
				instance.clearTrackListWidgetData()
			} else {
				utils.StartPeriodicTimer(&instance._private.pollTimer, 500, instance.pollCurrentQueueList)
			}
		}
	})
}

type TrackListWidgetDataUpdater struct {
	_private struct {
		systemDataSource database.DataSource
		queueProvider    musicassistant.QueueListProvider
		pollTimer        utils.Timer_t
	}
}

func (instance *TrackListWidgetDataUpdater) Init(dataSource database.DataSource, queueProvider musicassistant.QueueListProvider) {
	instance._private.systemDataSource = dataSource
	instance._private.queueProvider = queueProvider

	onDataSourceChangedSubscription := instance._private.systemDataSource.Subscribe("datasource")
	go instance.onDataSourceChanged(onDataSourceChangedSubscription)
}
