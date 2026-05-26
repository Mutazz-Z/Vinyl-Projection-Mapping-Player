package playback

import (
	"context"
	"fmt"
	"sync"
	"time"

	"vinyl-orchestrator/core"
	"vinyl-orchestrator/utils"
)

type PlaybackApplicationService struct {
	systemDataSource  core.DataSource
	AlbumLibrary      core.AlbumLibrary
	activeMediaPlayer core.MediaPlayer

	playbackWatchdogTimer *time.Timer
	watchdogMutex         sync.Mutex
	WatchdogTimeout       time.Duration

	recordRemovedTimer   *time.Timer
	recordRemovedMutex   sync.Mutex
	recordRemovedTimeout time.Duration
}

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
	fmt.Println("Playback Service Error: Target device failed to respond within timeout window.")
	service.systemDataSource.Write("GLOBAL_ActiveRecordPlaybackState", "error")
}

func (service *PlaybackApplicationService) cancelPlaybackWatchdog() {
	service.watchdogMutex.Lock()
	defer service.watchdogMutex.Unlock()

	if service.playbackWatchdogTimer != nil {
		service.playbackWatchdogTimer.Stop()
		service.playbackWatchdogTimer = nil
	}
}

func (service *PlaybackApplicationService) cancelRecordRemovedTimeout() {
	service.recordRemovedMutex.Lock()
	defer service.recordRemovedMutex.Unlock()

	if service.recordRemovedTimer != nil {
		service.recordRemovedTimer.Stop()
		service.recordRemovedTimer = nil
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
	service.systemDataSource.Write("GLOBAL_ActiveRecordPlaybackState", playerStateString)

	if playerStateString == "playing" || playerStateString == "paused" {
		service.cancelPlaybackWatchdog()
	}
}

func (service *PlaybackApplicationService) startRecordRemovedWatchdog() {
	service.recordRemovedMutex.Lock()
	defer service.recordRemovedMutex.Unlock()

	if service.recordRemovedTimer != nil {
		service.recordRemovedTimer.Stop()
	}

	fmt.Printf("Playback Service: Record removed, stopping playback in %v second(s)...\n", service.recordRemovedTimeout.Seconds())
	service.recordRemovedTimer = time.AfterFunc(service.recordRemovedTimeout, func() {
		service.activeMediaPlayer.StopMedia()
	})
}

func (service *PlaybackApplicationService) processScannedNfcTag(uid string) {
	service.cancelRecordRemovedTimeout()

	retrievedAlbumRecord, error := service.AlbumLibrary.RetrieveAlbumByNfcIdentifier(uid)
	if error != nil {
		fmt.Printf("Playback Service: Unknown Tag %s, writing to registry for registration\n", uid)
		service.systemDataSource.Write("GLOBAL_LastUnknownNfcTag", uid)
		return
	}

	fmt.Printf("Playback Service: Starting %s by %s\n", retrievedAlbumRecord.MediaTitle, retrievedAlbumRecord.Artist)

	playbackError := service.activeMediaPlayer.PlayMedia(utils.GenerateUriForMedia(retrievedAlbumRecord.ItemId, retrievedAlbumRecord.Provider))
	if playbackError != nil {
		fmt.Printf("Playback Service Error: Media player rejected play command. (%v)\n", playbackError)
		return
	}
	service.startPlaybackWatchdog()
}

func (service *PlaybackApplicationService) onDataSourceChanged(dataSourceChanged <-chan core.Event) {
	go utils.ListenToDataSourceEvents(dataSourceChanged, func(args core.DataSourceChangedArgs) {

		switch args.Variable {
		case "GLOBAL_LastScannedNfcTag":
			uid, _ := args.Data.(string)
			if uid == "" {
				return
			}
			service.processScannedNfcTag(uid)

		case "GLOBAL_CurrentShelfStatus":
			status, _ := args.Data.(string)
			if status == "empty" {
				service.cancelPlaybackWatchdog()
				service.startRecordRemovedWatchdog()
			}
		}
	})
}

func NewPlaybackApplicationService(mediaPlayer core.MediaPlayer) *PlaybackApplicationService {
	return &PlaybackApplicationService{
		activeMediaPlayer:    mediaPlayer,
		WatchdogTimeout:      30 * time.Second,
		recordRemovedTimeout: 1 * time.Second,
	}
}

func (service *PlaybackApplicationService) Name() string {
	return "Application_Playback_Coordinator"
}

func (service *PlaybackApplicationService) Init(dataSource core.DataSource, AlbumLibrary core.AlbumLibrary) error {
	service.systemDataSource = dataSource
	service.AlbumLibrary = AlbumLibrary
	return nil
}

func (service *PlaybackApplicationService) StartPlugin(applicationContext context.Context) error {
	dsChannel := service.systemDataSource.Subscribe("datasource")
	go service.onDataSourceChanged(dsChannel)
	go service.pollPlayerStateLoop(applicationContext)
	return nil
}

func (service *PlaybackApplicationService) StopPlugin(applicationContext context.Context) error {
	service.cancelPlaybackWatchdog()
	return nil
}
