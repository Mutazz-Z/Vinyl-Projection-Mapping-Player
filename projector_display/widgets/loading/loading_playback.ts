(function () {
    function applyState(state: unknown): void {
        const numericState = Number(state);

        if (numericState === WidgetState.Loading) {
            void window.LoadingWidget?.loading?.();
            return;
        }

        if (numericState === WidgetState.Hide) {
            void window.LoadingWidget?.hide?.();
            return;
        }

        if (numericState === WidgetState.Idle) {
            window.LoadingWidget?.idle?.();
        }
    }

    async function init(dataSource: DataSource): Promise<void> {
        DataSource_OnChanged(dataSource, function (variable, data) {
            if (variable === Global_LoadingWidgetState) {
                applyState(data);
            }
        });

        const currentState = await DataSource_Read(dataSource, Global_LoadingWidgetState);
        applyState(currentState);
    }

    window.LoadingWidgetPlayback = { init };
})();
