package playback

import (
	"context"
	"fmt"
	"sync"
	"time"

	"vinyl-orchestrator/core"
)

type PlaybackApplicationService struct {
	systemDataSource  core.DataSource
	libraryRepository core.LibraryRepository
	activeMediaPlayer core.MediaPlayer

	playbackWatchdogTimer *time.Timer
	watchdogMutex         sync.Mutex
	WatchdogTimeout       time.Duration

	recordRemovedTimer   *time.Timer
	recordRemovedMutex   sync.Mutex
	recordRemovedTimeout time.Duration
}

func NewPlaybackApplicationService(mediaPlayer core.MediaPlayer) *PlaybackApplicationService {
	return &PlaybackApplicationService{
		activeMediaPlayer:    mediaPlayer,
		WatchdogTimeout:      10 * time.Second,
		recordRemovedTimeout: 1 * time.Second,
	}
}

func (service *PlaybackApplicationService) Name() string {
	return "Application_Playback_Coordinator"
}

func (service *PlaybackApplicationService) Init(dataSource core.DataSource, libraryRepository core.LibraryRepository) error {
	service.systemDataSource = dataSource
	service.libraryRepository = libraryRepository
	return nil
}

func (service *PlaybackApplicationService) StartPlugin(applicationContext context.Context) error {
	hardwareScannedChannel := service.systemDataSource.Subscribe("hardware_record_scanned")
	hardwareRemovedChannel := service.systemDataSource.Subscribe("hardware_record_removed")

	go service.listenForHardwareScanEvents(hardwareScannedChannel)
	go service.listenForHardwareRemoveEvents(hardwareRemovedChannel)
	go service.pollPlayerStateLoop(applicationContext)

	return nil
}

func (service *PlaybackApplicationService) listenForHardwareScanEvents(scannedChannel <-chan core.Event) {
	for incomingEvent := range scannedChannel {
		service.cancelRecordRemovedTimeout()
		scannedUniqueIdentifier, isString := incomingEvent.Payload.(string)
		if !isString {
			continue
		}

		retrievedAlbumRecord, retrievalError := service.libraryRepository.RetrieveAlbumByNfcIdentifier(scannedUniqueIdentifier)
		if retrievalError != nil {
			fmt.Printf("Playback Service: Unknown Tag %s, broadcasting for registration\n", scannedUniqueIdentifier)
			service.systemDataSource.Publish("hardware_record_unknown", scannedUniqueIdentifier)
			continue
		}

		fmt.Printf("Playback Service: Starting %s by %s\n", retrievedAlbumRecord.AlbumTitle, retrievedAlbumRecord.ArtistName)

		playbackError := service.activeMediaPlayer.PlayMedia(retrievedAlbumRecord.MediaResourceUri)
		if playbackError != nil {
			fmt.Printf("Playback Service Error: Media player rejected play command. (%v)\n", playbackError)
			continue
		}

		service.startPlaybackWatchdog()
	}
}

func (service *PlaybackApplicationService) listenForHardwareRemoveEvents(removedChannel <-chan core.Event) {
	for range removedChannel {
		service.cancelPlaybackWatchdog()
		service.startRecordRemovedWatchdog()
	}
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

	fmt.Println("Playback Service Error: Target device failed to respond within timeout window.")
	service.systemDataSource.Write("active_playback_state", "error")
	service.systemDataSource.Publish("playback_watchdog_timeout", nil)
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

	service.systemDataSource.Write("active_playback_state", playerStateString)

	if playerStateString == "playing" || playerStateString == "paused" {
		service.cancelPlaybackWatchdog()
	}
}

func (service *PlaybackApplicationService) StopPlugin(applicationContext context.Context) error {
	service.cancelPlaybackWatchdog()
	return nil
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
