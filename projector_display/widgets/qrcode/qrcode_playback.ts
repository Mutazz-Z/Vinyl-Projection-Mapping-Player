import { DataSource } from "../../js/datasource";
import { QrCodeData_t, WidgetState, Global_QrCodeWidgetData, Global_QrCodeWidgetState } from "../../types/state";

(function () {
    let currentQrCodeData: QrCodeData_t | null = null;
    let currentWidgetState: number = WidgetState.Hide;

    function showQrCodeWidget(): void {
        if (!currentQrCodeData || !currentQrCodeData.readyForDisplay) return;

        window.QrCodeWidget?.show?.(currentQrCodeData);
    }

    function applyData(data: unknown): void {
        currentQrCodeData = QrCodeData_t.fromJson(data);
    }

    function applyState(state: unknown): void {
        currentWidgetState = Number(state);

        if (currentWidgetState === WidgetState.Show) {
            showQrCodeWidget();
            return;
        }

        if (currentWidgetState === WidgetState.Hide) {
            window.QrCodeWidget?.hide?.();
        }
    }

    async function init(dataSource: DataSource): Promise<void> {
        dataSource.onStateChanged(function (variable, data) {
            switch (variable) {
                case Global_QrCodeWidgetData.key:
                    applyData(data);
                    break;
                case Global_QrCodeWidgetState:
                    applyState(data);
                    break;
            }
        });

        const currentData = await dataSource.read(Global_QrCodeWidgetData.key);
        applyData(currentData);

        const currentState = await dataSource.read(Global_QrCodeWidgetState);
        applyState(currentState);
    }

    window.QrCodeWidgetPlayback = { init };
})();
