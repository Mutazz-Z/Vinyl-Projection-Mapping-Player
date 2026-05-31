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

func (instance *SystemMediaPlayer_t) updateStatesWhilePlayingMedia() {
	mediaPlayerStatus := instance.getMediaPlayerStatus(instance.retrieveTargetPlayerIdentifier())

	utils.Write(instance._private.systemDataSource, core.Global_MediaPlaybackState, mediaPlayerStatus.State)
	utils.Write(instance._private.systemDataSource, core.Global_ActiveTrackProgressInSeconds, mediaPlayerStatus.ElapsedTime)
	utils.Write(instance._private.systemDataSource, core.Global_ActiveTrackTotalDurationInSeconds, mediaPlayerStatus.TotalDuration)

	if mediaPlayerStatus.TrackName != "" {
		utils.Write(instance._private.systemDataSource, core.Global_ActiveRecordTrackName, mediaPlayerStatus.TrackName)
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
		ticker := time.NewTicker(1 * time.Second)
		defer ticker.Stop()

		for {
			select {
			case <-ctx.Done():
				return
			case <-ticker.C:
				instance.updateStatesWhilePlayingMedia()
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
