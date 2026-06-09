(function () {
    function applyData(data: unknown): void {
        window.OverlayWidget?.updateData?.(OverlayData_t.fromJson(data));
    }

    function applyState(state: unknown): void {
        const numericState = Number(state);
        if (numericState === WidgetState.Show) {
            window.OverlayWidget?.show?.();
        } else if (numericState === WidgetState.Hide) {
            window.OverlayWidget?.hide?.();
        }
    }

    async function init(dataSource: DataSource): Promise<void> {
        DataSource_OnChanged(dataSource, function (variable, data) {
            switch (variable) {
                case Global_OverlayWidgetData.key:
                    applyData(data);
                    break;
                case Global_OverlayWidgetState:
                    applyState(data);
                    break;
            }
        });

        const currentData = await DataSource_Read(dataSource, Global_OverlayWidgetData.key);
        applyData(currentData);

        const currentState = await DataSource_Read(dataSource, Global_OverlayWidgetState);
        applyState(currentState);
    }

    window.OverlayWidgetPlayback = { init };
})();
