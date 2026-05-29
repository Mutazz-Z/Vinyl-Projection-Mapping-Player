package display

import (
	"context"
	"fmt"
	"net"
	"net/url"

	"vinyl-orchestrator/application/database"
	"vinyl-orchestrator/core"
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

	payload := core.ProjectorData_t{
		TagData:     retrievedAlbumRecord,
		PlayerState: core.PlayerState_Playing,
	}

	service.systemDataSource.Write(core.Global_CurrentProjectorData, payload)
}

func getLocalIP() string {
	conn, err := net.Dial("udp", "8.8.8.8:80")
	if err != nil {
		return "localhost"
	}
	defer conn.Close()
	localAddr := conn.LocalAddr().(*net.UDPAddr)
	return localAddr.IP.String()
}

func (service *DisplayApplicationService) sendDataToProjectorForUnknownTag(uid string) {

	var flutterUrl string
	service.systemDataSource.Read(core.Global_FlutterWebUrl, &flutterUrl)

	if flutterUrl == "localhost" || flutterUrl == "127.0.0.1" || flutterUrl == "" {
		flutterUrl = getLocalIP()
	}

	formattedUrl := fmt.Sprintf("http://%s/?uid=%s", flutterUrl, url.QueryEscape(uid))
	payload := core.ProjectorData_t{
		PlayerState:    core.PlayerState_Unknown,
		TagData:        core.VinylRecordTagData_t{TagUid: uid},
		RegisterTagUrl: formattedUrl,
	}

	service.systemDataSource.Write(core.Global_CurrentProjectorData, payload)
}

func (service *DisplayApplicationService) onDataSourceChanged(dataSourceChanged <-chan database.Event) {
	go utils.ListenToDataSourceEvents(dataSourceChanged, func(args core.OnDataSourceChangedArgs_t) {

		switch args.Variable {
		case core.Global_CurrentUidScanned:
			currentUid := args.Data.(string)
			if currentUid == "" {
				return
			}
			service.sendDataToProjectorForKnownTag(currentUid)

		case core.Global_LastUnknownNfcTag:
			lastUnKnownNfcTag := args.Data.(string)
			if lastUnKnownNfcTag == "" {
				return
			}
			service.sendDataToProjectorForUnknownTag(lastUnKnownNfcTag)

		case core.Global_CurrentShelfStatus:
			shelfStatus := args.Data.(core.ShelfStatus_t)
			if shelfStatus == core.ShelfStatus_Empty {
				service.systemDataSource.Write(core.Global_CurrentProjectorData, core.ProjectorData_t{PlayerState: core.PlayerState_Stopped})
			}

		case core.Global_ActiveRecordPlaybackState:
			activeRecordPlaybackState := args.Data.(string)
			if activeRecordPlaybackState == "error" {
				dataToSend := core.ProjectorData_t{
					PlayerState:  core.PlayerState_Error,
					ErrorMessage: "Playback failed to start\n\nTarget device did not respond in time. Please check its connection and try again.",
				}
				service.systemDataSource.Write(core.Global_CurrentProjectorData, dataToSend)
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
