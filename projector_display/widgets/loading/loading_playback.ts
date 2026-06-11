import { DataSource } from "../../js/datasource";
import { WidgetState, Global_LoadingWidgetState } from "../../types/state";

(function () {
    function applyState(state: unknown): void {
        const numericState = Number(state);

        if (numericState === WidgetState.Loading) {
            void window.LoadingWidget?.loading?.();
            return;
        }

        if (numericState === WidgetState.Hide) {
            void window.LoadingWidget?.hide?.();
            return;
        }

        if (numericState === WidgetState.Idle) {
            window.LoadingWidget?.idle?.();
        }
    }

    async function init(dataSource: DataSource): Promise<void> {
        dataSource.onStateChanged(function (variable, data) {
            if (variable === Global_LoadingWidgetState) {
                applyState(data);
            }
        });

        const currentState = await dataSource.read(Global_LoadingWidgetState);
        applyState(currentState);
    }

    window.LoadingWidgetPlayback = { init };
})();
