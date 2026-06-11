import { DataSource } from "../../js/datasource";
import { WidgetState, Global_LoadingWidgetState } from "../../types/state";
import { LoadingWidget } from "./loading_app";

export class LoadingWidgetPlayback_t {
    private applyState(state: number): void {
        switch (state) {
            case WidgetState.Loading:
                LoadingWidget.loading();
                break;

            case WidgetState.Hide:
                LoadingWidget.hide();
                break;

            case WidgetState.Idle:
                LoadingWidget.idle();
                break;
        }
    }

    public async init(dataSource: DataSource): Promise<void> {
        dataSource.onStateChanged((variable: unknown, data: unknown) => {
            const globalVariable = variable as string;

            switch (globalVariable) {
                case Global_LoadingWidgetState:
                    this.applyState(data as number);
                    break;
            }
        });

        const currentState = await dataSource.read<number>(Global_LoadingWidgetState);
        this.applyState(currentState);
    }
}

export const LoadingWidgetPlayback = new LoadingWidgetPlayback_t();