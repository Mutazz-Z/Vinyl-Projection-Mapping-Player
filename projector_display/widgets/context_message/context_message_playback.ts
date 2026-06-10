(function () {
    let currentMessage = '';

    function applyData(data: unknown): void {
        currentMessage = typeof data === 'string' ? data : '';
    }

    function applyState(state: unknown): void {
        const numericState = Number(state);

        if (numericState === WidgetState.Show) {
            window.ContextMessageWidget?.show?.(currentMessage);
            return;
        }

        if (numericState === WidgetState.Hide) {
            window.ContextMessageWidget?.hide?.();
        }
    }

    async function init(dataSource: DataSource): Promise<void> {
        DataSource_OnChanged(dataSource, function (variable, data) {
            switch (variable) {
                case Global_DefinedProjectorErrorMessage:
                    applyData(data);
                    break;
                case Global_PlaybackErrorMessageState:
                    applyState(data);
                    break;
            }
        });

        const currentData = await DataSource_Read<string>(dataSource, Global_DefinedProjectorErrorMessage);
        applyData(currentData);

        const currentState = await DataSource_Read(dataSource, Global_PlaybackErrorMessageState);
        applyState(currentState);
    }

    window.ContextMessageWidgetPlayback = { init };
})();
