"use strict";
(function () {
    function applyData(data) {
        window.InfoWidget.updateData(TitleAndArtist_t.fromJson(data));
    }
    function applyState(state) {
        const numericState = Number(state);
        if (numericState === WidgetState.Show) {
            window.InfoWidget.show();
        }
        else if (numericState === WidgetState.Hide) {
            window.InfoWidget.hide();
        }
    }
    async function init(dataSource) {
        DataSource_OnChanged(dataSource, function (variable, data) {
            switch (variable) {
                case Global_InfoWidgetData.key:
                    applyData(data);
                    break;
                case Global_InfoWidgetState:
                    applyState(data);
                    break;
            }
        });
        const currentData = await DataSource_Read(dataSource, Global_InfoWidgetData.key);
        applyData(currentData);
        const currentState = await DataSource_Read(dataSource, Global_InfoWidgetState);
        applyState(currentState);
    }
    window.InfoWidgetPlayback = { init };
})();
