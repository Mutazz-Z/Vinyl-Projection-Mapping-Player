(function () {
    let unsubscribePlaybackClock: (() => void) | null = null;

    function applyData(data: unknown): void {
        const lyricsData = LyricData_t.fromJson(data);
        window.LyricsWidget?.updateData?.({ lyricsData: lyricsData.trackLyrics || null });
    }

    function applyState(state: unknown): void {
        const numericState = Number(state);
        if (numericState === WidgetState.Show) {
            window.LyricsWidget?.show?.();
        } else if (numericState === WidgetState.Hide) {
            window.LyricsWidget?.hide?.();
        }
    }

    async function init(dataSource: DataSource): Promise<void> {
        await window.PlaybackClock.init(dataSource);
        if (unsubscribePlaybackClock) unsubscribePlaybackClock();
        unsubscribePlaybackClock = window.PlaybackClock.subscribe(function (clockSnapshot) {
            window.LyricsWidget?.updateData?.({ progressSeconds: clockSnapshot.progressSeconds });
        });

        DataSource_OnChanged(dataSource, function (variable, data) {
            switch (variable) {
                case Global_LyricsWidgetData.key:
                    applyData(data);
                    break;
                case Global_LyricsWidgetState:
                    applyState(data);
                    break;
            }
        });

        const currentData = await DataSource_Read(dataSource, Global_LyricsWidgetData.key);
        applyData(currentData);

        const currentState = await DataSource_Read(dataSource, Global_LyricsWidgetState);
        applyState(currentState);
    }

    window.LyricsWidgetPlayback = { init };
})();
