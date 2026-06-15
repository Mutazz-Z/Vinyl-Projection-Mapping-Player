import { DataSource } from "../../js/datasource";
import { PlaybackClock } from "../../js/playback_clock";
import { LyricData_t, WidgetState, Global_LyricsWidgetData, Global_LyricsWidgetState } from "../../types/state";
import { LyricsWidget } from "./lyrics_app";

export class LyricsWidgetPlayback_t {
    private unsubscribePlaybackClock: (() => void) | null = null;

    private applyData(lyricData: LyricData_t): void {
        LyricsWidget.updateData(lyricData);
    }

    private applyState(state: number): void {

        switch (state) {
            case WidgetState.Show:
                LyricsWidget.show();
                break;

            case WidgetState.Hide:
                LyricsWidget.hide();
                break;
        }
    }

    public async init(dataSource: DataSource): Promise<void> {
        await PlaybackClock.init(dataSource);
        if (this.unsubscribePlaybackClock) this.unsubscribePlaybackClock();
        this.unsubscribePlaybackClock = PlaybackClock.subscribe((clockSnapshot) => {
            LyricsWidget.updateProgress(clockSnapshot.progressSeconds);
        });

        dataSource.onStateChanged((variable, data) => {
            switch (variable) {
                case Global_LyricsWidgetData.key:
                    this.applyData(LyricData_t.fromJson(data));
                    break;

                case Global_LyricsWidgetState:
                    this.applyState(data as number);
                    break;
            }
        });

        const currentData = await dataSource.read<LyricData_t>(Global_LyricsWidgetData.key);
        this.applyData(LyricData_t.fromJson(currentData));

        const currentState = await dataSource.read<number>(Global_LyricsWidgetState);
        this.applyState(currentState);
    }
}

export const LyricsWidgetPlayback = new LyricsWidgetPlayback_t();
