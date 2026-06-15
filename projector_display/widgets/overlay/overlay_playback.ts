import { DataSource } from "../../js/datasource";
import { OverlayData_t, WidgetState, Global_OverlayWidgetData, Global_OverlayWidgetState } from "../../types/state";
import { OverlayWidget } from "./overlay_app";

export class OverlayWidgetPlayback_t {
    private applyData(data: OverlayData_t): void {
        OverlayWidget.updateData(OverlayData_t.fromJson(data));
    }

    private applyState(state: number): void {
        switch (state) {
            case WidgetState.Show:
                OverlayWidget.show();
                break;

            case WidgetState.Hide:
                OverlayWidget.hide();
                break;

            case WidgetState.Pause:
                OverlayWidget.pause();
                break;

            case WidgetState.Resume:
                OverlayWidget.play();
                break;
        }
    }

    public async init(dataSource: DataSource): Promise<void> {
        dataSource.onStateChanged((variable: unknown, data: unknown) => {
            const globalVariable = variable as string;

            switch (globalVariable) {
                case Global_OverlayWidgetData.key:
                    this.applyData(data as OverlayData_t);
                    break;

                case Global_OverlayWidgetState:
                    this.applyState(data as number);
                    break;
            }
        });

        const currentData = await dataSource.read(Global_OverlayWidgetData);
        this.applyData(currentData as OverlayData_t);

        const currentState = await dataSource.read(Global_OverlayWidgetState);
        this.applyState(currentState as number);
    }
}

export const OverlayWidgetPlayback = new OverlayWidgetPlayback_t();
