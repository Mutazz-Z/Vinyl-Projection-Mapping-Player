(function () {
    var RECORD_SLIDE_MS_FOR_SPIN = 700;
    var TRACKLIST_FADE_MS_FOR_STAGGER = 220;

    var pendingRevealTimer = null;
    var pendingStopCleanupTimer = null;
    var currentDesignData = {};
    var designApplyToken = 0;

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

    function show(input) {
        var config = input || {};
        var projectorData = null;

        if (input && input.tagData) {
            projectorData = input;
        } else if (config.projectorData && config.projectorData.tagData) {
            projectorData = config.projectorData;
        }

        if (Object.prototype.hasOwnProperty.call(config, 'playbackState')) {
            consumePlaybackState(config.playbackState);
        }

        if (projectorData) {
            consumeProjectorData(projectorData);
        }

        if (config.prepareForPlayback === true) {
            resetForNewPlayback();
        }

        if (config.revealForPlayback) {
            var revealConfig = config.revealForPlayback;
            cancelPendingTransitions();
            var timers = revealRecordAndTracklistWithStaggeredSpin(
                revealConfig.token,
                revealConfig.getPlaybackToken,
                revealConfig.onReadyForCarousel
            );

            if (timers) {
                pendingRevealTimer = timers.staggerTimer || null;
            }

            return;
        }

        if (config.visible === false) {
            return;
        }

        var recordContainer = getRecordContainer();
        if (!recordContainer) return;
        recordContainer.style.display = '';
        recordContainer.classList.add('visible');
    }

    function hide(options) {
        var config = options || {};

        if (config.cancelPendingTransitions === true) {
            cancelPendingTransitions();
        }

        if (config.beginStop) {
            var stopConfig = config.beginStop;
            pauseSpin();

            if (pendingRevealTimer) {
                clearTimeout(pendingRevealTimer);
                pendingRevealTimer = null;
            }

            if (pendingStopCleanupTimer) {
                clearTimeout(pendingStopCleanupTimer);
                pendingStopCleanupTimer = null;
            }

            if (!stopConfig.isError) {
                pendingStopCleanupTimer = hideRecordContainerWithCleanup(
                    stopConfig.token,
                    stopConfig.getPlaybackToken,
                    stopConfig.delayMs
                );
                return pendingStopCleanupTimer;
            }

            var errorRecordContainer = getRecordContainer();
            if (errorRecordContainer) {
                errorRecordContainer.classList.remove('visible');
            }

            return null;
        }

        if (config.resetForNewPlayback === true) {
            resetForNewPlayback();
            return;
        }

        if (config.visible === false) {
            return;
        }

        var recordContainer = getRecordContainer();
        if (!recordContainer) return;
        recordContainer.classList.remove('visible');
        recordContainer.style.display = 'none';
    }

    function play() {
        setSpinState('running');
    }

    function pause() {
        setSpinState('paused');
    }

    function applyLayerStyle(targetElement, imageUrl, color, fallbackColor) {
        if (!targetElement) return;

        if (imageUrl) {
            var safeUrl = String(imageUrl).replace(/"/g, '\\"');
            targetElement.style.backgroundImage = 'url("' + safeUrl + '")';
        } else {
            targetElement.style.backgroundImage = 'none';
        }

        if (color) {
            targetElement.style.backgroundColor = color;
        } else if (fallbackColor) {
            targetElement.style.backgroundColor = fallbackColor;
        } else {
            targetElement.style.removeProperty('background-color');
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

    function consumeProjectorData(projectorData) {
        if (!projectorData || !projectorData.tagData) return;

        var designData = resolveEffectiveDesignData(projectorData);
        applyDesignToWidgets(designData);
    }

    function consumePlaybackState(state) {
        var numeric = Number(state);
        if (numeric === MediaPlaybackState.Playing) {
            play();
        } else {
            pause();
        }
    }

    function cancelPendingTransitions() {
        if (pendingRevealTimer) {
            clearTimeout(pendingRevealTimer);
            pendingRevealTimer = null;
        }

        if (pendingStopCleanupTimer) {
            clearTimeout(pendingStopCleanupTimer);
            pendingStopCleanupTimer = null;
        }
    }

    function mergeIncomingDesignWithPreviousDesign(incomingDesign, previousDesign) {
        function pick(primaryValue, fallbackValue) {
            return primaryValue || fallbackValue || '';
        }

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
        function clean(value) {
            return typeof value === 'string' ? value.trim() : '';
        }

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
        var tagData = (projectorData && projectorData.tagData) ? projectorData.tagData : {};
        var incomingDesignData = extractDesignFromTagData(tagData);
        return mergeIncomingDesignWithPreviousDesign(incomingDesignData, currentDesignData || {});
    }

    function applyDesignToWidgets(designData) {
        if (!designData || !Object.values(designData).some(Boolean)) return;

        var token = ++designApplyToken;
        currentDesignData = designData;

        if (token !== designApplyToken) return;

        applyDesignData(designData);
        if (window.OverlayWidget && window.OverlayWidget.show) {
            window.OverlayWidget.show({
                visible: false,
                overlayArt: designData.projectionOverlay,
            });
        }

        if (designData.coverImage) {
            var albumArtElement = document.getElementById('album-art');
            if (albumArtElement) {
                var safeUrl = designData.coverImage.replace(/"/g, '\\"');
                albumArtElement.style.backgroundImage = 'url("' + safeUrl + '")';
            }
        }
    }

    function hideRecordContainerWithCleanup(guardToken, getPlaybackToken, delayMs) {
        var recordContainer = getRecordContainer();
        if (!recordContainer) return null;

        recordContainer.classList.remove('visible');

        var cleanupTimer = setTimeout(function () {
            if (guardToken !== getPlaybackToken()) return;
            recordContainer.style.display = 'none';
            clearDesignData();
            currentDesignData = {};
            if (window.OverlayWidget && window.OverlayWidget.hide) {
                window.OverlayWidget.hide({
                    visible: false,
                    clearOverlayArt: true,
                    resetStatus: true,
                });
            }
        }, delayMs);

        return cleanupTimer;
    }

    function pauseSpin() {
        var recordElement = getRecord();
        if (recordElement) pause();
    }

    function resetForNewPlayback() {
        resetRecord();

        var recordContainer = getRecordContainer();
        if (recordContainer) {
            recordContainer.classList.remove('visible');
            recordContainer.style.display = 'none';
        }

        pauseSpin();
    }

    function revealRecordAndTracklistWithStaggeredSpin(guardToken, getPlaybackToken, onReadyForCarousel) {
        var recordContainer = getRecordContainer();

        if (!recordContainer) {
            if (onReadyForCarousel) onReadyForCarousel();
            return { staggerTimer: null };
        }

        recordContainer.style.display = '';
        void recordContainer.offsetWidth;

        var staggerTimer = setTimeout(function () {
            if (guardToken !== getPlaybackToken()) return;

            recordContainer.classList.add('visible');

            if (onReadyForCarousel) onReadyForCarousel();

            setTimeout(function () {
                if (guardToken !== getPlaybackToken()) return;
                play();
            }, RECORD_SLIDE_MS_FOR_SPIN);
        }, TRACKLIST_FADE_MS_FOR_STAGGER);

        return { staggerTimer: staggerTimer };
    }

    window.RecordWidget = {
        show: show,
        hide: hide,
        play: play,
        pause: pause,
        ejectRecord: ejectRecord,
    };
})();
