(function () {
    const RECORD_SLIDE_MS = 700;
    let transitionToken = 0;

    function applyData(data: unknown): void {
        window.RecordWidget?.updateData?.(RecordDesignData_t.fromJson(data));
    }

    function applyState(state: unknown): void {
        const numericState = Number(state);

        if (numericState === WidgetState.Show) {
            const token = ++transitionToken;
            window.RecordWidget?.show?.({
                visible: false,
                revealForPlayback: {
                    token,
                    getPlaybackToken: function () { return transitionToken; },
                },
            });
            return;
        }

        if (numericState === WidgetState.Hide) {
            const token = ++transitionToken;
            window.RecordWidget?.hide?.({
                visible: false,
                beginStop: {
                    token,
                    getPlaybackToken: function () { return transitionToken; },
                    isError: false,
                    delayMs: RECORD_SLIDE_MS,
                },
            });
        }
    }

    function applyPlaybackState(state: unknown): void {
        const playbackState = Number(state);
        window.RecordWidget?.show?.({ visible: false, playbackState });
    }

    async function init(dataSource: DataSource): Promise<void> {
        DataSource_OnChanged(dataSource, function (variable, data) {
            switch (variable) {
                case Global_RecordWidgetData.key:
                    applyData(data);
                    break;
                case Global_RecordWidgetState:
                    applyState(data);
                    break;
                case Global_MediaPlaybackState:
                    applyPlaybackState(data);
                    break;
            }
        });

        const currentData = await DataSource_Read(dataSource, Global_RecordWidgetData.key);
        applyData(currentData);

        const currentState = await DataSource_Read(dataSource, Global_RecordWidgetState);
        applyState(currentState);
    }

    window.RecordWidgetPlayback = { init };
})();
