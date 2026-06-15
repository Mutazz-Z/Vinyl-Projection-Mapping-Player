import { MediaPlaybackState, Global_MediaPlaybackState, Global_ActiveTrackProgressInSeconds, Global_ActiveTrackTotalDurationInSeconds } from "../types/state";
import { DataSource } from "./datasource";

type PlaybackClockSnapshot = {
    progressSeconds: number;
    durationSeconds: number;
    playbackState: number;
    isPlaying: boolean;
};

type PlaybackClockApi = {
    init: (dataSource: DataSource) => Promise<void>;
    subscribe: (listener: (snapshot: PlaybackClockSnapshot) => void) => () => void;
    snapshot: () => PlaybackClockSnapshot;
};

declare global {
    interface Window {
        PlaybackClock: PlaybackClockApi;
    }
}

(function () {
    type PlaybackClockListener = (snapshot: PlaybackClockSnapshot) => void;

    let sourceDataSource: DataSource | null = null;
    let listeners: PlaybackClockListener[] = [];

    let baseProgressSeconds = 0;
    let durationSeconds = 0;
    let playbackState = MediaPlaybackState.Idle;
    let sampledAtMilliseconds = 0;

    let animationFrameHandle: number | null = null;

    function nowMilliseconds(): number {
        if (typeof performance !== 'undefined' && performance.now) {
            return performance.now();
        }
        return Date.now();
    }

    function clamp(value: number, min: number, max: number): number {
        return Math.min(Math.max(value, min), max);
    }

    function isPlayingState(state: number): boolean {
        return Number(state) === MediaPlaybackState.Playing;
    }

    function projectProgressSeconds(atMilliseconds?: number): number {
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

    function snapshot(): PlaybackClockSnapshot {
        const progress = projectProgressSeconds();
        return {
            progressSeconds: progress,
            durationSeconds: Number(durationSeconds || 0),
            playbackState: Number(playbackState),
            isPlaying: isPlayingState(playbackState),
        };
    }

    function emit(): void {
        const current = snapshot();
        listeners.forEach(function (listener) {
            listener(current);
        });
    }

    function stopAnimationLoop(): void {
        if (animationFrameHandle !== null) {
            cancelAnimationFrame(animationFrameHandle);
            animationFrameHandle = null;
        }
    }

    function ensureAnimationLoop(): void {
        if (!isPlayingState(playbackState)) {
            stopAnimationLoop();
            return;
        }

        if (animationFrameHandle !== null) return;

        animationFrameHandle = requestAnimationFrame(function tick() {
            animationFrameHandle = null;

            if (!isPlayingState(playbackState)) {
                return;
            }

            emit();
            ensureAnimationLoop();
        });
    }

    function updateAnchor(nextProgressSeconds: number): void {
        baseProgressSeconds = Math.max(0, Number(nextProgressSeconds || 0));
        sampledAtMilliseconds = nowMilliseconds();
    }

    function applyPlaybackState(nextPlaybackState: number): void {
        const projectedNow = projectProgressSeconds();
        playbackState = Number(nextPlaybackState);
        updateAnchor(projectedNow);
        emit();
        ensureAnimationLoop();
    }

    function applyProgressSample(nextProgressSeconds: number): void {
        updateAnchor(nextProgressSeconds);
        emit();
    }

    function applyDuration(nextDurationSeconds: number): void {
        durationSeconds = Math.max(0, Number(nextDurationSeconds || 0));
        emit();
    }

    function subscribe(listener: PlaybackClockListener): () => void {
        listeners.push(listener);
        listener(snapshot());

        return function unsubscribe() {
            listeners = listeners.filter(function (candidate) {
                return candidate !== listener;
            });
        };
    }

    async function init(dataSource: DataSource): Promise<void> {
        if (sourceDataSource === dataSource) {
            return;
        }
        sourceDataSource = dataSource;

        sourceDataSource.onStateChanged(function (variable, data) {
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
            sourceDataSource.read(Global_MediaPlaybackState),
            sourceDataSource.read(Global_ActiveTrackProgressInSeconds),
            sourceDataSource.read(Global_ActiveTrackTotalDurationInSeconds),
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
