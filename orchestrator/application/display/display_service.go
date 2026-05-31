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
		TagData:         retrievedAlbumRecord,
		VisualDataState: core.VisualDataState_DisplayAlbumVisuals,
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
		VisualDataState: core.VisualDataState_DisplayTagRegistration,
		TagData:         core.VinylRecordTagData_t{TagUid: uid},
		RegisterTagUrl:  formattedUrl,
	}

	instance._private.systemDataSource.Write(core.Global_CurrentProjectorData, unKnownTagQRCodeData)
}

func (instance *DisplayApplicationService) handleGenericErrorMessagesBasedOnMediaPlayerState(mediaPlaybackState core.MediaPlaybackState_t) {
	var errorMessage string
	switch mediaPlaybackState {
	case core.PlayerState_Error:
		errorMessage = "An error occurred during media playback. Please check the target device and try again."

	case core.PlayerState_Offline:
		errorMessage = "The target device is offline. Please check its connection and try again."
	}

	errorMessageData := core.ProjectorData_t{
		VisualDataState: core.VisualDataState_DisplayErrorMessage,
		ErrorMessage:    errorMessage,
	}
	instance._private.systemDataSource.Write(core.Global_CurrentProjectorData, errorMessageData)
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

				instance._private.systemDataSource.Write(core.Global_CurrentProjectorData, core.ProjectorData_t{VisualDataState: core.VisualDataState_DisplayIdle})
			}

		case core.Global_MediaPlaybackState:
			mediaPlaybackState := args.Data.(core.MediaPlaybackState_t)

			instance.handleGenericErrorMessagesBasedOnMediaPlayerState(mediaPlaybackState)

		case core.Global_DefinedProjectorErrorMessage:
			errorMessage := args.Data.(string)

			errorMessageData := core.ProjectorData_t{
				VisualDataState: core.VisualDataState_DisplayErrorMessage,
				ErrorMessage:    errorMessage,
			}
			instance._private.systemDataSource.Write(core.Global_CurrentProjectorData, errorMessageData)
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
