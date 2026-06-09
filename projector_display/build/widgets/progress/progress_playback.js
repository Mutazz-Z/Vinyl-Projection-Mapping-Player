"use strict";
(function () {
    let hasOwnStateKey = true;
    let currentState = WidgetState.Hide;
    let unsubscribePlaybackClock = null;
    function setProgressVisible(visible) {
        const container = document.querySelector('#progress-widget .progress-container');
        if (!container)
            return;
        container.classList.toggle('visible', visible);
    }
    function applyClockSnapshot(clockSnapshot) {
        window.ProgressWidget?.updateData?.(ProgressData_t.fromJson({
            currentDurationInTrack: clockSnapshot.progressSeconds,
            totalDurationInTrack: clockSnapshot.durationSeconds,
            readyForDisplay: clockSnapshot.durationSeconds > 0,
        }));
    }
    function applyState(state) {
        const numericState = Number(state);
        currentState = numericState;
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
    // Called by tracklist_playback when it receives Global_TrackListWidgetState
    function onTrackListState(state) {
        if (!hasOwnStateKey) {
            applyState(state);
        }
    }
    async function init(dataSource) {
        DataSource_OnChanged(dataSource, function (variable, data) {
            switch (variable) {
                case Global_ProgressWidgetState:
                    applyState(data);
                    break;
            }
        });
        await window.PlaybackClock.init(dataSource);
        if (unsubscribePlaybackClock)
            unsubscribePlaybackClock();
        unsubscribePlaybackClock = window.PlaybackClock.subscribe(function (clockSnapshot) {
            applyClockSnapshot(clockSnapshot);
        });
        try {
            const state = await DataSource_Read(dataSource, Global_ProgressWidgetState);
            applyState(state);
        }
        catch {
            hasOwnStateKey = false;
            console.warn('[Progress] Global_ProgressWidgetState unavailable; mirroring TrackListWidgetState.');
            const fallbackState = await DataSource_Read(dataSource, Global_TrackListWidgetState);
            applyState(fallbackState);
        }
    }
    window.ProgressWidgetPlayback = { init, onTrackListState };
})();
