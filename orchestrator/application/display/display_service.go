/*
 * Packages and sends the data/visuals to be displayed on the projector
 */

package display

import (
	"fmt"
	"net/url"

	"vinyl-orchestrator/application/database"
	"vinyl-orchestrator/core"
	"vinyl-orchestrator/utils"
)

func (instance *DisplayApplicationService) sendDataToProjectorForKnownTag(uid string) {
	retrievedAlbumRecord := instance._private.AlbumLibrary.RetrieveAlbumByUid(uid)

	payload := core.ProjectorData_t{
		TagData:     retrievedAlbumRecord,
		PlayerState: core.PlayerState_Playing,
	}

	instance._private.systemDataSource.Write(core.Global_CurrentProjectorData, payload)
}

func (instance *DisplayApplicationService) sendDataToProjectorForUnknownTag(uid string) {

	var flutterUrl string
	instance._private.systemDataSource.Read(core.Global_FlutterWebUrl, &flutterUrl)

	if flutterUrl == "" {
		flutterUrl = utils.GetLocalIP()
	}

	formattedUrl := fmt.Sprintf("http://%s/?uid=%s", flutterUrl, url.QueryEscape(uid))
	unKnownTagQRCodeData := core.ProjectorData_t{
		PlayerState:    core.PlayerState_Unknown,
		TagData:        core.VinylRecordTagData_t{TagUid: uid},
		RegisterTagUrl: formattedUrl,
	}

	instance._private.systemDataSource.Write(core.Global_CurrentProjectorData, unKnownTagQRCodeData)
}

func (instance *DisplayApplicationService) onDataSourceChanged(dataSourceChanged <-chan database.Event) {
	go utils.ListenToDataSourceEvents(dataSourceChanged, func(args core.OnDataSourceChangedArgs_t) {

		switch args.Variable {

		case core.Global_LastKnownUidScanned:
			currentUid := args.Data.(string)

			instance.sendDataToProjectorForKnownTag(currentUid)

		case core.Global_LastUnknownUidScanned:
			lastUnknownUidScanned := args.Data.(string)

			instance.sendDataToProjectorForUnknownTag(lastUnknownUidScanned)

		case core.Global_CurrentShelfStatus:
			shelfStatus := args.Data.(core.ShelfStatus_t)
			if shelfStatus == core.ShelfStatus_Empty {
				fmt.Println("[Display Service]: Shelf is empty, clearing visuals")

				instance._private.systemDataSource.Write(core.Global_CurrentProjectorData, core.ProjectorData_t{PlayerState: core.PlayerState_Stopped})
			}

		case core.Global_MediaPlaybackState:
			mediaPlaybackState := args.Data.(core.MediaPlaybackState_t)
			
			if mediaPlaybackState.State == core.PlayerState_Error {
				errorMessageData := core.ProjectorData_t{
					PlayerState:  mediaPlaybackState.State,
					ErrorMessage: mediaPlaybackState.ErrorMessage,
				}
				instance._private.systemDataSource.Write(core.Global_CurrentProjectorData, errorMessageData)
			}
		}
	})
}

type DisplayApplicationService struct {
	_private struct {
		systemDataSource database.DataSource
		AlbumLibrary     database.AlbumLibrary
	}
}

func (instance *DisplayApplicationService) Init(dataSource database.DataSource, AlbumLibrary database.AlbumLibrary) {
	instance._private.systemDataSource = dataSource
	instance._private.AlbumLibrary = AlbumLibrary

	dataSourceChanged := instance._private.systemDataSource.Subscribe("datasource")
	go instance.onDataSourceChanged(dataSourceChanged)
}
