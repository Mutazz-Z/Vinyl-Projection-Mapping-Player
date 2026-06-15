import { DataSource } from "../../js/datasource";
import {
    RecordDesignData_t,
    WidgetState,
    MediaPlaybackState,
    Global_RecordWidgetData,
    Global_RecordWidgetState,
    Global_MediaPlaybackState,
} from "../../types/state";
import { RecordWidget } from "./record_app";

export class RecordWidgetPlayback_t {
    private applyData(data: RecordDesignData_t): void {
        RecordWidget.updateData(RecordDesignData_t.fromJson(data));
    }

    private applyState(state: number): void {
        const numericState = Number(state);

        switch (numericState) {
            case WidgetState.Show:
                RecordWidget.show();
                return;

            case WidgetState.Hide:
                RecordWidget.hide();
                return;

            case WidgetState.Pause:
                RecordWidget.pause();
                return;

            case WidgetState.Resume:
                RecordWidget.play();
                return;

            case WidgetState.EjectRecord:
                RecordWidget.ejectRecord();
                return;
        }
    }

    private applyPlaybackState(state: number): void {
        if (Number(state) === MediaPlaybackState.Playing) {
            RecordWidget.play();
            return;
        }

        RecordWidget.pause();
    }

    public async init(dataSource: DataSource): Promise<void> {
        dataSource.onStateChanged((variable: unknown, data: unknown) => {
            const globalVariable = variable as string;

            switch (globalVariable) {
                case Global_RecordWidgetData.key:
                    this.applyData(data as RecordDesignData_t);
                    break;

                case Global_RecordWidgetState:
                    this.applyState(data as number);
                    break;

                case Global_MediaPlaybackState:
                    this.applyPlaybackState(data as number);
                    break;
            }
        });

        const currentData = await dataSource.read<RecordDesignData_t>(Global_RecordWidgetData.key);
        this.applyData(currentData);

        const currentState = await dataSource.read<number>(Global_RecordWidgetState);
        this.applyState(currentState);

        const currentPlaybackState = await dataSource.read<number>(Global_MediaPlaybackState);
        this.applyPlaybackState(currentPlaybackState);
    }
}

export const RecordWidgetPlayback = new RecordWidgetPlayback_t();
