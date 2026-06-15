package widgetdata

import (
	"fmt"
	"net/url"
	"vinyl-orchestrator/application/database"
	"vinyl-orchestrator/core"
	"vinyl-orchestrator/typedefs"
	"vinyl-orchestrator/utils"
)

func (instance *QrCode_t) clearQrCodeWidgetData() {
	clearedQrCodeWidgetData := typedefs.QrCodeData_t{
		RegistrationUrl: "",
		ReadyForDisplay: false,
	}

	utils.Write(instance._private.systemDataSource, core.Global_QrCodeWidgetData, clearedQrCodeWidgetData)
}

func (instance *QrCode_t) updateQrCodeWidgetData(uid string) {
	var flutterUrl string
	utils.Read(instance._private.systemDataSource, core.Global_FlutterWebUrl, &flutterUrl)

	if flutterUrl == "" {
		flutterUrl = utils.GetLocalIP()
	}

	formattedUrl := fmt.Sprintf("http://%s/?uid=%s", flutterUrl, url.QueryEscape(uid))
	unKnownTagQRCodeData := typedefs.QrCodeData_t{
		RegistrationUrl: formattedUrl,
		Uid:             uid,
		ReadyForDisplay: true,
	}

	utils.Write(instance._private.systemDataSource, core.Global_QrCodeWidgetData, unKnownTagQRCodeData)
}

func (instance *QrCode_t) onDataSourceChanged(dataSourceChanged <-chan database.Event) {
	go utils.ListenToDataSourceEvents(dataSourceChanged, func(args core.OnDataSourceChangedArgs_t) {
		switch args.Variable {
		case core.Global_CurrentShelfStatus.Key:
			currentShelfStatus, _ := args.Data.(typedefs.ShelfStatus_t)
			if currentShelfStatus == typedefs.ShelfStatus_Empty {
				instance.clearQrCodeWidgetData()
			}

		case core.Global_LastUnknownUidScanned.Key:
			lastUnknownUidScanned, _ := args.Data.(typedefs.UidScanned_t)
			instance.updateQrCodeWidgetData(lastUnknownUidScanned.Uid)
		}
	})
}

type QrCode_t struct {
	_private struct {
		systemDataSource database.DataSource
	}
}

func (instance *QrCode_t) Init(dataSource database.DataSource) {
	instance._private.systemDataSource = dataSource

	onDataSourceChangedSubscription := instance._private.systemDataSource.Subscribe("datasource")
	go instance.onDataSourceChanged(onDataSourceChangedSubscription)
}
