/*
 * Handles media playback control based on scanned NFC tags and shelf status
 */

package playback

import (
	"context"
	"fmt"
	"sync"
	"time"

	"vinyl-orchestrator/application/database"
	"vinyl-orchestrator/application/musicassistant"
	"vinyl-orchestrator/core"
	"vinyl-orchestrator/utils"
)

func (instance *PlaybackApplicationService) startPlaybackWatchdog() {
	instance._private.watchdogMutex.Lock()
	defer instance._private.watchdogMutex.Unlock()

	if instance._private.playbackWatchdogTimer != nil {
		instance._private.playbackWatchdogTimer.Stop()
	}
	instance._private.playbackWatchdogTimer = time.AfterFunc(instance._private.WatchdogTimeout, instance.handleWatchdogTimeout)
}

func (instance *PlaybackApplicationService) handleWatchdogTimeout() {
	instance._private.watchdogMutex.Lock()
	defer instance._private.watchdogMutex.Unlock()

	fmt.Println("[Playback Service] Error: Target device failed to respond within timeout window.")

	sendTimeoutErrorMessage := core.MediaPlaybackState_t{
		State:       core.PlayerState_Error,
		ErrorMessage: "Playback failed to start\n\nTarget device did not respond in time. Please check its connection and try again.",
	}
	instance._private.systemDataSource.Write(core.Global_MediaPlaybackState, sendTimeoutErrorMessage)
}

func (instance *PlaybackApplicationService) cancelPlaybackWatchdog() {
	instance._private.watchdogMutex.Lock()
	defer instance._private.watchdogMutex.Unlock()

	if instance._private.playbackWatchdogTimer != nil {
		instance._private.playbackWatchdogTimer.Stop()
		instance._private.playbackWatchdogTimer = nil
	}
}

func (instance *PlaybackApplicationService) pollPlayerStateLoop(applicationContext context.Context) {
	pollingTicker := time.NewTicker(1 * time.Second)
	defer pollingTicker.Stop()

	for {
		select {
		case <-applicationContext.Done():
			return
		case <-pollingTicker.C:
			instance.pollAndUpdatePlayerState()
		}
	}
}

func (instance *PlaybackApplicationService) pollAndUpdatePlayerState() {
	playerState, fetchError := instance._private.activeMediaPlayer.UpdateState()
	if fetchError != nil {
		return
	}

	if playerState == core.PlayerState_Playing || playerState == core.PlayerState_Paused {
		instance.cancelPlaybackWatchdog()
	}
}

func (instance *PlaybackApplicationService) processScannedNfcTag(uid string) {
	retrievedAlbumRecord := instance._private.AlbumLibrary.RetrieveAlbumByUid(uid)

	fmt.Printf("[Playback Service]: Starting %s by %s\n", retrievedAlbumRecord.MediaTitle, retrievedAlbumRecord.Artist)

	playbackError := instance._private.activeMediaPlayer.PlayMedia(utils.GenerateUriForMedia(retrievedAlbumRecord.ItemId, retrievedAlbumRecord.Provider))
	if playbackError != nil {
		fmt.Printf("[Playback Service] Error: Media player rejected play command. (%v)\n", playbackError)
		return
	}
	instance.startPlaybackWatchdog()
}

func (instance *PlaybackApplicationService) onDataSourceChanged(dataSourceChanged <-chan database.Event) {
	go utils.ListenToDataSourceEvents(dataSourceChanged, func(args core.OnDataSourceChangedArgs_t) {

		switch args.Variable {
		case core.Global_LastKnownUidScanned:
			currentUid, _ := args.Data.(string)
			instance.processScannedNfcTag(currentUid)

		case core.Global_CurrentShelfStatus:
			shelfStatus, _ := args.Data.(core.ShelfStatus_t)
			if shelfStatus == core.ShelfStatus_Empty {
				instance.cancelPlaybackWatchdog()
				fmt.Println("[Playback Service]: Shelf is empty, stopping playback")
				instance._private.activeMediaPlayer.StopMedia()
			}
		}
	})
}

type PlaybackApplicationService struct {
	_private struct {
		systemDataSource  database.DataSource
		AlbumLibrary      database.AlbumLibrary
		activeMediaPlayer musicassistant.MediaPlayer

		playbackWatchdogTimer *time.Timer
		watchdogMutex         sync.Mutex
		WatchdogTimeout       time.Duration
	}
}

func (instance *PlaybackApplicationService) Init(dataSource database.DataSource, AlbumLibrary database.AlbumLibrary, mediaPlayer musicassistant.MediaPlayer) {
	instance._private.systemDataSource = dataSource
	instance._private.AlbumLibrary = AlbumLibrary
	instance._private.activeMediaPlayer = mediaPlayer
	instance._private.WatchdogTimeout = 15 * time.Second

	dsChannel := instance._private.systemDataSource.Subscribe("datasource")
	go instance.onDataSourceChanged(dsChannel)
	go instance.pollPlayerStateLoop(context.Background())

}

func (instance *PlaybackApplicationService) StopPlugin(applicationContext context.Context) error {
	instance.cancelPlaybackWatchdog()
	return nil
}
