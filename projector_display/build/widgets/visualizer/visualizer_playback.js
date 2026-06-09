"use strict";
(function () {
    let currentPlaybackState = MediaPlaybackState.Idle;
    function applyState(state) {
        const numericState = Number(state);
        if (numericState === WidgetState.Show || numericState === WidgetState.Resume) {
            const isPlaying = currentPlaybackState === MediaPlaybackState.Playing;
            if (isPlaying) {
                window.VisualizerWidget?.play?.();
            }
            else {
                window.VisualizerWidget?.pause?.();
            }
            return;
        }
        if (numericState === WidgetState.Pause) {
            window.VisualizerWidget?.pause?.();
            return;
        }
        if (numericState === WidgetState.Hide) {
            window.VisualizerWidget?.hide?.();
        }
    }
    async function init(dataSource) {
        DataSource_OnChanged(dataSource, function (variable, data) {
            switch (variable) {
                case Global_VisualizerWidgetState:
                    applyState(data);
                    break;
                case Global_MediaPlaybackState:
                    currentPlaybackState = Number(data);
                    break;
            }
        });
        const playbackState = await DataSource_Read(dataSource, Global_MediaPlaybackState);
        currentPlaybackState = Number(playbackState);
        const currentState = await DataSource_Read(dataSource, Global_VisualizerWidgetState);
        applyState(currentState);
    }
    window.VisualizerWidgetPlayback = { init };
})();
