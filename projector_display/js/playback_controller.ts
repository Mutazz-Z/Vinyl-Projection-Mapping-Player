(function () {
    const TRACKLIST_FADE_MS = 220;
    const RECORD_SLIDE_MS = 700;

    let playbackToken = 0;
    let sceneActive = false;

    function getPlaybackToken(): number {
        return playbackToken;
    }

    function clearAllTransitionTimers(): void {
        if (window.TracklistWidget && window.TracklistWidget.hide) {
            window.TracklistWidget.hide({
                visible: false,
                cancelPendingTransitions: true,
            });
        }
    }

    function runPlaybackEntranceSequence(token: number): void {
        if (token !== playbackToken) return;

        window.ProgressWidget?.show?.();
        window.TracklistWidget?.show?.();

        if (window.LyricsWidget) {
            window.LyricsWidget.show?.({
                isPlaybackVisualActive: sceneActive,
                isPlaying: true,
            });
        }
    }

    function prepareWidgetsForPlayback(projectorData: ProjectorData_t): void {
        window.ContextMessageWidget?.hide();
        window.QrCodeWidget?.hide?.();

        window.TracklistWidget?.show?.({
            visible: false,
            projectorData: projectorData,
            prepareForPlayback: true,
        });
        window.RecordWidget?.show?.({
            visible: false,
            prepareForPlayback: true,
        });

        window.ProgressWidget?.hide?.({ reset: true });
        window.TracklistWidget?.hide?.();

        window.VisualizerWidget?.hide?.();
        window.ProgressWidget?.hide?.({ visible: false, reset: true });
        window.LyricsWidget?.hide?.();
    }

    function runPlaybackRestoreSequence(token: number): void {
        if (token !== playbackToken) return;

        window.ProgressWidget?.show?.();
        window.TracklistWidget?.show?.();

        if (window.LyricsWidget) {
            window.LyricsWidget.show?.({
                isPlaybackVisualActive: sceneActive,
                isPlaying: true,
            });
        }
    }

    function prepareWidgetsForStop(token: number, isError: boolean): void {
        window.ProgressWidget?.hide?.({ reset: true });

        window.TracklistWidget?.hide?.({
            visible: false,
            beginStopSequence: {
                token: token,
                getPlaybackToken: getPlaybackToken,
            },
        });

        window.QrCodeWidget?.hide?.();

        window.VisualizerWidget?.hide?.();
        window.ProgressWidget?.hide?.({ visible: false, reset: true });
        window.LyricsWidget?.hide?.();

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
        const token = ++playbackToken;
        clearAllTransitionTimers();

        prepareWidgetsForStop(token, isError);
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
