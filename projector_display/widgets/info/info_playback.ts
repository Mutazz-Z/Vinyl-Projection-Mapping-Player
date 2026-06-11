import { DataSource } from "../../js/datasource";
import { Global_InfoWidgetData, Global_InfoWidgetState, TitleAndArtist_t, WidgetState } from "../../types/state";

(function () {
    function applyData(data: unknown): void {
        window.InfoWidget.updateData(TitleAndArtist_t.fromJson(data));
    }

    function applyState(state: unknown): void {
        const numericState = Number(state);
        if (numericState === WidgetState.Show) {
            window.InfoWidget.show();
        } else if (numericState === WidgetState.Hide) {
            window.InfoWidget.hide();
        }
    }

    async function init(dataSource: DataSource): Promise<void> {
        dataSource.onStateChanged(function (variable, data) {
            switch (variable) {
                case Global_InfoWidgetData.key:
                    applyData(data);
                    break;
                case Global_InfoWidgetState:
                    applyState(data);
                    break;
            }
        });

        const currentData = await dataSource.read(Global_InfoWidgetData.key);
        applyData(currentData);

        const currentState = await dataSource.read(Global_InfoWidgetState);
        applyState(currentState);
    }

    window.InfoWidgetPlayback = { init };
})();
