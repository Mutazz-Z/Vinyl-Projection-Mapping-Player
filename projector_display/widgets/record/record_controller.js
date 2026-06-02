(function () {
    const RECORD_SLIDE_MS_FOR_SPIN = 700;
    const TRACKLIST_FADE_MS_FOR_STAGGER = 220;

    let currentDesignData = {};
    let designApplyToken = 0;

    function mergeIncomingDesignWithPreviousDesign(incomingDesign, previousDesign) {
        const pick = (a, b) => a || b || '';
        return {
            labelColor: pick(incomingDesign.labelColor, previousDesign.labelColor),
            labelImage: pick(incomingDesign.labelImage, previousDesign.labelImage),
            outerRingColor: pick(incomingDesign.outerRingColor, previousDesign.outerRingColor),
            outerRingImage: pick(incomingDesign.outerRingImage, previousDesign.outerRingImage),
            projectionOverlay: pick(incomingDesign.projectionOverlay, previousDesign.projectionOverlay),
            coverImage: pick(incomingDesign.coverImage, previousDesign.coverImage),
            inner_record_color: pick(incomingDesign.labelColor, previousDesign.inner_record_color),
            inner_record_image: pick(incomingDesign.labelImage, previousDesign.inner_record_image),
            outer_design_color: pick(incomingDesign.outerRingColor, previousDesign.outer_design_color),
            outer_design_image: pick(incomingDesign.outerRingImage, previousDesign.outer_design_image),
        };
    }

    function extractDesignFromTagData(tagData) {
        const clean = val => typeof val === 'string' ? val.trim() : '';
        return {
            labelColor: clean(tagData.labelColor),
            labelImage: clean(tagData.labelImage),
            outerRingColor: clean(tagData.outerRingColor),
            outerRingImage: clean(tagData.outerRingImage),
            projectionOverlay: clean(tagData.projectionOverlay),
            coverImage: clean(tagData.coverImage),
        };
    }

    function resolveEffectiveDesignData(projectorData) {
        const tagData = (projectorData && projectorData.tagData) ? projectorData.tagData : {};
        const incoming = extractDesignFromTagData(tagData);
        return mergeIncomingDesignWithPreviousDesign(incoming, currentDesignData || {});
    }

    function applyDesignToWidgets(designData) {
        if (!designData || !Object.values(designData).some(Boolean)) return;

        const token = ++designApplyToken;
        currentDesignData = designData;

        if (token !== designApplyToken) return;

        window.RecordWidget.applyDesignData(designData);
        window.OverlayWidget.setOverlayArt(designData.projectionOverlay);

        if (designData.coverImage) {
            const albumArtElement = document.getElementById('album-art');
            if (albumArtElement) {
                const safeUrl = designData.coverImage.replace(/"/g, '\\"');
                albumArtElement.style.backgroundImage = 'url("' + safeUrl + '")';
            }
        }
    }

    function revealRecordWithSpinAfterDelay(guardToken, getPlaybackToken, delayBeforeSpinMs) {
        const record = window.RecordWidget.getRecord();
        const recordContainer = window.RecordWidget.getRecordContainer();

        if (!recordContainer) return null;

        recordContainer.style.display = '';
        void recordContainer.offsetWidth;

        const spinTimer = setTimeout(function () {
            if (guardToken !== getPlaybackToken()) return;
            if (record) window.RecordWidget.setSpinState('running');
        }, delayBeforeSpinMs);

        return spinTimer;
    }

    function showRecordContainer() {
        const recordContainer = window.RecordWidget.getRecordContainer();
        if (!recordContainer) return;
        recordContainer.classList.add('visible');
    }

    function hideRecordContainerWithCleanup(guardToken, getPlaybackToken, delayMs) {
        const recordContainer = window.RecordWidget.getRecordContainer();
        if (!recordContainer) return null;

        recordContainer.classList.remove('visible');

        const cleanupTimer = setTimeout(function () {
            if (guardToken !== getPlaybackToken()) return;
            recordContainer.style.display = 'none';
            window.RecordWidget.clearDesignData();
            currentDesignData = {};
            window.OverlayWidget.clearOverlayArt();
            if (window.OverlayWidget.resetStatus) window.OverlayWidget.resetStatus();
        }, delayMs);

        return cleanupTimer;
    }

    function pauseSpin() {
        const record = window.RecordWidget.getRecord();
        if (record) window.RecordWidget.setSpinState('paused');
    }

    function resumeSpin() {
        window.RecordWidget.setSpinState('running');
    }

    function resetForNewPlayback() {
        if (window.RecordWidget && window.RecordWidget.resetRecord) {
            window.RecordWidget.resetRecord();
        }

        const recordContainer = window.RecordWidget.getRecordContainer();
        if (recordContainer) {
            recordContainer.classList.remove('visible');
            recordContainer.style.display = 'none';
        }

        pauseSpin();
    }

    function revealRecordAndTracklistWithStaggeredSpin(guardToken, getPlaybackToken, onReadyForCarousel) {
        const recordContainer = window.RecordWidget.getRecordContainer();

        if (!recordContainer) {
            if (onReadyForCarousel) onReadyForCarousel();
            return { staggerTimer: null, spinTimer: null };
        }

        recordContainer.style.display = '';
        void recordContainer.offsetWidth;

        let spinTimer = null;

        const staggerTimer = setTimeout(function () {
            if (guardToken !== getPlaybackToken()) return;

            recordContainer.classList.add('visible');

            if (onReadyForCarousel) onReadyForCarousel();

            spinTimer = setTimeout(function () {
                if (guardToken !== getPlaybackToken()) return;
                window.RecordWidget.setSpinState('running');
            }, RECORD_SLIDE_MS_FOR_SPIN);
        }, TRACKLIST_FADE_MS_FOR_STAGGER);

        return { staggerTimer, getSpinTimer: () => spinTimer };
    }

    function getCurrentDesignData() {
        return currentDesignData;
    }

    function clearDesignData() {
        currentDesignData = {};
    }

    window.RecordController = {
        resolveEffectiveDesignData,
        applyDesignToWidgets,
        revealRecordWithSpinAfterDelay,
        revealRecordAndTracklistWithStaggeredSpin,
        showRecordContainer,
        hideRecordContainerWithCleanup,
        pauseSpin,
        resumeSpin,
        resetForNewPlayback,
        getCurrentDesignData,
        clearDesignData,
    };
})();