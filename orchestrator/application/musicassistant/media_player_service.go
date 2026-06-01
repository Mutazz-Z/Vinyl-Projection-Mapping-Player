/*
 * Handles media player operations such as play, stop, and polling for status updates
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
		instance.startPolling()
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
		instance.stopPolling()
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

const (
	playbackStatusPollInterval = 250 * time.Millisecond
	queueRefreshInterval       = 1 * time.Second
)

func (instance *SystemMediaPlayer_t) updatePlaybackStatusWhilePlayingMedia() {
	mediaPlayerStatus := instance.getMediaPlayerStatus(instance.retrieveTargetPlayerIdentifier())

	var previousTrack typedefs.ActiveTrack_t
	utils.Read(instance._private.systemDataSource, core.Global_ActiveTrack, &previousTrack)

	utils.Write(instance._private.systemDataSource, core.Global_MediaPlaybackState, mediaPlayerStatus.State)
	utils.Write(instance._private.systemDataSource, core.Global_ActiveTrackProgressInSeconds, mediaPlayerStatus.ElapsedTime)
	utils.Write(instance._private.systemDataSource, core.Global_ActiveTrackTotalDurationInSeconds, mediaPlayerStatus.TotalDuration)

	if mediaPlayerStatus.ActiveTrack.TrackName != "" && instance.activeTracksDontMatch(previousTrack, mediaPlayerStatus.ActiveTrack) {
		utils.Write(instance._private.systemDataSource, core.Global_ActiveTrack, mediaPlayerStatus.ActiveTrack)
	}
}

func (instance *SystemMediaPlayer_t) refreshQueueWhilePlayingMedia() {
	currentMediaQueue, _ := instance.getMediaPlayerQueueList(instance.retrieveTargetPlayerIdentifier())

	var previousMediaQueue typedefs.QueueList_t
	utils.Read(instance._private.systemDataSource, core.Global_CurrentMediaPlaybackQueue, &previousMediaQueue)

	if instance.queueListsDontMatch(previousMediaQueue, currentMediaQueue) {
		utils.Write(instance._private.systemDataSource, core.Global_CurrentMediaPlaybackQueue, currentMediaQueue)
	}
}

func (instance *SystemMediaPlayer_t) GetAvailablePlayers() ([]typedefs.AvailableMediaPlayers_t, error) {
	return instance.getAvailablePlayers()
}

func (instance *SystemMediaPlayer_t) startPolling() {
	instance._private.pollingMutex.Lock()
	defer instance._private.pollingMutex.Unlock()

	if instance._private.pollingCancel != nil {
		instance._private.pollingCancel()
	}

	ctx, cancel := context.WithCancel(context.Background())
	instance._private.pollingCancel = cancel

	go func(ctx context.Context) {
		statusTicker := time.NewTicker(playbackStatusPollInterval)
		queueTicker := time.NewTicker(queueRefreshInterval)
		defer statusTicker.Stop()
		defer queueTicker.Stop()

		instance.updatePlaybackStatusWhilePlayingMedia()
		instance.refreshQueueWhilePlayingMedia()

		for {
			select {
			case <-ctx.Done():
				return
			case <-statusTicker.C:
				instance.updatePlaybackStatusWhilePlayingMedia()
			case <-queueTicker.C:
				instance.refreshQueueWhilePlayingMedia()
			}
		}
	}(ctx)
}

func (instance *SystemMediaPlayer_t) stopPolling() {
	instance._private.pollingMutex.Lock()
	defer instance._private.pollingMutex.Unlock()

	if instance._private.pollingCancel != nil {
		instance._private.pollingCancel()
		instance._private.pollingCancel = nil
	}
}

type SystemMediaPlayer_t struct {
	_private struct {
		systemDataSource database.DataSource
		messageRouter    *RpcMessageRouter_t

		pollingCancel context.CancelFunc
		pollingMutex  sync.Mutex
	}
}

func (instance *SystemMediaPlayer_t) Init(dataSource database.DataSource, routerInstance *RpcMessageRouter_t) {
	instance._private.systemDataSource = dataSource
	instance._private.messageRouter = routerInstance
}
