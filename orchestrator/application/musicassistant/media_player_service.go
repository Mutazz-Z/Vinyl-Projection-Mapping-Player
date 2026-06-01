/*
 * Handles media player operations such as play, stop, and polling for status updates
 */

package musicassistant

import (
	"context"
	"fmt"
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

func (instance *SystemMediaPlayer_t) shouldRefreshLyrics(previousTrack, currentTrack typedefs.ActiveTrack_t, previousLyrics typedefs.TrackLyrics_t) bool {
	if currentTrack.TrackName == "" {
		return false
	}

	if instance.activeTracksDontMatch(previousTrack, currentTrack) {
		return true
	}

	if len(previousLyrics.Lines) == 0 {
		return true
	}

	return false
}

func (instance *SystemMediaPlayer_t) updateStatesWhilePlayingMedia() {
	mediaPlayerStatus := instance.getMediaPlayerStatus(instance.retrieveTargetPlayerIdentifier())
	currentMediaQueue, _ := instance.getMediaPlayerQueueList(instance.retrieveTargetPlayerIdentifier())

	var previousTrack typedefs.ActiveTrack_t
	utils.Read(instance._private.systemDataSource, core.Global_ActiveTrack, &previousTrack)

	var previousLyrics typedefs.TrackLyrics_t
	utils.Read(instance._private.systemDataSource, core.Global_ActiveTrackLyrics, &previousLyrics)

	if instance.activeTracksDontMatch(previousTrack, mediaPlayerStatus.ActiveTrack) {
		utils.Write(instance._private.systemDataSource, core.Global_ActiveTrackLyrics, typedefs.TrackLyrics_t{})
	}

	if instance.shouldRefreshLyrics(previousTrack, mediaPlayerStatus.ActiveTrack, previousLyrics) {
		trackLyrics, lyricsError := instance.getTrackLyrics(mediaPlayerStatus.ActiveTrack.ItemID, mediaPlayerStatus.ActiveTrack.Provider)
		if lyricsError != nil {
			fmt.Printf("Lyrics fetch failed for track '%s': %v\n", mediaPlayerStatus.ActiveTrack.TrackName, lyricsError)
		} else {
			fmt.Printf("Lyrics refreshed for track '%s' with %d line(s).\n", mediaPlayerStatus.ActiveTrack.TrackName, len(trackLyrics.Lines))
			utils.Write(instance._private.systemDataSource, core.Global_ActiveTrackLyrics, trackLyrics)
		}
	}

	var previousMediaQueue typedefs.QueueList_t
	utils.Read(instance._private.systemDataSource, core.Global_CurrentMediaPlaybackQueue, &previousMediaQueue)

	if instance.queueListsDontMatch(previousMediaQueue, currentMediaQueue) {
		utils.Write(instance._private.systemDataSource, core.Global_CurrentMediaPlaybackQueue, currentMediaQueue)
	}
	utils.Write(instance._private.systemDataSource, core.Global_MediaPlaybackState, mediaPlayerStatus.State)
	utils.Write(instance._private.systemDataSource, core.Global_ActiveTrackProgressInSeconds, mediaPlayerStatus.ElapsedTime)
	utils.Write(instance._private.systemDataSource, core.Global_ActiveTrackTotalDurationInSeconds, mediaPlayerStatus.TotalDuration)

	if mediaPlayerStatus.ActiveTrack.TrackName != "" {
		utils.Write(instance._private.systemDataSource, core.Global_ActiveTrack, mediaPlayerStatus.ActiveTrack)
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
