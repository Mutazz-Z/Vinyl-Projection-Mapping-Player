import { DataSource } from "../../js/datasource";
import { RecordDesignData_t, WidgetState, Global_RecordWidgetData, Global_RecordWidgetState, Global_MediaPlaybackState } from "../../types/state";

(function () {
    const RECORD_SLIDE_MS = 700;
    let transitionToken = 0;
    let lastRecordData: unknown = null;

    function applyData(data: unknown): void {
        lastRecordData = data;
        window.RecordWidget?.updateData?.(RecordDesignData_t.fromJson(data));
    }

    function applyState(state: unknown): void {
        const numericState = Number(state);

        if (numericState === WidgetState.Show) {
            const token = ++transitionToken;
            window.RecordWidget?.show?.({
                visible: false,
                revealForPlayback: {
                    token,
                    getPlaybackToken: function () { return transitionToken; },
                },
            });
            return;
        }

        if (numericState === WidgetState.Hide) {
            const token = ++transitionToken;
            window.RecordWidget?.hide?.({
                visible: false,
                beginStop: {
                    token,
                    getPlaybackToken: function () { return transitionToken; },
                    isError: false,
                    delayMs: RECORD_SLIDE_MS,
                },
            });
            return;
        }

        if (numericState === WidgetState.Pause) {
            window.RecordWidget?.pause?.();
            return;
        }

        if (numericState === WidgetState.Resume) {
            window.RecordWidget?.play?.();
            return;
        }

        if (numericState === WidgetState.EjectRecord) {
            applyData(lastRecordData);
            window.RecordWidget?.ejectRecord?.();
            return;
        }
    }

    function applyPlaybackState(state: unknown): void {
        const playbackState = Number(state);
        window.RecordWidget?.show?.({ visible: false, playbackState });
    }

    async function init(dataSource: DataSource): Promise<void> {
        dataSource.onStateChanged(function (variable, data) {
            switch (variable) {
                case Global_RecordWidgetData.key:
                    applyData(data);
                    break;
                case Global_RecordWidgetState:
                    applyState(data);
                    break;
                case Global_MediaPlaybackState:
                    applyPlaybackState(data);
                    break;
            }
        });

        const currentData = await dataSource.read(Global_RecordWidgetData.key);
        applyData(currentData);

        const currentState = await dataSource.read(Global_RecordWidgetState);
        applyState(currentState);
    }

    window.RecordWidgetPlayback = { init };
})();
