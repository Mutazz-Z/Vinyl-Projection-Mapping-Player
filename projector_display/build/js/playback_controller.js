"use strict";
(function () {
    const TRACKLIST_FADE_MS = 220;
    const RECORD_SLIDE_MS = 700;
    let playbackToken = 0;
    let sceneActive = false;
    function clearAllTransitionTimers() {
        return;
    }
    function runPlaybackEntranceSequence(token) {
        if (token !== playbackToken)
            return;
        if (window.LyricsWidget) {
            window.LyricsWidget.show?.({
                isPlaybackVisualActive: sceneActive,
                isPlaying: true,
            });
        }
    }
    function prepareWidgetsForPlayback(projectorData) {
        window.ContextMessageWidget?.hide();
        window.QrCodeWidget?.hide?.();
        TrackResolver.clearTrackPositionOnly();
        TrackResolver.buildLyricsLookupFromTrackList(projectorData?.tagData?.trackList || []);
        window.RecordWidget?.show?.({
            visible: false,
            prepareForPlayback: true,
        });
        window.VisualizerWidget?.hide?.();
        window.LyricsWidget?.hide?.();
    }
    function runPlaybackRestoreSequence(token) {
        if (token !== playbackToken)
            return;
        if (window.LyricsWidget) {
            window.LyricsWidget.show?.({
                isPlaybackVisualActive: sceneActive,
                isPlaying: true,
            });
        }
    }
    function prepareWidgetsForStop(isError) {
        window.QrCodeWidget?.hide?.();
        window.VisualizerWidget?.hide?.();
        window.LyricsWidget?.hide?.();
        if (!isError && window.ContextMessageWidget) {
            window.ContextMessageWidget.hide();
        }
    }
    function startPlayback(projectorData, options) {
        const startOptions = options || {};
        const token = ++playbackToken;
        sceneActive = true;
        clearAllTransitionTimers();
        prepareWidgetsForPlayback(projectorData);
        if (startOptions.restore) {
            runPlaybackRestoreSequence(token);
            return;
        }
        runPlaybackEntranceSequence(token);
    }
    function stopPlayback(isError = false) {
        sceneActive = false;
        ++playbackToken;
        clearAllTransitionTimers();
        prepareWidgetsForStop(isError);
    }
    function showUnknownTag(projectorData) {
        stopPlayback();
        window.QrCodeWidget?.show?.(projectorData);
    }
    function showPlaybackError(message, projectorData) {
        const wasPlaying = sceneActive;
        stopPlayback(true);
        const currentToken = playbackToken;
        if (projectorData) {
            window.RecordWidget?.show?.({
                visible: false,
            });
        }
        const ejectDelay = wasPlaying ? (RECORD_SLIDE_MS + TRACKLIST_FADE_MS) : 0;
        setTimeout(function () {
            if (currentToken !== playbackToken)
                return;
            window.RecordWidget?.ejectRecord?.();
            if (window.ContextMessageWidget) {
                window.ContextMessageWidget.show(message);
            }
            else {
                console.error('Playback Error:', message);
            }
        }, ejectDelay + 50);
    }
    window.ProjectorPlayback = {
        startPlayback,
        stopPlayback,
        showUnknownTag,
        showPlaybackError,
    };
})();
