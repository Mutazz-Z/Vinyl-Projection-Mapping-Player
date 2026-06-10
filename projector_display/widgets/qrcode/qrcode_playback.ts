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
        DataSource_OnChanged(dataSource, function (variable, data) {
            switch (variable) {
                case Global_QrCodeWidgetData.key:
                    applyData(data);
                    break;
                case Global_QrCodeWidgetState:
                    applyState(data);
                    break;
            }
        });

        const currentData = await DataSource_Read(dataSource, Global_QrCodeWidgetData.key);
        applyData(currentData);

        const currentState = await DataSource_Read(dataSource, Global_QrCodeWidgetState);
        applyState(currentState);
    }

    window.QrCodeWidgetPlayback = { init };
})();
