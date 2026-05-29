/*
 * Handles playback control and state management based on scanned NFC tags and shelf status.
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

func (service *PlaybackApplicationService) startPlaybackWatchdog() {
	service.watchdogMutex.Lock()
	defer service.watchdogMutex.Unlock()

	if service.playbackWatchdogTimer != nil {
		service.playbackWatchdogTimer.Stop()
	}
	service.playbackWatchdogTimer = time.AfterFunc(service.WatchdogTimeout, service.handleWatchdogTimeout)
}

func (service *PlaybackApplicationService) handleWatchdogTimeout() {
	service.watchdogMutex.Lock()
	defer service.watchdogMutex.Unlock()

	// TODO: Add visual error for communication failure
	fmt.Println("[Playback Service] Error: Target device failed to respond within timeout window.")
	service.systemDataSource.Write(core.Global_ActiveRecordPlaybackState, "error")
}

func (service *PlaybackApplicationService) cancelPlaybackWatchdog() {
	service.watchdogMutex.Lock()
	defer service.watchdogMutex.Unlock()

	if service.playbackWatchdogTimer != nil {
		service.playbackWatchdogTimer.Stop()
		service.playbackWatchdogTimer = nil
	}
}

func (service *PlaybackApplicationService) pollPlayerStateLoop(applicationContext context.Context) {
	pollingTicker := time.NewTicker(1 * time.Second)
	defer pollingTicker.Stop()

	for {
		select {
		case <-applicationContext.Done():
			return
		case <-pollingTicker.C:
			service.fetchAndPublishPlayerState()
		}
	}
}

func (service *PlaybackApplicationService) fetchAndPublishPlayerState() {
	playerStateString, fetchError := service.activeMediaPlayer.GetState()
	if fetchError != nil {
		return
	}
	service.systemDataSource.Write(core.Global_ActiveRecordPlaybackState, playerStateString)

	if playerStateString == "playing" || playerStateString == "paused" {
		service.cancelPlaybackWatchdog()
	}
}

func (service *PlaybackApplicationService) processScannedNfcTag(uid string) {

	if uid == "" {
		return
	}

	retrievedAlbumRecord, retrivalError := service.AlbumLibrary.RetrieveAlbumByUid(uid)
	if retrivalError != nil {
		fmt.Printf("[Playback Service]: Unknown Tag %s, writing to registry for registration\n", uid)
		service.systemDataSource.Write(core.Global_LastUnknownNfcTag, uid)
	} else {
		fmt.Printf("[Playback Service]: Starting %s by %s\n", retrievedAlbumRecord.MediaTitle, retrievedAlbumRecord.Artist)

		playbackError := service.activeMediaPlayer.PlayMedia(utils.GenerateUriForMedia(retrievedAlbumRecord.ItemId, retrievedAlbumRecord.Provider))
		if playbackError != nil {
			fmt.Printf("[Playback Service] Error: Media player rejected play command. (%v)\n", playbackError)
			return
		}
		service.startPlaybackWatchdog()
	}

}

func (service *PlaybackApplicationService) onDataSourceChanged(dataSourceChanged <-chan database.Event) {
	go utils.ListenToDataSourceEvents(dataSourceChanged, func(args core.OnDataSourceChangedArgs_t) {

		switch args.Variable {
		case core.Global_CurrentUidScanned:
			currentUid, _ := args.Data.(string)
			service.processScannedNfcTag(currentUid)

		case core.Global_CurrentShelfStatus:
			shelfStatus, _ := args.Data.(core.ShelfStatus_t)
			if shelfStatus == core.ShelfStatus_Empty {
				service.cancelPlaybackWatchdog()
				fmt.Println("[Playback Service]: Shelf is empty, stopping playback")
				service.activeMediaPlayer.StopMedia()
			}
		}
	})
}

type PlaybackApplicationService struct {
	systemDataSource  database.DataSource
	AlbumLibrary      database.AlbumLibrary
	activeMediaPlayer musicassistant.MediaPlayer

	playbackWatchdogTimer *time.Timer
	watchdogMutex         sync.Mutex
	WatchdogTimeout       time.Duration
}

func (service *PlaybackApplicationService) Init(dataSource database.DataSource, AlbumLibrary database.AlbumLibrary, mediaPlayer musicassistant.MediaPlayer) {
	service.systemDataSource = dataSource
	service.AlbumLibrary = AlbumLibrary
	service.activeMediaPlayer = mediaPlayer
	service.WatchdogTimeout = 15 * time.Second

	dsChannel := service.systemDataSource.Subscribe("datasource")
	go service.onDataSourceChanged(dsChannel)
	go service.pollPlayerStateLoop(context.Background())

}

func (service *PlaybackApplicationService) StopPlugin(applicationContext context.Context) error {
	service.cancelPlaybackWatchdog()
	return nil
}
