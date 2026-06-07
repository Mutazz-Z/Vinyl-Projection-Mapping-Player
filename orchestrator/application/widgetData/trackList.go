package widgetdata

import (
	"vinyl-orchestrator/application/database"
	"vinyl-orchestrator/core"
	"vinyl-orchestrator/typedefs"
	"vinyl-orchestrator/utils"

	"github.com/mitchellh/mapstructure"
)

type rawQueueEventItem_t struct {
	Index     int    `mapstructure:"index"`
	Name      string `mapstructure:"name"`
	MediaItem struct {
		Name string `mapstructure:"name"`
	} `mapstructure:"media_item"`
}

type rawQueueEventPayload_t struct {
	CurrentIndex int                   `mapstructure:"current_index"`
	Items        []rawQueueEventItem_t `mapstructure:"items"`
	QueueItems   []rawQueueEventItem_t `mapstructure:"queue_items"`
}

func (instance *TrackListWidgetDataUpdater) clearTrackListWidgetData() {
	clearedTrackListData := typedefs.TrackListWidgetData_t{
		Tracks:              []typedefs.TrackListItem_t{},
		CurrentPlayingIndex: 0,
		ReadyForDisplay:     false,
	}

	utils.Write(instance._private.systemDataSource, core.Global_TrackListWidgetData, clearedTrackListData)
}

func (instance *TrackListWidgetDataUpdater) resolveCurrentPlayingIndex(trackCount int, currentPlayingIndex int) int {
	if trackCount == 0 {
		return 0
	}

	if currentPlayingIndex < 0 {
		return 0
	}
	if currentPlayingIndex >= trackCount {
		return trackCount - 1
	}

	return currentPlayingIndex
}

func (instance *TrackListWidgetDataUpdater) applyTrackListWidgetData(nextTrackListData typedefs.TrackListWidgetData_t) {
	nextTrackListData.CurrentPlayingIndex = instance.resolveCurrentPlayingIndex(len(nextTrackListData.Tracks), nextTrackListData.CurrentPlayingIndex)
	nextTrackListData.ReadyForDisplay = len(nextTrackListData.Tracks) > 0

	utils.Write(instance._private.systemDataSource, core.Global_TrackListWidgetData, nextTrackListData)
}

func (instance *TrackListWidgetDataUpdater) applyQueueEventPayload(eventPayload interface{}) {
	var rawPayload rawQueueEventPayload_t
	mapstructure.Decode(eventPayload, &rawPayload)

	rawItems := rawPayload.Items
	if len(rawItems) == 0 {
		rawItems = rawPayload.QueueItems
	}

	tracks := make([]typedefs.TrackListItem_t, 0, len(rawItems))
	for index := range rawItems {
		trackName := rawItems[index].Name
		if rawItems[index].MediaItem.Name != "" {
			trackName = rawItems[index].MediaItem.Name
		}

		trackIndex := rawItems[index].Index
		if trackIndex < 0 {
			trackIndex = index
		}

		tracks = append(tracks, typedefs.TrackListItem_t{
			TrackIndex: trackIndex,
			Track:      trackName,
		})
	}

	instance.applyTrackListWidgetData(typedefs.TrackListWidgetData_t{
		Tracks:              tracks,
		CurrentPlayingIndex: rawPayload.CurrentIndex,
	})
}

func (instance *TrackListWidgetDataUpdater) isShelfOccupied() bool {
	var shelfIsOccupied typedefs.ShelfStatus_t
	utils.Read(instance._private.systemDataSource, core.Global_CurrentShelfStatus, &shelfIsOccupied)
	
	return shelfIsOccupied == typedefs.ShelfStatus_Occupied
}

func (instance *TrackListWidgetDataUpdater) listenToQueueEvents() {
	for {
		select {
		case event := <-instance._private.onQueueUpdatedEventSubscription:
			if instance.isShelfOccupied() {
				instance.applyQueueEventPayload(event.Payload)
			}

		case event := <-instance._private.onQueueItemsUpdatedEventSubscription:
			if instance.isShelfOccupied() {
				instance.applyQueueEventPayload(event.Payload)
			}
		}
	}
}

func (instance *TrackListWidgetDataUpdater) onDataSourceChanged(dataSourceChanged <-chan database.Event) {
	go utils.ListenToDataSourceEvents(dataSourceChanged, func(args core.OnDataSourceChangedArgs_t) {
		switch args.Variable {
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
		systemDataSource                     database.DataSource
		onQueueUpdatedEventSubscription      <-chan database.Event
		onQueueItemsUpdatedEventSubscription <-chan database.Event
	}
}

func (instance *TrackListWidgetDataUpdater) Init(dataSource database.DataSource) {
	instance._private.systemDataSource = dataSource
	instance._private.onQueueUpdatedEventSubscription = instance._private.systemDataSource.Subscribe("ma_event_queue_updated")
	instance._private.onQueueItemsUpdatedEventSubscription = instance._private.systemDataSource.Subscribe("ma_event_queue_items_updated")
	go instance.listenToQueueEvents()

	onDataSourceChangedSubscription := instance._private.systemDataSource.Subscribe("datasource")
	go instance.onDataSourceChanged(onDataSourceChangedSubscription)
}
