(function () {
    function getRecord() {
        return document.getElementById('record');
    }

    function getRecordContainer() {
        var record = getRecord();
        return record ? record.closest('.record-container') : null;
    }

    function setSpinState(state) {
        var record = getRecord();
        if (record) record.style.animationPlayState = state;
    }

    function applyLayerStyle(el, imageUrl, color, fallbackColor) {
        if (!el) return;

        if (imageUrl) {
            var safeUrl = String(imageUrl).replace(/"/g, '\\"');
            el.style.backgroundImage = 'url("' + safeUrl + '")';
        } else {
            el.style.backgroundImage = 'none';
        }

        if (color) {
            el.style.backgroundColor = color;
        } else if (fallbackColor) {
            el.style.backgroundColor = fallbackColor;
        } else {
            el.style.removeProperty('background-color');
        }
    }

    function applyDesignData(designData) {
        var safeDesignData = designData || {};

        var record = getRecord();
        if (record) {
            applyLayerStyle(record, safeDesignData.outer_design_image, safeDesignData.outer_design_color, null);
        }

        var recordLabel = document.querySelector('.record-label');
        if (recordLabel) {
            applyLayerStyle(recordLabel, safeDesignData.inner_record_image, safeDesignData.inner_record_color, '#2a2a2a');
        }
    }

    function clearDesignData() {
        var record = getRecord();
        if (record) {
            record.style.removeProperty('background-image');
            record.style.removeProperty('background-color');
        }

        var recordLabel = document.querySelector('.record-label');
        if (recordLabel) {
            recordLabel.style.removeProperty('background-image');
            recordLabel.style.removeProperty('background-color');
        }
    }

    function ejectRecord() {
        var recordContainer = getRecordContainer();
        if (!recordContainer) return;

        var widgetSlot = recordContainer.parentElement;
        if (widgetSlot) {
            widgetSlot.style.overflow = 'visible';
            widgetSlot.style.clipPath = 'inset(-100px -1000px -100px 0)';
        }

        recordContainer.style.display = 'block';

        void recordContainer.offsetWidth;
        recordContainer.classList.add('error-eject');
    }

    function resetRecord() {
        var recordContainer = getRecordContainer();
        if (!recordContainer) return;

        recordContainer.classList.remove('error-eject');

        var widgetSlot = recordContainer.parentElement;
        if (widgetSlot) {
            widgetSlot.style.removeProperty('overflow');
            widgetSlot.style.removeProperty('clip-path');
        }
    }

    window.RecordWidget = {
        getRecord: getRecord,
        getRecordContainer: getRecordContainer,
        setSpinState: setSpinState,
        applyDesignData: applyDesignData,
        clearDesignData: clearDesignData,
        ejectRecord: ejectRecord,
        resetRecord: resetRecord
    };
})();
