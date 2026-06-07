(function () {
    const TRACKLIST_FADE_MS = 220;
    const RECORD_SLIDE_MS = 700;
    const LOADING_FADE_DELAY_MS = TRACKLIST_FADE_MS + RECORD_SLIDE_MS + 80;

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

        window.LoadingWidget?.play?.({
            fadeOutDelayMs: LOADING_FADE_DELAY_MS,
            onBeforeFadeOut: function () {
                if (window.LyricsWidget) {
                    window.LyricsWidget.show?.({
                        isPlaybackVisualActive: sceneActive,
                        isPlaying: true,
                    });
                }
            }
        });
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

    function runTagScanSequence(token: number): void {
        if (window.LoadingWidget && window.LoadingWidget.loading) {
            window.LoadingWidget.loading().then(function () {
                if (token !== playbackToken) return;
                runPlaybackEntranceSequence(token);
            });
        }
    }

    function runPlaybackRestoreSequence(token: number): void {
        if (token !== playbackToken) return;

        window.LoadingWidget?.play?.({ immediate: true });

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

    function runTagRemovalSequence(token: number, wasPlaying: boolean): void {
        if (wasPlaying) {
            window.LoadingWidget?.idle?.({
                fromOverlay: true,
                delayMs: RECORD_SLIDE_MS + TRACKLIST_FADE_MS + 100,
            });
            return;
        }

        window.LoadingWidget?.idle?.();
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

        runTagScanSequence(token);
    }

    function stopPlayback(isError = false): void {
        const wasPlaying = sceneActive;

        sceneActive = false;
        const token = ++playbackToken;
        clearAllTransitionTimers();

        prepareWidgetsForStop(token, isError);
        if (isError) return;

        runTagRemovalSequence(token, wasPlaying);
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
            window.LoadingWidget?.error?.();
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

    window.LoadingWidget?.idle?.();
})();
