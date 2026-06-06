package widgetdata

import (
	"vinyl-orchestrator/application/database"
	"vinyl-orchestrator/core"
	"vinyl-orchestrator/typedefs"
	"vinyl-orchestrator/utils"
)

func (instance *TitleAndArtist) updateCurrentPlayingAlbumTitleAndArtist(currentUidScanned string) {
	retrievedAlbumRecord := instance._private.albumLibrary.RetrieveAlbumByUid(currentUidScanned)

	currentTitleAndArtist := typedefs.TitleAndArtist_t{
		Title:  retrievedAlbumRecord.MediaTitle,
		Artist: retrievedAlbumRecord.Artist,
	}

	utils.Write(instance._private.systemDataSource, core.Global_CurrentPlayingAlbumTitleAndArtist, currentTitleAndArtist)
}

func (instance *TitleAndArtist) onDataSourceChanged(dataSourceChanged <-chan database.Event) {
	go utils.ListenToDataSourceEvents(dataSourceChanged, func(args core.OnDataSourceChangedArgs_t) {

		switch args.Variable {
		case core.Global_LastKnownUidScanned.Key:
			currentUidScanned, _ := args.Data.(string)
			instance.updateCurrentPlayingAlbumTitleAndArtist(currentUidScanned)

		}
	})
}

type TitleAndArtist struct {
	_private struct {
		systemDataSource database.DataSource
		albumLibrary     database.AlbumLibrary
	}
}

func (instance *TitleAndArtist) Init(dataSource database.DataSource, albumLibrary database.AlbumLibrary) {
	instance._private.systemDataSource = dataSource
	instance._private.albumLibrary = albumLibrary

	dsChannel := instance._private.systemDataSource.Subscribe("datasource")
	go instance.onDataSourceChanged(dsChannel)
}
