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
	instance._private.playbackWatchdogTimer = time.AfterFunc(instance._private.WatchdogTimeout, instance.onWatchdogTimeout)
}

func (instance *PlaybackApplicationService) onWatchdogTimeout() {
	instance._private.watchdogMutex.Lock()
	defer instance._private.watchdogMutex.Unlock()

	var mediaPlayerState core.MediaPlaybackState_t
	instance._private.systemDataSource.Read(core.Global_MediaPlaybackState, &mediaPlayerState)

	if mediaPlayerState == core.PlayerState_Playing || mediaPlayerState == core.PlayerState_Paused {
		return
	}

	fmt.Println("[Playback Service] Error: Target device failed to respond within timeout window.")

	sendTimeoutErrorMessage := "Playback failed to start\n\nTarget device did not respond in time. Please check its connection and try again."
	instance._private.systemDataSource.Write(core.Global_DefinedProjectorErrorMessage, sendTimeoutErrorMessage)
}

func (instance *PlaybackApplicationService) cancelPlaybackWatchdog() {
	instance._private.watchdogMutex.Lock()
	defer instance._private.watchdogMutex.Unlock()

	if instance._private.playbackWatchdogTimer != nil {
		instance._private.playbackWatchdogTimer.Stop()
		instance._private.playbackWatchdogTimer = nil
	}
}

func (instance *PlaybackApplicationService) processScannedNfcTag(uid string) {
	retrievedAlbumRecord := instance._private.albumLibrary.RetrieveAlbumByUid(uid)

	fmt.Printf("[Playback Service]: Starting %s by %s\n", retrievedAlbumRecord.MediaTitle, retrievedAlbumRecord.Artist)

	playbackError := instance._private.mediaPlayer.PlayMedia(utils.GenerateUriForMedia(retrievedAlbumRecord.ItemId, retrievedAlbumRecord.Provider))
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
				instance._private.mediaPlayer.StopMedia()
			}
		}
	})
}

type PlaybackApplicationService struct {
	_private struct {
		systemDataSource database.DataSource
		albumLibrary     database.AlbumLibrary
		mediaPlayer      musicassistant.MusicAssistantPlayer_t

		playbackWatchdogTimer *time.Timer
		watchdogMutex         sync.Mutex
		WatchdogTimeout       time.Duration
	}
}

func (instance *PlaybackApplicationService) Init(dataSource database.DataSource, albumLibrary database.AlbumLibrary, mediaPlayer musicassistant.MusicAssistantPlayer_t) {
	instance._private.systemDataSource = dataSource
	instance._private.albumLibrary = albumLibrary
	instance._private.mediaPlayer = mediaPlayer
	instance._private.WatchdogTimeout = 15 * time.Second

	dsChannel := instance._private.systemDataSource.Subscribe("datasource")
	go instance.onDataSourceChanged(dsChannel)
}

func (instance *PlaybackApplicationService) StopPlugin(applicationContext context.Context) {
	instance.cancelPlaybackWatchdog()
}
