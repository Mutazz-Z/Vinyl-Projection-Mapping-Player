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

func (service *DisplayApplicationService) sendDataToProjectorForKnownTag(uid string) {
	retrievedAlbumRecord, err := service.libraryRepository.RetrieveAlbumByNfcIdentifier(uid)
	if err != nil {
		return
	}

	payload := core.VisualEffectPayload{
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
	service.systemDataSource.Write("GLOBAL_CurrentProjectorData", payload)
}

func (service *DisplayApplicationService) sendDataToProjectorForUnknownTag(uid string) {

	var host, port string
	service.systemDataSource.Read("GLOBAL_FlutterWebUrl", &host)
	service.systemDataSource.Read("GLOBAL_FlutterWebPort", &port)

	formattedUrl := fmt.Sprintf("http://%s:%s/?uid=%s", host, port, url.QueryEscape(uid))
	payload := core.VisualEffectPayload{
		Effect:           core.VisualEffectUnknown,
		UniqueIdentifier: uid,
		RegistrationURL:  formattedUrl,
	}
	service.systemDataSource.Write("GLOBAL_CurrentProjectorData", payload)
}

func (service *DisplayApplicationService) onDataSourceChanged(dataSourceChanged <-chan core.Event) {
	go core.ProcessDataSourceEvents(dataSourceChanged, func(args core.DataSourceChangedArgs) {

		switch args.Variable {
		case "GLOBAL_LastScannedNfcTag":
			uid, _ := args.Data.(string)
			if uid == "" {
				return
			}
			service.sendDataToProjectorForKnownTag(uid)

		case "GLOBAL_LastUnknownNfcTag":
			uid, _ := args.Data.(string)
			if uid == "" {
				return
			}
			service.sendDataToProjectorForUnknownTag(uid)

			// TODO: Playback service has a 1 second watchdog delay before it actually commits to stopping playback, we need to mirror that here
		case "GLOBAL_CurrentShelfStatus":
			status, _ := args.Data.(string)
			if status == "empty" {
				service.systemDataSource.Write("GLOBAL_CurrentProjectorData", core.VisualEffectPayload{Effect: core.VisualEffectStop})
			}

		case "GLOBAL_ActiveRecordPlaybackState":
			state, _ := args.Data.(string)
			if state == "error" {
				payload := core.VisualEffectPayload{
					Effect:       core.VisualEffectError,
					ErrorMessage: "Playback failed to start\n\nTarget device did not respond in time. Please check its connection and try again.",
				}
				service.systemDataSource.Write("GLOBAL_CurrentProjectorData", payload)
			}
		}
	})
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
	dataSourceChanged := service.systemDataSource.Subscribe("datasource")
	go service.onDataSourceChanged(dataSourceChanged)
	return nil
}

func (service *DisplayApplicationService) StopPlugin(applicationContext context.Context) error {
	return nil
}
