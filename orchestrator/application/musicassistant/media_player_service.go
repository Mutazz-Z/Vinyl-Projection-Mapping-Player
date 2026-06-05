/*
 * Handles media player operations such as play, stop, and event-driven status updates
 */

package musicassistant

import (
	"context"
	"sync"
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

func (instance *SystemMediaPlayer_t) queueListsDontMatch(previousQueue, currentQueue typedefs.QueueList_t) bool {
	if len(previousQueue.Tracks) != len(currentQueue.Tracks) {
		return true
	}

	for i := range previousQueue.Tracks {
		if previousQueue.Tracks[i] != currentQueue.Tracks[i] {
			return true
		}
	}
	return false
}

func (instance *SystemMediaPlayer_t) activeTracksDontMatch(previousTrack, currentTrack typedefs.ActiveTrack_t) bool {
	return previousTrack != currentTrack
}

func (instance *SystemMediaPlayer_t) refreshQueueWhilePlayingMedia() {
	currentMediaQueue, _ := instance.getMediaPlayerQueueList(instance.retrieveTargetPlayerIdentifier())

	var previousMediaQueue typedefs.QueueList_t
	utils.Read(instance._private.systemDataSource, core.Global_CurrentMediaPlaybackQueue, &previousMediaQueue)

	if instance.queueListsDontMatch(previousMediaQueue, currentMediaQueue) {
		utils.Write(instance._private.systemDataSource, core.Global_CurrentMediaPlaybackQueue, currentMediaQueue)
	}
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
	instance._private.lastKnownPosition = parsedState.ElapsedTime
	instance._private.lastPositionUpdate = time.Now()
	instance._private.isPlaying = state == typedefs.PlayerState_Playing
	instance._private.interpolationMutex.Unlock()
}

// applyQueueTimeUpdatedEvent handles MA's queue_time_updated event, which fires
// approximately every second during playback with the current elapsed position.
func (instance *SystemMediaPlayer_t) applyQueueTimeUpdatedEvent(eventPayload interface{}) {
	targetPlayerIdentifier := instance.retrieveTargetPlayerIdentifier()

	payloadMap, ok := eventPayload.(map[string]interface{})
	if !ok {
		return
	}

	queueId, _ := payloadMap["queue_id"].(string)
	if queueId != targetPlayerIdentifier {
		return
	}

	elapsedTime, _ := payloadMap["elapsed_time"].(float64)

	instance._private.interpolationMutex.Lock()
	instance._private.lastKnownPosition = elapsedTime
	instance._private.lastPositionUpdate = time.Now()
	instance._private.interpolationMutex.Unlock()
}

// interpolateAndWriteElapsedTime computes the current playback position locally
// using the last known position from MA events plus elapsed wall-clock time,
// avoiding any network round-trips for smooth progress updates.
func (instance *SystemMediaPlayer_t) interpolateAndWriteElapsedTime() {
	instance._private.interpolationMutex.Lock()
	isPlaying := instance._private.isPlaying
	lastPosition := instance._private.lastKnownPosition
	lastUpdate := instance._private.lastPositionUpdate
	instance._private.interpolationMutex.Unlock()

	if !isPlaying {
		return
	}

	interpolatedPosition := lastPosition + time.Since(lastUpdate).Seconds()
	utils.Write(instance._private.systemDataSource, core.Global_ActiveTrackProgressInSeconds, interpolatedPosition)
}

const interpolationTickInterval = 250 * time.Millisecond

func (instance *SystemMediaPlayer_t) GetAvailablePlayers() ([]typedefs.AvailableMediaPlayers_t, error) {
	return instance.getAvailablePlayers()
}

func (instance *SystemMediaPlayer_t) startListening() {
	instance._private.listenerMutex.Lock()
	defer instance._private.listenerMutex.Unlock()

	if instance._private.listenerCancel != nil {
		instance._private.listenerCancel()
	}

	ctx, cancel := context.WithCancel(context.Background())
	instance._private.listenerCancel = cancel

	go func(ctx context.Context) {
		// Seed initial state immediately so the display is correct before events arrive
		mediaPlayerStatus := instance.getMediaPlayerStatus(instance.retrieveTargetPlayerIdentifier())
		utils.Write(instance._private.systemDataSource, core.Global_MediaPlaybackState, mediaPlayerStatus.State)
		utils.Write(instance._private.systemDataSource, core.Global_ActiveTrackProgressInSeconds, mediaPlayerStatus.ElapsedTime)
		utils.Write(instance._private.systemDataSource, core.Global_ActiveTrackTotalDurationInSeconds, mediaPlayerStatus.TotalDuration)
		if mediaPlayerStatus.ActiveTrack.TrackName != "" {
			utils.Write(instance._private.systemDataSource, core.Global_ActiveTrack, mediaPlayerStatus.ActiveTrack)
		}
		go instance.refreshQueueWhilePlayingMedia()

		instance._private.interpolationMutex.Lock()
		instance._private.lastKnownPosition = mediaPlayerStatus.ElapsedTime
		instance._private.lastPositionUpdate = time.Now()
		instance._private.isPlaying = mediaPlayerStatus.State == typedefs.PlayerState_Playing
		instance._private.interpolationMutex.Unlock()

		interpolationTicker := time.NewTicker(interpolationTickInterval)
		defer interpolationTicker.Stop()

		for {
			select {
			case <-ctx.Done():
				return
			case event := <-instance._private.queueUpdatedEvents:
				instance.applyQueueUpdatedEvent(event.Payload)
			case event := <-instance._private.queueTimeUpdatedEvents:
				instance.applyQueueTimeUpdatedEvent(event.Payload)
			case <-interpolationTicker.C:
				instance.interpolateAndWriteElapsedTime()
			}
		}
	}(ctx)
}

func (instance *SystemMediaPlayer_t) stopListening() {
	instance._private.listenerMutex.Lock()
	defer instance._private.listenerMutex.Unlock()

	if instance._private.listenerCancel != nil {
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

		queueUpdatedEvents     <-chan database.Event
		queueTimeUpdatedEvents <-chan database.Event

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
	instance._private.queueTimeUpdatedEvents = dataSource.Subscribe("ma_event_queue_time_updated")
}
