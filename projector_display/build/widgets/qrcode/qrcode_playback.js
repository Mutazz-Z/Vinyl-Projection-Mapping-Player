"use strict";
(function () {
    function applyState(state) {
        const numericState = Number(state);
        if (numericState === WidgetState.Hide) {
            window.QrCodeWidget?.hide?.();
        }
    }
    async function init(dataSource) {
        DataSource_OnChanged(dataSource, function (variable, data) {
            switch (variable) {
                case Global_QrCodeWidgetState:
                    applyState(data);
                    break;
            }
        });
        const currentState = await DataSource_Read(dataSource, Global_QrCodeWidgetState);
        applyState(currentState);
    }
    window.QrCodeWidgetPlayback = { init };
})();
