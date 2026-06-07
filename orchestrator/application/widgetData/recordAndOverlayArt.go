package widgetdata

import (
	"vinyl-orchestrator/application/database"
	"vinyl-orchestrator/core"
	"vinyl-orchestrator/typedefs"
	"vinyl-orchestrator/utils"
)

func (instance *RecordAndOverlayArt) clearCurrentPlayingAlbumRecordAndOverlayArt() {
	clearRecordDesignData := typedefs.RecordDesignData_t{
		LabelDesign:     typedefs.LabelDesignData_t{},
		RingDesign:      typedefs.RingDesignData_t{},
		ReadyForDisplay: false,
	}

	clearOverlayData := typedefs.OverlayData_t{
		OverlayImage:    "",
		ReadyForDisplay: false,
	}

	utils.Write(instance._private.systemDataSource, core.Global_CurrentPlayingAlbumRecordDesign, clearRecordDesignData)
	utils.Write(instance._private.systemDataSource, core.Global_CurrentPlayingAlbumOverlay, clearOverlayData)
}

func (instance *RecordAndOverlayArt) updateCurrentPlayingAlbumRecordAndOverlayArt(currentUidScanned string) {
	retrievedAlbumRecord := instance._private.albumLibrary.RetrieveAlbumByUid(currentUidScanned)

	var labelUsesImage bool = false
	if retrievedAlbumRecord.LabelImage != "" {
		labelUsesImage = true
	}
	labelDesignData := typedefs.LabelDesignData_t{
		UsesImage:  labelUsesImage,
		LabelColor: retrievedAlbumRecord.LabelColor,
		LabelImage: retrievedAlbumRecord.LabelImage,
	}

	var OuterRingUsesImage bool = false
	if retrievedAlbumRecord.OuterRingImage != "" {
		OuterRingUsesImage = true
	}
	OuterRingDesignData := typedefs.RingDesignData_t{
		UsesImage:  OuterRingUsesImage,
		RingColor: retrievedAlbumRecord.OuterRingColor,
		RingImage: retrievedAlbumRecord.OuterRingImage,
	}

	recordDesignData := typedefs.RecordDesignData_t{
		LabelDesign:     labelDesignData,
		RingDesign:      OuterRingDesignData,
		ReadyForDisplay: true,
	}

	overlayData := typedefs.OverlayData_t{
		OverlayImage:    retrievedAlbumRecord.ProjectionOverlay,
		ReadyForDisplay: true,
	}
	
	utils.Write(instance._private.systemDataSource, core.Global_CurrentPlayingAlbumRecordDesign, recordDesignData)
	utils.Write(instance._private.systemDataSource, core.Global_CurrentPlayingAlbumOverlay, overlayData)
}

func (instance *RecordAndOverlayArt) onDataSourceChanged(dataSourceChanged <-chan database.Event) {
	go utils.ListenToDataSourceEvents(dataSourceChanged, func(args core.OnDataSourceChangedArgs_t) {

		switch args.Variable {
		case core.Global_LastKnownUidScanned.Key:
			currentUidScanned, _ := args.Data.(string)
			instance.updateCurrentPlayingAlbumRecordAndOverlayArt(currentUidScanned)

		case core.Global_CurrentShelfStatus.Key:
			currentShelfStatus, _ := args.Data.(typedefs.ShelfStatus_t)
			if currentShelfStatus == typedefs.ShelfStatus_Empty {
				instance.clearCurrentPlayingAlbumRecordAndOverlayArt()
			}

		}
	})
}

type RecordAndOverlayArt struct {
	_private struct {
		systemDataSource database.DataSource
		albumLibrary     database.AlbumLibrary
	}
}

func (instance *RecordAndOverlayArt) Init(dataSource database.DataSource, albumLibrary database.AlbumLibrary) {
	instance._private.systemDataSource = dataSource
	instance._private.albumLibrary = albumLibrary

	dsChannel := instance._private.systemDataSource.Subscribe("datasource")
	go instance.onDataSourceChanged(dsChannel)
}
