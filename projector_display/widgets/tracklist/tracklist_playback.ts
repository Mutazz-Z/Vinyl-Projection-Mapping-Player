import { DataSource } from "../../js/datasource";
import { TrackListWidgetData_t, WidgetState, Global_TrackListWidgetData, Global_TrackListWidgetState } from "../../types/state";

(function () {
    let transitionToken = 0;

    function applyData(data: unknown): void {
        const trackListWidgetData = TrackListWidgetData_t.fromJson(data);
        window.TracklistWidget?.updateData?.(trackListWidgetData);

        const trackNames = (trackListWidgetData.tracks || []).map(function (entry) {
            return entry.track;
        });
        TrackResolver.setTrackNames(trackNames);
    }

    function applyState(state: unknown): void {
        const numericState = Number(state);

        if (numericState === WidgetState.Show) {
            window.TracklistWidget?.show?.();
            return;
        }

        if (numericState === WidgetState.Hide) {
            const token = ++transitionToken;
            window.TracklistWidget?.hide?.({
                visible: false,
                beginStopSequence: {
                    token,
                    getPlaybackToken: function () { return transitionToken; },
                },
            });
        }
    }

    async function init(dataSource: DataSource): Promise<void> {
        dataSource.onStateChanged(function (variable, data) {
            switch (variable) {
                case Global_TrackListWidgetData.key:
                    applyData(data);
                    break;
                case Global_TrackListWidgetState:
                    applyState(data);
                    break;
            }
        });

        const currentData = await dataSource.read(Global_TrackListWidgetData.key);
        applyData(currentData);

        const currentState = await dataSource.read(Global_TrackListWidgetState);
        applyState(currentState);
    }

    window.TracklistWidgetPlayback = { init };
})();
