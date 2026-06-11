import { DataSource } from "../../js/datasource";
import { Global_InfoWidgetData, Global_InfoWidgetState, TitleAndArtist_t, WidgetState } from "../../types/state";
import { infoWidget } from "./info_app";

export class InfoWidgetPlayback_t {
    public applyData(data: TitleAndArtist_t): void {
        infoWidget.updateData(data);
    }

    public applyState(state: number): void {
        switch (state) {
            case WidgetState.Show:
                infoWidget.show();
                break;

            case WidgetState.Hide:
                infoWidget.hide();
                break;
        }
    }

    public async init(dataSource: DataSource): Promise<void> {
        dataSource.onStateChanged((variable, data) => {

            switch (variable) {
                case Global_InfoWidgetData.key:
                    this.applyData(data as TitleAndArtist_t);
                    break;

                case Global_InfoWidgetState:
                    this.applyState(data as number);
                    break;
            }
        });

        const currentData = await dataSource.read<TitleAndArtist_t>(Global_InfoWidgetData.key);
        this.applyData(currentData);

        const currentState = await dataSource.read<number>(Global_InfoWidgetState);
        this.applyState(currentState);
    }

}

export const InfoWidgetPlayback = new InfoWidgetPlayback_t();
