"use strict";
(function () {
    let sourceDataSource = null;
    let listeners = [];
    let baseProgressSeconds = 0;
    let durationSeconds = 0;
    let playbackState = MediaPlaybackState.Idle;
    let sampledAtMilliseconds = 0;
    let animationFrameHandle = null;
    function nowMilliseconds() {
        if (typeof performance !== 'undefined' && performance.now) {
            return performance.now();
        }
        return Date.now();
    }
    function clamp(value, min, max) {
        return Math.min(Math.max(value, min), max);
    }
    function isPlayingState(state) {
        return Number(state) === MediaPlaybackState.Playing;
    }
    function projectProgressSeconds(atMilliseconds) {
        const timestamp = atMilliseconds || nowMilliseconds();
        let projected = Number(baseProgressSeconds || 0);
        if (isPlayingState(playbackState) && sampledAtMilliseconds > 0) {
            projected += Math.max(0, (timestamp - sampledAtMilliseconds) / 1000);
        }
        if (durationSeconds > 0) {
            return clamp(projected, 0, durationSeconds);
        }
        return Math.max(projected, 0);
    }
    function snapshot() {
        const progress = projectProgressSeconds();
        return {
            progressSeconds: progress,
            durationSeconds: Number(durationSeconds || 0),
            playbackState: Number(playbackState),
            isPlaying: isPlayingState(playbackState),
        };
    }
    function emit() {
        const current = snapshot();
        listeners.forEach(function (listener) {
            listener(current);
        });
    }
    function stopAnimationLoop() {
        if (animationFrameHandle !== null) {
            cancelAnimationFrame(animationFrameHandle);
            animationFrameHandle = null;
        }
    }
    function ensureAnimationLoop() {
        if (!isPlayingState(playbackState)) {
            stopAnimationLoop();
            return;
        }
        if (animationFrameHandle !== null)
            return;
        animationFrameHandle = requestAnimationFrame(function tick() {
            animationFrameHandle = null;
            if (!isPlayingState(playbackState)) {
                return;
            }
            emit();
            ensureAnimationLoop();
        });
    }
    function updateAnchor(nextProgressSeconds) {
        baseProgressSeconds = Math.max(0, Number(nextProgressSeconds || 0));
        sampledAtMilliseconds = nowMilliseconds();
    }
    function applyPlaybackState(nextPlaybackState) {
        const projectedNow = projectProgressSeconds();
        playbackState = Number(nextPlaybackState);
        updateAnchor(projectedNow);
        emit();
        ensureAnimationLoop();
    }
    function applyProgressSample(nextProgressSeconds) {
        updateAnchor(nextProgressSeconds);
        emit();
    }
    function applyDuration(nextDurationSeconds) {
        durationSeconds = Math.max(0, Number(nextDurationSeconds || 0));
        emit();
    }
    function subscribe(listener) {
        listeners.push(listener);
        listener(snapshot());
        return function unsubscribe() {
            listeners = listeners.filter(function (candidate) {
                return candidate !== listener;
            });
        };
    }
    async function init(dataSource) {
        if (sourceDataSource === dataSource) {
            return;
        }
        sourceDataSource = dataSource;
        DataSource_OnChanged(dataSource, function (variable, data) {
            switch (variable) {
                case Global_MediaPlaybackState:
                    applyPlaybackState(Number(data));
                    break;
                case Global_ActiveTrackProgressInSeconds:
                    applyProgressSample(Number(data));
                    break;
                case Global_ActiveTrackTotalDurationInSeconds:
                    applyDuration(Number(data));
                    break;
            }
        });
        const [initialState, initialProgress, initialDuration] = await Promise.all([
            DataSource_Read(dataSource, Global_MediaPlaybackState),
            DataSource_Read(dataSource, Global_ActiveTrackProgressInSeconds),
            DataSource_Read(dataSource, Global_ActiveTrackTotalDurationInSeconds),
        ]);
        playbackState = Number(initialState || MediaPlaybackState.Idle);
        durationSeconds = Math.max(0, Number(initialDuration || 0));
        updateAnchor(Number(initialProgress || 0));
        emit();
        ensureAnimationLoop();
    }
    window.PlaybackClock = {
        init: init,
        subscribe: subscribe,
        snapshot: snapshot,
    };
})();
