package display

import (
	"context"
	"fmt"
	"net/url"

	"vinyl-orchestrator/core"
)

type DisplayApplicationService struct {
	systemDataSource  core.DataSource
	libraryRepository core.LibraryRepository
}

func NewDisplayApplicationService() *DisplayApplicationService {
	return &DisplayApplicationService{}
}

func (service *DisplayApplicationService) Name() string {
	return "Application_Display_Coordinator"
}

func (service *DisplayApplicationService) Init(dataSource core.DataSource, libraryRepository core.LibraryRepository) error {
	service.systemDataSource = dataSource
	service.libraryRepository = libraryRepository
	return nil
}

func (service *DisplayApplicationService) StartPlugin(applicationContext context.Context) error {
	hardwareScannedChannel := service.systemDataSource.Subscribe("hardware_record_scanned")
	hardwareUnknownChannel := service.systemDataSource.Subscribe("hardware_record_unknown")
	hardwareRemovedChannel := service.systemDataSource.Subscribe("hardware_record_removed")
	playbackTimeoutChannel := service.systemDataSource.Subscribe("playback_watchdog_timeout")

	go service.listenForKnownRecordEvents(hardwareScannedChannel)
	go service.listenForUnknownRecordEvents(hardwareUnknownChannel)
	go service.listenForRecordRemovedEvents(hardwareRemovedChannel)
	go service.listenForPlaybackTimeoutEvents(playbackTimeoutChannel)

	return nil
}

func (service *DisplayApplicationService) listenForKnownRecordEvents(scannedChannel <-chan core.Event) {
	for incomingEvent := range scannedChannel {
		scannedUniqueIdentifier, isString := incomingEvent.Payload.(string)
		if !isString {
			continue
		}

		retrievedAlbumRecord, retrievalError := service.libraryRepository.RetrieveAlbumByNfcIdentifier(scannedUniqueIdentifier)
		if retrievalError != nil {
			continue
		}

		visualPayload := core.VisualEffectPayload{
			Effect:           core.VisualEffectPlay,
			ArtistName:       retrievedAlbumRecord.ArtistName,
			AlbumTitle:       retrievedAlbumRecord.AlbumTitle,
			TrackList:        retrievedAlbumRecord.TrackList,
			MediaResourceUri: retrievedAlbumRecord.MediaResourceUri,
			InnerRecordColor: retrievedAlbumRecord.InnerRecordColor,
			InnerRecordImage: retrievedAlbumRecord.InnerRecordImage,
			OuterDesignColor: retrievedAlbumRecord.OuterDesignColor,
			OuterDesignImage: retrievedAlbumRecord.OuterDesignImage,
			OverlayArt:       retrievedAlbumRecord.OverlayArt,
			AlbumCoverArt:    retrievedAlbumRecord.AlbumCoverArt,
		}

		service.systemDataSource.Publish("projector_visual_update", visualPayload)
	}
}

func (service *DisplayApplicationService) listenForUnknownRecordEvents(unknownChannel <-chan core.Event) {
	for incomingEvent := range unknownChannel {
		unknownUniqueIdentifier, isString := incomingEvent.Payload.(string)
		if !isString {
			continue
		}

		var registrationHostAddress string
		var registrationHostPort string

		service.systemDataSource.Read("registration_host_address", &registrationHostAddress)
		service.systemDataSource.Read("registration_host_port", &registrationHostPort)

		if registrationHostAddress == "" {
			registrationHostAddress = "127.0.0.1"
		}
		if registrationHostPort == "" {
			registrationHostPort = "8080"
		}

		formattedRegistrationUrl := fmt.Sprintf("http://%s:%s/?uid=%s", registrationHostAddress, registrationHostPort, url.QueryEscape(unknownUniqueIdentifier))

		visualPayload := core.VisualEffectPayload{
			Effect:           core.VisualEffectUnknown,
			UniqueIdentifier: unknownUniqueIdentifier,
			RegistrationURL:  formattedRegistrationUrl,
		}

		service.systemDataSource.Publish("projector_visual_update", visualPayload)
	}
}

func (service *DisplayApplicationService) listenForRecordRemovedEvents(removedChannel <-chan core.Event) {
	for range removedChannel {
		visualPayload := core.VisualEffectPayload{
			Effect: core.VisualEffectStop,
		}
		service.systemDataSource.Publish("projector_visual_update", visualPayload)
	}
}

func (service *DisplayApplicationService) listenForPlaybackTimeoutEvents(timeoutChannel <-chan core.Event) {
	for range timeoutChannel {
		visualPayload := core.VisualEffectPayload{
			Effect:       core.VisualEffectError,
			ErrorMessage: "Playback failed to start\n\nTarget device did not respond in time. Please check its connection and try again.",
		}
		service.systemDataSource.Publish("projector_visual_update", visualPayload)
	}
}

func (service *DisplayApplicationService) StopPlugin(applicationContext context.Context) error {
	return nil
}