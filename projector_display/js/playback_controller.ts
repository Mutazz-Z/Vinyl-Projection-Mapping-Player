(function () {
    const TRACKLIST_FADE_MS = 220;
    const RECORD_SLIDE_MS = 700;

    let playbackToken = 0;
    let sceneActive = false;

    function clearAllTransitionTimers(): void {
        return;
    }

    function runPlaybackEntranceSequence(token: number): void {
        if (token !== playbackToken) return;
    }

    function prepareWidgetsForPlayback(projectorData: ProjectorData_t): void {
        window.ContextMessageWidget?.hide();
        window.QrCodeWidget?.hide?.();

        TrackResolver.clearTrackPositionOnly();
        TrackResolver.buildLyricsLookupFromTrackList(projectorData?.tagData?.trackList || []);

        window.RecordWidget?.show?.({
            visible: false,
            prepareForPlayback: true,
        });

    }

    function runPlaybackRestoreSequence(token: number): void {
        if (token !== playbackToken) return;
    }

    function prepareWidgetsForStop(isError: boolean): void {
        window.QrCodeWidget?.hide?.();

        if (!isError && window.ContextMessageWidget) {
            window.ContextMessageWidget.hide();
        }
    }

    function startPlayback(projectorData: ProjectorData_t, options?: { restore?: boolean }): void {
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

    function stopPlayback(isError = false): void {
        sceneActive = false;
        ++playbackToken;
        clearAllTransitionTimers();

        prepareWidgetsForStop(isError);
    }

    function showUnknownTag(projectorData: ProjectorData_t): void {
        stopPlayback();
        window.QrCodeWidget?.show?.(projectorData);
    }

    function showPlaybackError(message: string, projectorData?: ProjectorData_t): void {
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
            if (currentToken !== playbackToken) return;
            window.RecordWidget?.ejectRecord?.();
            if (window.ContextMessageWidget) {
                window.ContextMessageWidget.show(message);
            } else {
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
