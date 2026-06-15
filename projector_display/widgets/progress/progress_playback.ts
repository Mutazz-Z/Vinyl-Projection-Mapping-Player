import { DataSource } from "../../js/datasource";
import { WidgetState, ProgressData_t, Global_ProgressWidgetState, Global_TrackListWidgetState } from "../../types/state";

(function () {
    let hasOwnStateKey = true;
    let unsubscribePlaybackClock: (() => void) | null = null;

    function setProgressVisible(visible: boolean): void {
        const container = document.querySelector('#progress-widget .progress-container');
        if (!container) return;
        container.classList.toggle('visible', visible);
    }

    function applyClockSnapshot(clockSnapshot: {
        progressSeconds: number;
        durationSeconds: number;
        playbackState: number;
    }): void {
        window.ProgressWidget?.updateData?.(ProgressData_t.fromJson({
            currentDurationInTrack: clockSnapshot.progressSeconds,
            totalDurationInTrack: clockSnapshot.durationSeconds,
            readyForDisplay: clockSnapshot.durationSeconds > 0,
        }));
    }

    function applyState(state: unknown): void {
        const numericState = Number(state);

        if (numericState === WidgetState.Show) {
            setProgressVisible(true);
            window.ProgressWidget?.show?.();
            return;
        }

        if (numericState === WidgetState.Hide) {
            setProgressVisible(false);
            window.ProgressWidget?.hide?.({ reset: true });
        }
    }

    async function init(dataSource: DataSource): Promise<void> {
        dataSource.onStateChanged(function (variable, data) {
            switch (variable) {
                case Global_ProgressWidgetState:
                    applyState(data);
                    break;
                case Global_TrackListWidgetState:
                    if (!hasOwnStateKey) {
                        applyState(data);
                    }
                    break;
            }
        });

        await window.PlaybackClock.init(dataSource);
        if (unsubscribePlaybackClock) unsubscribePlaybackClock();
        unsubscribePlaybackClock = window.PlaybackClock.subscribe(function (clockSnapshot) {
            applyClockSnapshot(clockSnapshot);
        });

        try {
            const state = await dataSource.read(Global_ProgressWidgetState);
            applyState(state);
        } catch {
            hasOwnStateKey = false;
            console.warn('[Progress] Global_ProgressWidgetState unavailable; mirroring TrackListWidgetState.');
            const fallbackState = await dataSource.read(Global_TrackListWidgetState);
            applyState(fallbackState);
        }
    }

    window.ProgressWidgetPlayback = { init };
})();
