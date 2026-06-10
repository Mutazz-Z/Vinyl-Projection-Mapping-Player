(function () {
    const RECORD_SLIDE_MS_FOR_SPIN = 700;
    const TRACKLIST_FADE_MS_FOR_STAGGER = 220;

    let pendingRevealTimer: ReturnType<typeof setTimeout> | null = null;
    let pendingStopCleanupTimer: ReturnType<typeof setTimeout> | null = null;
    let currentDesignData: RecordDesignData = {};
    let designApplyToken = 0;

    type RecordDesignData = {
        labelColor?: string;
        labelImage?: string;
        outerRingColor?: string;
        outerRingImage?: string;
        projectionOverlay?: string;
        coverImage?: string;
        inner_record_color?: string;
        inner_record_image?: string;
        outer_design_color?: string;
        outer_design_image?: string;
    };

    type RecordRevealConfig = {
        token: number;
        getPlaybackToken: () => number;
        onReadyForCarousel?: () => void;
    };

    type RecordStopConfig = {
        token: number;
        getPlaybackToken: () => number;
        isError?: boolean;
        delayMs: number;
    };

    type RecordShowOptions = {
        playbackState?: number;
        prepareForPlayback?: boolean;
        revealForPlayback?: RecordRevealConfig;
        visible?: boolean;
    };

    type RecordHideOptions = {
        cancelPendingTransitions?: boolean;
        beginStop?: RecordStopConfig;
        resetForNewPlayback?: boolean;
        visible?: boolean;
    };

    function getRecord(): HTMLElement | null {
        return document.getElementById('record');
    }

    function getRecordContainer(): HTMLElement | null {
        const record = getRecord();
        return record ? (record.closest('.record-container') as HTMLElement | null) : null;
    }

    function setSpinState(state: 'running' | 'paused'): void {
        const record = getRecord();
        if (record) record.style.animationPlayState = state;
    }

    function show(input?: unknown): void {
        const config: RecordShowOptions = (input && typeof input === 'object') ? (input as RecordShowOptions) : {};

        if (Object.prototype.hasOwnProperty.call(config, 'playbackState')) {
            consumePlaybackState(Number(config.playbackState));
        }

        if (config.prepareForPlayback === true) {
            resetForNewPlayback();
        }

        if (config.revealForPlayback) {
            const revealConfig = config.revealForPlayback;
            cancelPendingTransitions();
            resetRecord();
            const timers = revealRecordAndTracklistWithStaggeredSpin(
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

        const recordContainer = getRecordContainer();
        if (!recordContainer) return;
        recordContainer.style.display = '';
        recordContainer.classList.add('visible');
    }

    function hide(options?: unknown): ReturnType<typeof setTimeout> | null | void {
        const config: RecordHideOptions = (options && typeof options === 'object') ? (options as RecordHideOptions) : {};

        if (config.cancelPendingTransitions === true) {
            cancelPendingTransitions();
        }

        if (config.beginStop) {
            const stopConfig = config.beginStop;
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

            const errorRecordContainer = getRecordContainer();
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

        const recordContainer = getRecordContainer();
        if (!recordContainer) return;
        recordContainer.classList.remove('visible');
        recordContainer.style.display = 'none';
    }

    function play(): void {
        setSpinState('running');
    }

    function pause(): void {
        setSpinState('paused');
    }

    function applyLayerStyle(targetElement: HTMLElement | null, imageUrl?: string, color?: string, fallbackColor?: string): void {
        if (!targetElement) return;

        if (imageUrl) {
            const safeUrl = String(imageUrl).replace(/"/g, '\\"');
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

    function applyDesignData(designData?: RecordDesignData): void {
        const safeDesignData = designData || {};

        const record = getRecord();
        if (record) {
            applyLayerStyle(record, safeDesignData.outer_design_image, safeDesignData.outer_design_color, undefined);
        }

        const recordLabel = document.querySelector('.record-label') as HTMLElement | null;
        if (recordLabel) {
            applyLayerStyle(recordLabel, safeDesignData.inner_record_image, safeDesignData.inner_record_color, '#2a2a2a');
        }
    }

    function clearDesignData(): void {
        const record = getRecord();
        if (record) {
            record.style.removeProperty('background-image');
            record.style.removeProperty('background-color');
        }

        const recordLabel = document.querySelector('.record-label') as HTMLElement | null;
        if (recordLabel) {
            recordLabel.style.removeProperty('background-image');
            recordLabel.style.removeProperty('background-color');
        }
    }

    function ejectRecord(): void {
        const recordContainer = getRecordContainer();
        if (!recordContainer) return;

        applyDesignData(currentDesignData);

        const widgetSlot = recordContainer.parentElement as HTMLElement | null;
        if (widgetSlot) {
            widgetSlot.style.overflow = 'visible';
            widgetSlot.style.clipPath = 'inset(-100px -1000px -100px 0)';
        }

        recordContainer.style.display = 'block';

        void recordContainer.offsetWidth;
        recordContainer.classList.add('error-eject');
    }

    function resetRecord(): void {
        const recordContainer = getRecordContainer();
        if (!recordContainer) return;

        recordContainer.classList.remove('error-eject');

        const widgetSlot = recordContainer.parentElement as HTMLElement | null;
        if (widgetSlot) {
            widgetSlot.style.removeProperty('overflow');
            widgetSlot.style.removeProperty('clip-path');
        }
    }

    function consumePlaybackState(state: number): void {
        const numeric = Number(state);
        if (numeric === MediaPlaybackState.Playing) {
            play();
        } else {
            pause();
        }
    }

    function cancelPendingTransitions(): void {
        if (pendingRevealTimer) {
            clearTimeout(pendingRevealTimer);
            pendingRevealTimer = null;
        }

        if (pendingStopCleanupTimer) {
            clearTimeout(pendingStopCleanupTimer);
            pendingStopCleanupTimer = null;
        }
    }

    function mapRecordDesignData(recordDesignData: RecordDesignData_t): RecordDesignData {
        const usesLabelImage = recordDesignData.labelDesign?.usesImage === true;
        const usesRingImage = recordDesignData.ringDesign?.usesImage === true;

        return {
            labelColor: usesLabelImage ? '' : (recordDesignData.labelDesign?.labelColor || ''),
            labelImage: usesLabelImage ? (recordDesignData.labelDesign?.labelImage || '') : '',
            outerRingColor: usesRingImage ? '' : (recordDesignData.ringDesign?.ringColor || ''),
            outerRingImage: usesRingImage ? (recordDesignData.ringDesign?.ringImage || '') : '',
            inner_record_color: usesLabelImage ? '' : (recordDesignData.labelDesign?.labelColor || ''),
            inner_record_image: usesLabelImage ? (recordDesignData.labelDesign?.labelImage || '') : '',
            outer_design_color: usesRingImage ? '' : (recordDesignData.ringDesign?.ringColor || ''),
            outer_design_image: usesRingImage ? (recordDesignData.ringDesign?.ringImage || '') : '',
        };
    }

    function applyDesignToWidgets(designData: RecordDesignData): void {
        if (!designData || !Object.values(designData).some(Boolean)) return;

        const token = ++designApplyToken;
        currentDesignData = designData;

        if (token !== designApplyToken) return;

        applyDesignData(designData);
    }

    function updateData(recordDesignData: RecordDesignData_t): void {
        const mappedDesignData = mapRecordDesignData(recordDesignData);
        applyDesignToWidgets(mappedDesignData);
    }

    function hideRecordContainerWithCleanup(guardToken: number, getPlaybackToken: () => number, delayMs: number): ReturnType<typeof setTimeout> | null {
        const recordContainer = getRecordContainer();
        if (!recordContainer) return null;

        recordContainer.classList.remove('visible');

        const cleanupTimer = setTimeout(function () {
            if (guardToken !== getPlaybackToken()) return;
            recordContainer.style.display = 'none';
            clearDesignData();
            currentDesignData = {};
            window.OverlayWidget?.hide?.({
                visible: false,
                clearOverlayArt: true,
                resetStatus: true,
            });
        }, delayMs);

        return cleanupTimer;
    }

    function pauseSpin(): void {
        const recordElement = getRecord();
        if (recordElement) pause();
    }

    function resetForNewPlayback(): void {
        resetRecord();

        const recordContainer = getRecordContainer();
        if (recordContainer) {
            recordContainer.classList.remove('visible');
            recordContainer.style.display = 'none';
        }

        pauseSpin();
    }

    function revealRecordAndTracklistWithStaggeredSpin(guardToken: number, getPlaybackToken: () => number, onReadyForCarousel?: () => void): { staggerTimer: ReturnType<typeof setTimeout> | null } {
        const recordContainer = getRecordContainer();

        if (!recordContainer) {
            if (onReadyForCarousel) onReadyForCarousel();
            return { staggerTimer: null };
        }

        recordContainer.style.display = '';
        void recordContainer.offsetWidth;

        const staggerTimer = setTimeout(function () {
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
        updateData: updateData,
        play: play,
        pause: pause,
        ejectRecord: ejectRecord,
    };
})();
