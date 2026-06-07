/*
 * Handles media player operations such as play, stop, and event-driven status updates
 */

package musicassistant

import (
	"context"
	"sync"
	"sync/atomic"
	"time"

	"vinyl-orchestrator/application/database"
	"vinyl-orchestrator/core"
	"vinyl-orchestrator/typedefs"
	"vinyl-orchestrator/utils"

	"github.com/mitchellh/mapstructure"
)

func (instance *SystemMediaPlayer_t) retrieveTargetPlayerIdentifier() string {
	var targetPlayerIdentifier string
	utils.Read(instance._private.systemDataSource, core.Global_MusicAssistantTargetPlayerId, &targetPlayerIdentifier)

	return targetPlayerIdentifier
}

func (instance *SystemMediaPlayer_t) PlayMedia(mediaUri string) error {
	targetPlayerIdentifier := instance.retrieveTargetPlayerIdentifier()

	commandArguments := map[string]interface{}{
		"queue_id": targetPlayerIdentifier,
		"media":    []string{mediaUri},
	}

	playMediaError := instance._private.messageRouter.SendFireAndForgetCommand("player_queues/play_media", commandArguments)
	if playMediaError == nil {
		instance.startListening()
	}
	return playMediaError
}

func (instance *SystemMediaPlayer_t) StopMedia() error {
	targetPlayerIdentifier := instance.retrieveTargetPlayerIdentifier()

	commandArguments := map[string]interface{}{
		"queue_id": targetPlayerIdentifier,
	}

	stopMediaError := instance._private.messageRouter.SendFireAndForgetCommand("player_queues/stop", commandArguments)
	if stopMediaError == nil {
		instance.stopListening()
	}
	return stopMediaError
}

func (instance *SystemMediaPlayer_t) queueListDiffers(previousQueueList, nextQueueList typedefs.QueueList_t) bool {
	if len(previousQueueList.Tracks) != len(nextQueueList.Tracks) {
		return true
	}

	for i := range previousQueueList.Tracks {
		if previousQueueList.Tracks[i].Track != nextQueueList.Tracks[i].Track {
			return true
		}
		if previousQueueList.Tracks[i].TrackIndex != nextQueueList.Tracks[i].TrackIndex {
			return true
		}
	}

	if previousQueueList.CurrentPlayingIndex != nextQueueList.CurrentPlayingIndex {
		return true
	}

	return false
}

func (instance *SystemMediaPlayer_t) activeTracksDontMatch(previousTrack, currentTrack typedefs.ActiveTrack_t) bool {
	return previousTrack != currentTrack
}

func (instance *SystemMediaPlayer_t) refreshQueueWhilePlayingMedia() {
	currentMediaQueue, _ := instance.getMediaPlayerQueueList(instance.retrieveTargetPlayerIdentifier())

	var activeTrack typedefs.ActiveTrack_t
	utils.Read(instance._private.systemDataSource, core.Global_ActiveTrack, &activeTrack)
	if currentMediaQueue.CurrentPlayingIndex == 0 && activeTrack.TrackIndex > 0 {
		currentMediaQueue.CurrentPlayingIndex = activeTrack.TrackIndex
	}

	var previousQueueList typedefs.QueueList_t
	utils.Read(instance._private.systemDataSource, core.Global_CurrentQueueList, &previousQueueList)

	if instance.queueListDiffers(previousQueueList, currentMediaQueue) {
		utils.Write(instance._private.systemDataSource, core.Global_CurrentQueueList, currentMediaQueue)
	}
}

func (instance *SystemMediaPlayer_t) applyStatusSnapshotToDataSource(statusSnapshot MediaPlayerStatus_t) {
	utils.Write(instance._private.systemDataSource, core.Global_MediaPlaybackState, statusSnapshot.State)
	utils.Write(instance._private.systemDataSource, core.Global_ActiveTrackProgressInSeconds, statusSnapshot.ElapsedTime)
	utils.Write(instance._private.systemDataSource, core.Global_ActiveTrackTotalDurationInSeconds, statusSnapshot.TotalDuration)

	var previousTrack typedefs.ActiveTrack_t
	utils.Read(instance._private.systemDataSource, core.Global_ActiveTrack, &previousTrack)
	if statusSnapshot.ActiveTrack.TrackName != "" && instance.activeTracksDontMatch(previousTrack, statusSnapshot.ActiveTrack) {
		utils.Write(instance._private.systemDataSource, core.Global_ActiveTrack, statusSnapshot.ActiveTrack)
	}

	instance._private.interpolationMutex.Lock()
	instance._private.lastKnownPosition = statusSnapshot.ElapsedTime
	instance._private.lastPositionUpdate = time.Now()
	instance._private.isPlaying = statusSnapshot.State == typedefs.PlayerState_Playing
	instance._private.interpolationMutex.Unlock()
}

func (instance *SystemMediaPlayer_t) syncStatusSnapshotForTargetPlayer(targetPlayerIdentifier string) {
	statusSnapshot, statusError := instance.getMediaPlayerStatus(targetPlayerIdentifier)
	if statusError != nil {
		return
	}

	instance.applyStatusSnapshotToDataSource(statusSnapshot)
}

// applyQueueUpdatedEvent handles MA's queue_updated event, which fires on play/pause,
// track changes, and queue modifications. It updates playback state, active track, and
// triggers a queue list refresh.
func (instance *SystemMediaPlayer_t) applyQueueUpdatedEvent(eventPayload interface{}) {
	targetPlayerIdentifier := instance.retrieveTargetPlayerIdentifier()

	payloadMap, ok := eventPayload.(map[string]interface{})
	if !ok {
		return
	}

	queueId, _ := payloadMap["queue_id"].(string)
	if queueId != targetPlayerIdentifier {
		return
	}

	var parsedState RawMediaPlayerStatus_t
	mapstructure.Decode(payloadMap, &parsedState)
	resolvedTrackIndex := parseQueueTrackIndex(payloadMap, parsedState.CurrentIndex)

	state := parsePlayerState(parsedState.State)
	utils.Write(instance._private.systemDataSource, core.Global_MediaPlaybackState, state)
	utils.Write(instance._private.systemDataSource, core.Global_ActiveTrackTotalDurationInSeconds, parsedState.CurrentItem.Duration)

	currentTrack := typedefs.ActiveTrack_t{
		TrackName:   parsedState.CurrentItem.Name,
		TrackIndex:  resolvedTrackIndex,
		TrackItemId: parsedState.CurrentItem.MediaItem.ItemId,
		AlbumItemId: parsedState.CurrentItem.MediaItem.Album.ItemId,
		Provider:    parsedState.CurrentItem.MediaItem.Provider,
	}

	var previousTrack typedefs.ActiveTrack_t
	utils.Read(instance._private.systemDataSource, core.Global_ActiveTrack, &previousTrack)

	if currentTrack.TrackName != "" && instance.activeTracksDontMatch(previousTrack, currentTrack) {
		utils.Write(instance._private.systemDataSource, core.Global_ActiveTrack, currentTrack)
	}

	go instance.refreshQueueWhilePlayingMedia()

	instance._private.interpolationMutex.Lock()
	instance._private.isPlaying = state == typedefs.PlayerState_Playing
	instance._private.interpolationMutex.Unlock()
}

func (instance *SystemMediaPlayer_t) applyPlayerUpdatedEvent(eventPayload interface{}) {
	targetPlayerIdentifier := instance.retrieveTargetPlayerIdentifier()

	payloadMap, ok := eventPayload.(map[string]interface{})
	if !ok {
		return
	}

	if playerId, hasPlayerId := payloadMap["player_id"].(string); hasPlayerId && playerId != targetPlayerIdentifier {
		return
	}

	instance.syncStatusSnapshotForTargetPlayer(targetPlayerIdentifier)
}

func (instance *SystemMediaPlayer_t) GetAvailablePlayers() ([]typedefs.AvailableMediaPlayers_t, error) {
	return instance.getAvailablePlayers()
}

func (instance *SystemMediaPlayer_t) buildStatusSnapshotTimerHandler(ctx context.Context, isSyncSuspended *atomic.Bool, targetPlayerIdentifier string) func() {
	return func() {
		if ctx.Err() != nil || isSyncSuspended.Load() {
			return
		}
		instance.syncStatusSnapshotForTargetPlayer(targetPlayerIdentifier)
	}
}

func (instance *SystemMediaPlayer_t) startListening() {
	instance._private.listenerMutex.Lock()
	defer instance._private.listenerMutex.Unlock()

	if instance._private.listenerCancel != nil {
		utils.StopTimer(&instance._private.statusSnapshotTimer)
		instance._private.listenerCancel()
	}

	ctx, cancel := context.WithCancel(context.Background())
	instance._private.listenerCancel = cancel

	go func(ctx context.Context) {
		defer utils.StopTimer(&instance._private.statusSnapshotTimer)

		var isSyncSuspended atomic.Bool

		updateSuspensionFromProjectorData := func() {
			var projectorData typedefs.ProjectorData_t
			if err := utils.Read(instance._private.systemDataSource, core.Global_CurrentProjectorData, &projectorData); err != nil {
				return
			}

			wasSuspended := isSyncSuspended.Load()
			isSuspended := projectorData.VisualDataState != typedefs.VisualDataState_DisplayAlbumVisuals
			isSyncSuspended.Store(isSuspended)

			if wasSuspended && !isSuspended {
				targetPlayerIdentifier := instance.retrieveTargetPlayerIdentifier()
				instance.syncStatusSnapshotForTargetPlayer(targetPlayerIdentifier)
				go instance.refreshQueueWhilePlayingMedia()
			}
		}

		updateSuspensionFromProjectorData()

		// Seed initial state immediately so the display is correct before events arrive
		mediaPlayerStatus, mediaPlayerStatusError := instance.getMediaPlayerStatus(instance.retrieveTargetPlayerIdentifier())
		if mediaPlayerStatusError != nil {
			return
		}
		instance.applyStatusSnapshotToDataSource(mediaPlayerStatus)
		go instance.refreshQueueWhilePlayingMedia()

		targetPlayerIdentifier := instance.retrieveTargetPlayerIdentifier()
		onStatusSnapshotTimerExpired := instance.buildStatusSnapshotTimerHandler(ctx, &isSyncSuspended, targetPlayerIdentifier)
		utils.StartPeriodicTimer(&instance._private.statusSnapshotTimer, 250, onStatusSnapshotTimerExpired)

		for {
			select {
			case <-ctx.Done():
				return
			case event := <-instance._private.dataSourceEvents:
				args, ok := event.Payload.(core.OnDataSourceChangedArgs_t)
				if !ok {
					continue
				}

				if args.Variable == core.Global_CurrentProjectorData.Key {
					updateSuspensionFromProjectorData()
				}
			case event := <-instance._private.queueUpdatedEvents:
				if isSyncSuspended.Load() {
					continue
				}
				instance.applyQueueUpdatedEvent(event.Payload)
			case event := <-instance._private.playerUpdatedEvents:
				if isSyncSuspended.Load() {
					continue
				}
				instance.applyPlayerUpdatedEvent(event.Payload)
			}
		}
	}(ctx)
}

func (instance *SystemMediaPlayer_t) stopListening() {
	instance._private.listenerMutex.Lock()
	defer instance._private.listenerMutex.Unlock()

	if instance._private.listenerCancel != nil {
		utils.StopTimer(&instance._private.statusSnapshotTimer)
		instance._private.listenerCancel()
		instance._private.listenerCancel = nil
	}

}

type SystemMediaPlayer_t struct {
	_private struct {
		systemDataSource database.DataSource
		messageRouter    *RpcMessageRouter_t

		listenerCancel context.CancelFunc
		listenerMutex  sync.Mutex

		queueUpdatedEvents  <-chan database.Event
		playerUpdatedEvents <-chan database.Event
		dataSourceEvents    <-chan database.Event
		statusSnapshotTimer utils.Timer_t

		interpolationMutex sync.Mutex
		lastKnownPosition  float64
		lastPositionUpdate time.Time
		isPlaying          bool
	}
}

func (instance *SystemMediaPlayer_t) Init(dataSource database.DataSource, routerInstance *RpcMessageRouter_t) {
	instance._private.systemDataSource = dataSource
	instance._private.messageRouter = routerInstance
	instance._private.queueUpdatedEvents = dataSource.Subscribe("ma_event_queue_updated")
	instance._private.playerUpdatedEvents = dataSource.Subscribe("ma_event_player_updated")
	instance._private.dataSourceEvents = dataSource.Subscribe("datasource")
}
