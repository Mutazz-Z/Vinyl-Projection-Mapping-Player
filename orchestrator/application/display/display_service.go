package display

import (
	"context"
	"fmt"
	"net/url"

	"vinyl-orchestrator/application/database"
	typedefinitions "vinyl-orchestrator/type_definitions"
	"vinyl-orchestrator/utils"
)

type DisplayApplicationService struct {
	systemDataSource database.DataSource
	AlbumLibrary     database.AlbumLibrary
}

func (service *DisplayApplicationService) sendDataToProjectorForKnownTag(uid string) {
	retrievedAlbumRecord, err := service.AlbumLibrary.RetrieveAlbumByNfcIdentifier(uid)
	if err != nil {
		return
	}

	payload := typedefinitions.ProjectorData{
		TagData:     retrievedAlbumRecord,
		PlayerState: typedefinitions.PlayerState_Playing,
	}
	service.systemDataSource.Write("GLOBAL_CurrentProjectorData", payload)
}

func (service *DisplayApplicationService) sendDataToProjectorForUnknownTag(uid string) {

	var host, port string
	service.systemDataSource.Read("GLOBAL_FlutterWebUrl", &host)
	service.systemDataSource.Read("GLOBAL_FlutterWebPort", &port)

	formattedUrl := fmt.Sprintf("http://%s:%s/?uid=%s", host, port, url.QueryEscape(uid))
	payload := typedefinitions.ProjectorData{
		PlayerState:    typedefinitions.PlayerState_Unknown,
		TagData:        typedefinitions.VinylRecordTagData{TagUid: uid},
		RegisterTagUrl: formattedUrl,
	}
	service.systemDataSource.Write("GLOBAL_CurrentProjectorData", payload)
}

func (service *DisplayApplicationService) onDataSourceChanged(dataSourceChanged <-chan database.Event) {
	go utils.ListenToDataSourceEvents(dataSourceChanged, func(args database.DataSourceChangedArgs) {

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
				service.systemDataSource.Write("GLOBAL_CurrentProjectorData", typedefinitions.ProjectorData{PlayerState: typedefinitions.PlayerState_Stopped})
			}

		case "GLOBAL_ActiveRecordPlaybackState":
			state, _ := args.Data.(string)
			if state == "error" {
				dataToSend := typedefinitions.ProjectorData{
					PlayerState:  typedefinitions.PlayerState_Error,
					ErrorMessage: "Playback failed to start\n\nTarget device did not respond in time. Please check its connection and try again.",
				}
				service.systemDataSource.Write("GLOBAL_CurrentProjectorData", dataToSend)
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

func (service *DisplayApplicationService) Init(dataSource database.DataSource, AlbumLibrary database.AlbumLibrary) error {
	service.systemDataSource = dataSource
	service.AlbumLibrary = AlbumLibrary
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
