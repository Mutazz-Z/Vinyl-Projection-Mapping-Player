import { MediaPlaybackState, Global_MediaPlaybackState, Global_ActiveTrackProgressInSeconds, Global_ActiveTrackTotalDurationInSeconds } from "../types/state";
import { DataSource } from "./datasource";

export type PlaybackClockSnapshot = {
    progressSeconds: number;
    durationSeconds: number;
    playbackState: number;
    isPlaying: boolean;
};

export type PlaybackClockApi = {
    init: (dataSource: DataSource) => Promise<void>;
    subscribe: (listener: (snapshot: PlaybackClockSnapshot) => void) => () => void;
    snapshot: () => PlaybackClockSnapshot;
};

type PlaybackClockListener = (snapshot: PlaybackClockSnapshot) => void;

export class PlaybackClock_t implements PlaybackClockApi {
    private sourceDataSource: DataSource | null = null;
    private listeners: PlaybackClockListener[] = [];

    private baseProgressSeconds = 0;
    private durationSeconds = 0;
    private playbackState = MediaPlaybackState.Idle;
    private sampledAtMilliseconds = 0;

    private animationFrameHandle: number | null = null;

    private nowMilliseconds(): number {
        if (typeof performance !== "undefined" && performance.now) {
            return performance.now();
        }
        return Date.now();
    }

    private clamp(value: number, min: number, max: number): number {
        return Math.min(Math.max(value, min), max);
    }

    private isPlayingState(state: number): boolean {
        return Number(state) === MediaPlaybackState.Playing;
    }

    private projectProgressSeconds(atMilliseconds?: number): number {
        const timestamp = atMilliseconds || this.nowMilliseconds();
        let projected = Number(this.baseProgressSeconds || 0);

        if (this.isPlayingState(this.playbackState) && this.sampledAtMilliseconds > 0) {
            projected += Math.max(0, (timestamp - this.sampledAtMilliseconds) / 1000);
        }

        if (this.durationSeconds > 0) {
            return this.clamp(projected, 0, this.durationSeconds);
        }

        return Math.max(projected, 0);
    }

    private emit(): void {
        const current = this.snapshot();
        this.listeners.forEach((listener) => {
            listener(current);
        });
    }

    private stopAnimationLoop(): void {
        if (this.animationFrameHandle !== null) {
            cancelAnimationFrame(this.animationFrameHandle);
            this.animationFrameHandle = null;
        }
    }

    private ensureAnimationLoop(): void {
        if (!this.isPlayingState(this.playbackState)) {
            this.stopAnimationLoop();
            return;
        }

        if (this.animationFrameHandle !== null) return;

        this.animationFrameHandle = requestAnimationFrame(() => {
            this.animationFrameHandle = null;

            if (!this.isPlayingState(this.playbackState)) {
                return;
            }

            this.emit();
            this.ensureAnimationLoop();
        });
    }

    private updateAnchor(nextProgressSeconds: number): void {
        this.baseProgressSeconds = Math.max(0, Number(nextProgressSeconds || 0));
        this.sampledAtMilliseconds = this.nowMilliseconds();
    }

    private applyPlaybackState(nextPlaybackState: number): void {
        const projectedNow = this.projectProgressSeconds();
        this.playbackState = Number(nextPlaybackState);
        this.updateAnchor(projectedNow);
        this.emit();
        this.ensureAnimationLoop();
    }

    private applyProgressSample(nextProgressSeconds: number): void {
        this.updateAnchor(nextProgressSeconds);
        this.emit();
    }

    private applyDuration(nextDurationSeconds: number): void {
        this.durationSeconds = Math.max(0, Number(nextDurationSeconds || 0));
        this.emit();
    }

    public snapshot(): PlaybackClockSnapshot {
        const progress = this.projectProgressSeconds();
        return {
            progressSeconds: progress,
            durationSeconds: Number(this.durationSeconds || 0),
            playbackState: Number(this.playbackState),
            isPlaying: this.isPlayingState(this.playbackState),
        };
    }

    public subscribe(listener: PlaybackClockListener): () => void {
        this.listeners.push(listener);
        listener(this.snapshot());

        return () => {
            this.listeners = this.listeners.filter((candidate) => candidate !== listener);
        };
    }

    public async init(dataSource: DataSource): Promise<void> {
        if (this.sourceDataSource === dataSource) {
            return;
        }
        this.sourceDataSource = dataSource;

        this.sourceDataSource.onStateChanged((variable, data) => {
            switch (variable) {
                case Global_MediaPlaybackState:
                    this.applyPlaybackState(Number(data));
                    break;
                case Global_ActiveTrackProgressInSeconds:
                    this.applyProgressSample(Number(data));
                    break;
                case Global_ActiveTrackTotalDurationInSeconds:
                    this.applyDuration(Number(data));
                    break;
            }
        });

        const [initialState, initialProgress, initialDuration] = await Promise.all([
            this.sourceDataSource.read(Global_MediaPlaybackState),
            this.sourceDataSource.read(Global_ActiveTrackProgressInSeconds),
            this.sourceDataSource.read(Global_ActiveTrackTotalDurationInSeconds),
        ]);

        this.playbackState = Number(initialState || MediaPlaybackState.Idle);
        this.durationSeconds = Math.max(0, Number(initialDuration || 0));
        this.updateAnchor(Number(initialProgress || 0));

        this.emit();
        this.ensureAnimationLoop();
    }
}

export const PlaybackClock = new PlaybackClock_t();
