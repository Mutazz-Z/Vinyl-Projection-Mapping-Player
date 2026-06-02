(function () {
    let latestLyricsData = null;
    let renderedLyricsData = null;
    let hasLyricsForCurrentTrack = false;
    let lyricsRevealUnlocked = false;
    let deferLyricsSwapUntilNextProgressEvent = false;
    let hideTransitionInProgress = false;
    let pendingHideCallbacks = [];

    function getLyricsWidgetElement() {
        return document.getElementById('lyrics-widget');
    }

    function flushPendingHideCallbacks() {
        while (pendingHideCallbacks.length > 0) {
            const callback = pendingHideCallbacks.shift();
            if (callback) callback();
        }
    }

    function show() {
        const element = getLyricsWidgetElement();
        if (!element) return;

        cancelPendingHide();

        element.style.display = 'block';
        void element.offsetWidth;
        element.classList.add('visible');
    }

    function cancelPendingHide() {
        const element = getLyricsWidgetElement();
        hideTransitionInProgress = false;
        pendingHideCallbacks = [];
        if (element) element.ontransitionend = null;
    }

    function hide(onHiddenCallback) {
        const element = getLyricsWidgetElement();

        if (onHiddenCallback) {
            pendingHideCallbacks.push(onHiddenCallback);
        }

        if (!element) {
            flushPendingHideCallbacks();
            return;
        }

        if (element.style.display === 'none') {
            element.ontransitionend = null;
            flushPendingHideCallbacks();
            return;
        }

        if (hideTransitionInProgress) return;

        hideTransitionInProgress = true;

        element.ontransitionend = function (event) {
            if (!event || event.propertyName !== 'transform') return;
            if (element.classList.contains('visible')) return;

            element.style.display = 'none';
            element.ontransitionend = null;
            hideTransitionInProgress = false;
            flushPendingHideCallbacks();
        };

        element.classList.remove('visible');
    }

    function syncLyricsVisibilityWithPlaybackState(isPlayingState, awaitingMusicStart) {
        if (!isPlayingState || awaitingMusicStart || !lyricsRevealUnlocked) {
            hide();
            return;
        }

        if (hasLyricsForCurrentTrack && latestLyricsData) {
            if (window.VisualizerWidget && window.VisualizerWidget.stop) {
                window.VisualizerWidget.stop();
            }

            show();

            if (window.LyricsWidget && !deferLyricsSwapUntilNextProgressEvent && renderedLyricsData !== latestLyricsData) {
                window.LyricsWidget.updateLyrics(latestLyricsData);
                renderedLyricsData = latestLyricsData;
            }
            return;
        }

        hide(function () {
            if (window.LyricsWidget) window.LyricsWidget.clear();
            renderedLyricsData = null;
        });

        if (window.VisualizerWidget && window.VisualizerWidget.start) {
            window.VisualizerWidget.start();
        }
    }

    function setLyricsDataForCurrentTrack(lyricsData) {
        const hasValidLines = lyricsData && Array.isArray(lyricsData.lines) && lyricsData.lines.length > 0;
        hasLyricsForCurrentTrack = hasValidLines;
        latestLyricsData = hasValidLines ? lyricsData : null;

        if (!hasValidLines) {
            renderedLyricsData = null;
            deferLyricsSwapUntilNextProgressEvent = false;
        }
    }

    function applyTrackContextLines(previousTrackLine, upcomingTrackLine) {
        if (!window.LyricsWidget || !window.LyricsWidget.setTrackContext) return;

        window.LyricsWidget.setTrackContext({
            previousTrackLine: previousTrackLine || '',
            upcomingTrackLine: upcomingTrackLine || '',
        });
    }

    function beginInterTrackBridgeTransition(previousTrackTailLine, upcomingTrackHeadLine) {
        if (!window.LyricsWidget || !window.LyricsWidget.enterInterTrackBridge) return;

        window.LyricsWidget.enterInterTrackBridge({
            previousTrackLine: previousTrackTailLine || '',
            upcomingTrackLine: upcomingTrackHeadLine || '',
        });

        deferLyricsSwapUntilNextProgressEvent = true;
    }

    function applyDeferredLyricsSwapIfPending() {
        if (!deferLyricsSwapUntilNextProgressEvent) return;
        if (!hasLyricsForCurrentTrack || !latestLyricsData || !window.LyricsWidget) return;

        window.LyricsWidget.updateLyrics(latestLyricsData);
        renderedLyricsData = latestLyricsData;
        deferLyricsSwapUntilNextProgressEvent = false;
    }

    function unlockLyricsReveal() {
        lyricsRevealUnlocked = true;
    }

    function lockLyricsReveal() {
        lyricsRevealUnlocked = false;
    }

    function hasLyrics() {
        return hasLyricsForCurrentTrack;
    }

    function clearAndReset() {
        cancelPendingHide();

        latestLyricsData = null;
        renderedLyricsData = null;
        hasLyricsForCurrentTrack = false;
        lyricsRevealUnlocked = false;
        deferLyricsSwapUntilNextProgressEvent = false;

        hide(function () {
            if (window.LyricsWidget) window.LyricsWidget.clear();
        });

        if (window.LyricsWidget && window.LyricsWidget.setTrackContext) {
            window.LyricsWidget.setTrackContext({ previousTrackLine: '', upcomingTrackLine: '' });
        }
    }

    window.LyricsController = {
        show,
        hide,
        cancelPendingHide,
        syncLyricsVisibilityWithPlaybackState,
        setLyricsDataForCurrentTrack,
        applyTrackContextLines,
        beginInterTrackBridgeTransition,
        applyDeferredLyricsSwapIfPending,
        unlockLyricsReveal,
        lockLyricsReveal,
        hasLyrics,
        clearAndReset,
    };
})();