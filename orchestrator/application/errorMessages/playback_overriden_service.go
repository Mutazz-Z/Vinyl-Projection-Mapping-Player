/*
 * Detects playback hijack conditions and publishes projector-facing error messages
 */

package errorMessages

import (
	"vinyl-orchestrator/application/database"
	"vinyl-orchestrator/core"
	"vinyl-orchestrator/typedefs"
	"vinyl-orchestrator/utils"
)

func (instance *PlaybackOverridenService) playbackisActive() bool {
	var mediaPlaybackState typedefs.MediaPlaybackState_t
	utils.Read(instance._private.systemDataSource, core.Global_MediaPlaybackState, &mediaPlaybackState)

	return mediaPlaybackState == typedefs.PlayerState_Playing || mediaPlaybackState == typedefs.PlayerState_Paused
}

func (instance *PlaybackOverridenService) sendMediaOverridedErrormessage() {

	errorMessage := "Playback Overrided... \n\nThe currently playing album does not match the scanned album. Please ensure the correct album is playing and try again."
	utils.Write(instance._private.systemDataSource, core.Global_DefinedProjectorErrorMessage, errorMessage)
}

func (instance *PlaybackOverridenService) compareCurrentlyPlayingAlbumAgainstExpected() {
	var activeTrack typedefs.ActiveTrack_t
	utils.Read(instance._private.systemDataSource, core.Global_ActiveTrack, &activeTrack)

	if activeTrack.AlbumItemId != instance._private.expectedAlbumRecord.ItemId && instance.playbackisActive() {
		instance.sendMediaOverridedErrormessage()
	}

}

func (instance *PlaybackOverridenService) getExpectedAlbum(uid string) {
	retrievedAlbumRecord := instance._private.AlbumLibrary.RetrieveAlbumByUid(uid)
	instance._private.expectedAlbumRecord = retrievedAlbumRecord
}

func (instance *PlaybackOverridenService) onDataSourceChanged(dataSourceChanged <-chan database.Event) {
	go utils.ListenToDataSourceEvents(dataSourceChanged, func(args core.OnDataSourceChangedArgs_t) {
		switch args.Variable {
		case core.Global_LastKnownUidScanned.Key:
			uid := args.Data.(typedefs.UidScanned_t)
			
			instance.getExpectedAlbum(uid.Uid)

		case core.Global_ActiveTrack.Key:
			instance.compareCurrentlyPlayingAlbumAgainstExpected()
		}
	})
}

type PlaybackOverridenService struct {
	_private struct {
		systemDataSource            database.DataSource
		AlbumLibrary                database.AlbumLibrary
		expectedAlbumRecord         typedefs.VinylRecordTagData_t
	}
}

func (instance *PlaybackOverridenService) Init(dataSource database.DataSource, AlbumLibrary database.AlbumLibrary) {
	instance._private.systemDataSource = dataSource
	instance._private.AlbumLibrary = AlbumLibrary

	dataSourceChanged := instance._private.systemDataSource.Subscribe("datasource")
	go instance.onDataSourceChanged(dataSourceChanged)
}
