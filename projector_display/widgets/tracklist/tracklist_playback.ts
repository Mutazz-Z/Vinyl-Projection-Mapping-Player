import { DataSource } from "../../js/datasource";
import { TrackListWidgetData_t, WidgetState, Global_TrackListWidgetData, Global_TrackListWidgetState } from "../../types/state";
import { TracklistWidget } from "./tracklist_app";

export class TracklistWidgetPlayback_t {

    private applyData(data: TrackListWidgetData_t): void {
        TracklistWidget.updateData(data);
    }

    private applyState(state: number): void {
        switch (Number(state)) {
            case WidgetState.Show:
                TracklistWidget.show();
                return;

            case WidgetState.Hide:
                TracklistWidget.hide();
                return;
        }
    }

    public async init(dataSource: DataSource): Promise<void> {
        dataSource.onStateChanged((variable: unknown, data: unknown) => {
            switch (variable as string) {
                case Global_TrackListWidgetData.key:
                    this.applyData(data as TrackListWidgetData_t);
                    break;

                case Global_TrackListWidgetState:
                    this.applyState(data as number);
                    break;
            }
        });

        const currentData = await dataSource.read<TrackListWidgetData_t>(Global_TrackListWidgetData.key);
        this.applyData(currentData);

        const currentState = await dataSource.read<number>(Global_TrackListWidgetState);
        this.applyState(currentState);
    }
}

export const TracklistWidgetPlayback = new TracklistWidgetPlayback_t();
