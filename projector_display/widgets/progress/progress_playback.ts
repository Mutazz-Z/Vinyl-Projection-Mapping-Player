import { DataSource } from "../../js/datasource";
import { PlaybackClock } from "../../js/playback_clock";
import { WidgetState, ProgressData_t, Global_ProgressWidgetState } from "../../types/state";
import { ProgressWidget } from "./progress_app";

type ProgressClockSnapshot = {
    progressSeconds: number;
    durationSeconds: number;
    playbackState: number;
};

export class ProgressWidgetPlayback_t {
    private unsubscribePlaybackClock: (() => void) | null = null;

    private applyClockSnapshot(clockSnapshot: ProgressClockSnapshot): void {
        ProgressWidget.updateData(ProgressData_t.fromJson({
            currentDurationInTrack: clockSnapshot.progressSeconds,
            totalDurationInTrack: clockSnapshot.durationSeconds,
            readyForDisplay: clockSnapshot.durationSeconds > 0,
        }));
    }

    private applyState(state: number): void {
        switch (state) {
            case WidgetState.Show:
                ProgressWidget.show();
                break;

            case WidgetState.Hide:
                ProgressWidget.hide();
                break;
        }
    }

    public async init(dataSource: DataSource): Promise<void> {
        dataSource.onStateChanged((variable: unknown, data: unknown) => {
            const globalVariable = variable as string;

            switch (globalVariable) {
                case Global_ProgressWidgetState:
                    this.applyState(data as number);
                    break;
            }
        });

        await PlaybackClock.init(dataSource);
        if (this.unsubscribePlaybackClock) this.unsubscribePlaybackClock();
        this.unsubscribePlaybackClock = PlaybackClock.subscribe((clockSnapshot) => {
            this.applyClockSnapshot(clockSnapshot);
        });

        const state = await dataSource.read<number>(Global_ProgressWidgetState);
        this.applyState(state);
    }
}

export const ProgressWidgetPlayback = new ProgressWidgetPlayback_t();
