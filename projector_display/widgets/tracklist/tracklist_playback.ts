(function () {
    let transitionToken = 0;

    function applyData(data: unknown): void {
        const trackListWidgetData = TrackListWidgetData_t.fromJson(data);
        window.TracklistWidget?.updateData?.(trackListWidgetData);

        const trackNames = (trackListWidgetData.tracks || []).map(function (entry) {
            return entry.track;
        });
        TrackResolver.setTrackNames(trackNames);
    }

    function applyState(state: unknown): void {
        const numericState = Number(state);

        if (numericState === WidgetState.Show) {
            window.TracklistWidget?.show?.();
            return;
        }

        if (numericState === WidgetState.Hide) {
            const token = ++transitionToken;
            window.TracklistWidget?.hide?.({
                visible: false,
                beginStopSequence: {
                    token,
                    getPlaybackToken: function () { return transitionToken; },
                },
            });
        }

        window.ProgressWidgetPlayback?.onTrackListState?.(numericState);
    }

    async function init(dataSource: DataSource): Promise<void> {
        DataSource_OnChanged(dataSource, function (variable, data) {
            switch (variable) {
                case Global_TrackListWidgetData.key:
                    applyData(data);
                    break;
                case Global_TrackListWidgetState:
                    applyState(data);
                    break;
            }
        });

        const currentData = await DataSource_Read(dataSource, Global_TrackListWidgetData.key);
        applyData(currentData);

        const currentState = await DataSource_Read(dataSource, Global_TrackListWidgetState);
        applyState(currentState);
    }

    window.TracklistWidgetPlayback = { init };
})();
