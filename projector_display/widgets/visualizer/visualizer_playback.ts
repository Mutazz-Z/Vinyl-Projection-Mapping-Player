import { DataSource } from "../../js/datasource";
import { MediaPlaybackState, WidgetState, Global_VisualizerWidgetState, Global_MediaPlaybackState } from "../../types/state";

(function () {
    let currentPlaybackState: number = MediaPlaybackState.Idle;

    function applyState(state: unknown): void {
        const numericState = Number(state);

        if (numericState === WidgetState.Show || numericState === WidgetState.Resume) {
            const isPlaying = currentPlaybackState === MediaPlaybackState.Playing;
            if (isPlaying) {
                window.VisualizerWidget?.play?.();
            } else {
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

    async function init(dataSource: DataSource): Promise<void> {
        dataSource.onStateChanged(function (variable, data) {
            switch (variable) {
                case Global_VisualizerWidgetState:
                    applyState(data);
                    break;
                case Global_MediaPlaybackState:
                    currentPlaybackState = Number(data);
                    break;
            }
        });

        const playbackState = await dataSource.read(Global_MediaPlaybackState);
        currentPlaybackState = Number(playbackState);

        const currentState = await dataSource.read(Global_VisualizerWidgetState);
        applyState(currentState);
    }

    window.VisualizerWidgetPlayback = { init };
})();
