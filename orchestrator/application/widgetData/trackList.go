package widgetdata

import (
	"vinyl-orchestrator/application/database"
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

func (instance *TrackListWidgetDataUpdater) resolveCurrentPlayingIndex(trackListData typedefs.TrackListWidgetData_t) int {
	if len(trackListData.Tracks) == 0 {
		return 0
	}

	if trackListData.CurrentPlayingIndex < 0 {
		return 0
	}
	if trackListData.CurrentPlayingIndex >= len(trackListData.Tracks) {
		return len(trackListData.Tracks) - 1
	}

	return trackListData.CurrentPlayingIndex
}

func (instance *TrackListWidgetDataUpdater) applyQueueListToTrackList(queueList typedefs.QueueList_t) {
	var currentTrackListData typedefs.TrackListWidgetData_t
	utils.Read(instance._private.systemDataSource, core.Global_TrackListWidgetData, &currentTrackListData)

	if len(queueList.Tracks) == 0 {
		if currentTrackListData.ReadyForDisplay || len(currentTrackListData.Tracks) != 0 || currentTrackListData.CurrentPlayingIndex != 0 {
			instance.clearTrackListWidgetData()
		}
		return
	}

	resolvedIndex := instance.resolveCurrentPlayingIndex(typedefs.TrackListWidgetData_t{
		Tracks:              queueList.Tracks,
		CurrentPlayingIndex: queueList.CurrentPlayingIndex,
	})
	readyForDisplay := len(queueList.Tracks) > 0

	if len(currentTrackListData.Tracks) == len(queueList.Tracks) && currentTrackListData.CurrentPlayingIndex == resolvedIndex && currentTrackListData.ReadyForDisplay == readyForDisplay {
		tracksMatch := true
		for i := range currentTrackListData.Tracks {
			if currentTrackListData.Tracks[i].Track != queueList.Tracks[i].Track || currentTrackListData.Tracks[i].TrackIndex != queueList.Tracks[i].TrackIndex {
				tracksMatch = false
				break
			}
		}
		if tracksMatch {
			return
		}
	}

	currentTrackListData.Tracks = queueList.Tracks
	currentTrackListData.CurrentPlayingIndex = resolvedIndex
	currentTrackListData.ReadyForDisplay = readyForDisplay
	utils.Write(instance._private.systemDataSource, core.Global_TrackListWidgetData, currentTrackListData)
}

func (instance *TrackListWidgetDataUpdater) onDataSourceChanged(dataSourceChanged <-chan database.Event) {
	go utils.ListenToDataSourceEvents(dataSourceChanged, func(args core.OnDataSourceChangedArgs_t) {
		switch args.Variable {
		case core.Global_CurrentQueueList.Key:
			queueList, ok := args.Data.(typedefs.QueueList_t)
			if !ok {
				return
			}
			instance.applyQueueListToTrackList(queueList)

		case core.Global_CurrentShelfStatus.Key:
			currentShelfStatus, _ := args.Data.(typedefs.ShelfStatus_t)
			if currentShelfStatus == typedefs.ShelfStatus_Empty {
				instance.clearTrackListWidgetData()
			}
		}
	})
}

type TrackListWidgetDataUpdater struct {
	_private struct {
		systemDataSource database.DataSource
	}
}

func (instance *TrackListWidgetDataUpdater) Init(dataSource database.DataSource) {
	instance._private.systemDataSource = dataSource

	dsChannel := instance._private.systemDataSource.Subscribe("datasource")
	go instance.onDataSourceChanged(dsChannel)
}
