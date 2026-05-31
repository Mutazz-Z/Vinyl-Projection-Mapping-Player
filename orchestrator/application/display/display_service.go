/*
 * Packages and sends the data/visuals to be displayed on the projector
 */

package display

import (
	"fmt"
	"net/url"

	"vinyl-orchestrator/application/database"
	"vinyl-orchestrator/core"
	"vinyl-orchestrator/typedefs"

	"vinyl-orchestrator/utils"
)

func (instance *DisplayApplicationService) sendDataToProjectorForKnownTag(uid string) {
	retrievedAlbumRecord := instance._private.AlbumLibrary.RetrieveAlbumByUid(uid)

	payload := typedefs.ProjectorData_t{
		TagData:         retrievedAlbumRecord,
		VisualDataState: typedefs.VisualDataState_DisplayAlbumVisuals,
	}

	utils.Write(instance._private.systemDataSource, core.Global_CurrentProjectorData, payload)
}

func (instance *DisplayApplicationService) sendDataToProjectorForUnknownTag(uid string) {

	var flutterUrl string
	utils.Read(instance._private.systemDataSource, core.Global_FlutterWebUrl, &flutterUrl)

	if flutterUrl == "" {
		flutterUrl = utils.GetLocalIP()
	}

	formattedUrl := fmt.Sprintf("http://%s/?uid=%s", flutterUrl, url.QueryEscape(uid))
	unKnownTagQRCodeData := typedefs.ProjectorData_t{
		VisualDataState: typedefs.VisualDataState_DisplayTagRegistration,
		TagData:         typedefs.VinylRecordTagData_t{TagUid: uid},
		RegisterTagUrl:  formattedUrl,
	}

	utils.Write(instance._private.systemDataSource, core.Global_CurrentProjectorData, unKnownTagQRCodeData)
}

func (instance *DisplayApplicationService) handleGenericErrorMessagesBasedOnMediaPlayerState(mediaPlaybackState typedefs.MediaPlaybackState_t) {
	var errorMessage string
	switch mediaPlaybackState {
	case typedefs.PlayerState_Error:
		errorMessage = "An error occurred during media playback. Please check the target device and try again."

	case typedefs.PlayerState_Offline:
		errorMessage = "The target device is offline. Please check its connection and try again."
	}

	errorMessageData := typedefs.ProjectorData_t{
		VisualDataState: typedefs.VisualDataState_DisplayErrorMessage,
		ErrorMessage:    errorMessage,
	}
	utils.Write(instance._private.systemDataSource, core.Global_CurrentProjectorData, errorMessageData)
}

func (instance *DisplayApplicationService) onDataSourceChanged(dataSourceChanged <-chan database.Event) {
	go utils.ListenToDataSourceEvents(dataSourceChanged, func(args core.OnDataSourceChangedArgs_t) {

		switch args.Variable {

		case core.Global_LastKnownUidScanned.Key:
			currentUid := args.Data.(string)

			instance.sendDataToProjectorForKnownTag(currentUid)

		case core.Global_LastUnknownUidScanned.Key:
			lastUnknownUidScanned := args.Data.(string)

			instance.sendDataToProjectorForUnknownTag(lastUnknownUidScanned)

		case core.Global_CurrentShelfStatus.Key:
			shelfStatus := args.Data.(typedefs.ShelfStatus_t)
			if shelfStatus == typedefs.ShelfStatus_Empty {
				fmt.Println("[Display Service]: Shelf is empty, clearing visuals")

				utils.Write(instance._private.systemDataSource, core.Global_CurrentProjectorData, typedefs.ProjectorData_t{VisualDataState: typedefs.VisualDataState_DisplayIdle})
			}

		case core.Global_MediaPlaybackState.Key:
			mediaPlaybackState := args.Data.(typedefs.MediaPlaybackState_t)

			instance.handleGenericErrorMessagesBasedOnMediaPlayerState(mediaPlaybackState)

		case core.Global_DefinedProjectorErrorMessage.Key:
			errorMessage := args.Data.(string)

			errorMessageData := typedefs.ProjectorData_t{
				VisualDataState: typedefs.VisualDataState_DisplayErrorMessage,
				ErrorMessage:    errorMessage,
			}
			utils.Write(instance._private.systemDataSource, core.Global_CurrentProjectorData, errorMessageData)
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
