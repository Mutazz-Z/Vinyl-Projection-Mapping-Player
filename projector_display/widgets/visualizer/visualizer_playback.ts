import { DataSource } from "../../js/datasource";
import { MediaPlaybackState, WidgetState, Global_VisualizerWidgetState, Global_MediaPlaybackState } from "../../types/state";
import { VisualizerWidget } from "./visualizer_app";

export class VisualizerWidgetPlayback_t {
    private currentPlaybackState: number = MediaPlaybackState.Idle;

    private applyState(state: number): void {
        switch (state) {
            case WidgetState.Show:
                VisualizerWidget.show();
                return;

            case WidgetState.Hide:
                VisualizerWidget.hide();
                return;

            case WidgetState.Resume:
                VisualizerWidget.play();
                return;

            case WidgetState.Pause:
                VisualizerWidget.pause();
                return;
        }
    }

    public async init(dataSource: DataSource): Promise<void> {
        dataSource.onStateChanged((variable, data) => {
            switch (variable) {
                case Global_VisualizerWidgetState:
                    this.applyState(data as number);
                    break;
            }
        });

        const currentState = await dataSource.read<number>(Global_VisualizerWidgetState);
        this.applyState(currentState);
    }
}

export const VisualizerWidgetPlayback = new VisualizerWidgetPlayback_t();
