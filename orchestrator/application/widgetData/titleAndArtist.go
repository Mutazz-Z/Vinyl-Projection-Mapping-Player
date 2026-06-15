package widgetdata

import (
	"vinyl-orchestrator/application/database"
	"vinyl-orchestrator/core"
	"vinyl-orchestrator/typedefs"
	"vinyl-orchestrator/utils"
)

func (instance *TitleAndArtist_t) clearCurrentPlayingAlbumTitleAndArtist() {
	currentTitleAndArtist := typedefs.TitleAndArtist_t{
		Title:           "",
		Artist:          "",
		ReadyForDisplay: false,
	}

	utils.Write(instance._private.systemDataSource, core.Global_InfoWidgetData, currentTitleAndArtist)
}

func (instance *TitleAndArtist_t) updateCurrentPlayingAlbumTitleAndArtist(currentUidScanned string) {
	retrievedAlbumRecord := instance._private.albumLibrary.RetrieveAlbumByUid(currentUidScanned)

	currentTitleAndArtist := typedefs.TitleAndArtist_t{
		Title:           retrievedAlbumRecord.MediaTitle,
		Artist:          retrievedAlbumRecord.Artist,
		ReadyForDisplay: true,
	}

	utils.Write(instance._private.systemDataSource, core.Global_InfoWidgetData, currentTitleAndArtist)
}

func (instance *TitleAndArtist_t) onDataSourceChanged(dataSourceChanged <-chan database.Event) {
	go utils.ListenToDataSourceEvents(dataSourceChanged, func(args core.OnDataSourceChangedArgs_t) {

		switch args.Variable {
		case core.Global_CurrentShelfStatus.Key:
			currentShelfStatus, _ := args.Data.(typedefs.ShelfStatus_t)
			if currentShelfStatus == typedefs.ShelfStatus_Empty {
				instance.clearCurrentPlayingAlbumTitleAndArtist()
			}

		case core.Global_LastKnownUidScanned.Key:
			currentUidScanned, _ := args.Data.(typedefs.UidScanned_t)
			instance.updateCurrentPlayingAlbumTitleAndArtist(currentUidScanned.Uid)

		}
	})
}

type TitleAndArtist_t struct {
	_private struct {
		systemDataSource database.DataSource
		albumLibrary     database.AlbumLibrary
	}
}

func (instance *TitleAndArtist_t) Init(dataSource database.DataSource, albumLibrary database.AlbumLibrary) {
	instance._private.systemDataSource = dataSource
	instance._private.albumLibrary = albumLibrary

	dsChannel := instance._private.systemDataSource.Subscribe("datasource")
	go instance.onDataSourceChanged(dsChannel)
}
