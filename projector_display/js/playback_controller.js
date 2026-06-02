(function () {
    const TRACKLIST_FADE_MS = TracklistController.TRACKLIST_FADE_MS;
    const RECORD_SLIDE_MS = TracklistController.RECORD_SLIDE_MS;
    const LOADING_FADE_DELAY_MS = TRACKLIST_FADE_MS + RECORD_SLIDE_MS + 80;

    let playbackToken = 0;
    let isPlayingState = false;
    let currentPlayingAlbum = '';
    let currentMediaPlaybackState = MediaPlaybackState.Idle;
    let awaitingMusicStart = false;
    let awaitingMusicStartToken = 0;
    let pendingStartPayload = null;

    let introRevealStaggerTimer = null;
    let recordSpinTimer = null;
    let loadingFadeOutTimer = null;
    let recordHideCleanupTimer = null;
    let tracklistHideTimer = null;
    let tracklistClearTimer = null;
    let idleStateRestoreTimer = null;

    function getPlaybackToken() {
        return playbackToken;
    }

    function clearAllTransitionTimers() {
        [
            recordSpinTimer, introRevealStaggerTimer, loadingFadeOutTimer,
            recordHideCleanupTimer, tracklistHideTimer, tracklistClearTimer,
            idleStateRestoreTimer,
        ].forEach(function (timer) { if (timer) clearTimeout(timer); });

        recordSpinTimer = introRevealStaggerTimer = loadingFadeOutTimer = null;
        recordHideCleanupTimer = tracklistHideTimer = tracklistClearTimer = null;
        idleStateRestoreTimer = null;
    }

    function normalizeMediaPlaybackState(state) {
        if (typeof state === 'number' && !isNaN(state)) return state;

        if (typeof state === 'string') {
            switch (state.trim().toLowerCase()) {
                case 'playing': return MediaPlaybackState.Playing;
                case 'paused': return MediaPlaybackState.Paused;
                case 'idle': return MediaPlaybackState.Idle;
                case 'buffering': return MediaPlaybackState.Buffering;
                case 'unknown': return MediaPlaybackState.Unknown;
                case 'stopped': return MediaPlaybackState.Stopped;
                case 'error': return MediaPlaybackState.Error;
                case 'offline':
                case 'off':
                case 'standby': return MediaPlaybackState.Offline;
            }
        }

        return null;
    }

    function isProgressPayloadSignallingActivePlayback(payload) {
        if (!payload) return false;
        const position = Number(payload.position || 0);
        return (
            position > 0 ||
            payload.playing === true ||
            payload.is_playing === true ||
            (typeof payload.state === 'string' && payload.state.toLowerCase() === 'playing')
        );
    }

    function applyLyricsForTrackIndex(trackIndex, previousTrackTailLineOverride) {
        const lyrics = TrackResolver.getLyricsByTrackIndex(trackIndex);
        const previousLine = previousTrackTailLineOverride ||
            TrackResolver.getLastNonEmptyLyricLine(TrackResolver.getLyricsByTrackIndex(trackIndex - 1));
        const upcomingLine = TrackResolver.getFirstNonEmptyLyricLine(TrackResolver.getLyricsByTrackIndex(trackIndex + 1));

        LyricsController.applyTrackContextLines(previousLine, upcomingLine);
        LyricsController.setLyricsDataForCurrentTrack(lyrics);
    }

    function applyMediaPlaybackState(nextState, showPlaybackFeedbackIcon) {
        if (nextState === null || nextState === undefined) return;

        const previousState = currentMediaPlaybackState;
        currentMediaPlaybackState = nextState;

        if (nextState === MediaPlaybackState.Playing) {
            window.RecordWidget.setSpinState('running');
            ProgressController.resume();
            LyricsController.syncLyricsVisibilityWithPlaybackState(isPlayingState, awaitingMusicStart);

            if (showPlaybackFeedbackIcon && previousState !== MediaPlaybackState.Playing) {
                if (window.OverlayWidget && window.OverlayWidget.showStatusIcon) {
                    window.OverlayWidget.showStatusIcon('play');
                }
            }
            return;
        }

        ProgressController.pause();
        window.RecordWidget.setSpinState('paused');

        if (!LyricsController.hasLyrics() && window.VisualizerWidget && window.VisualizerWidget.pause) {
            window.VisualizerWidget.pause();
        }

        if (nextState === MediaPlaybackState.Paused && previousState !== MediaPlaybackState.Paused) {
            if (window.OverlayWidget && window.OverlayWidget.showStatusIcon) {
                window.OverlayWidget.showStatusIcon('pause');
            }
        }
    }

    function beginPlaybackRevealSequence(progressPayload) {
        const token = playbackToken;
        const startPayload = pendingStartPayload;

        awaitingMusicStart = false;

        if (!startPayload) return;
        if (!window.LoadingWidget || !window.LoadingWidget.expandToOverlay) return;

        window.LoadingWidget.expandToOverlay().then(function () {
            if (token !== playbackToken) return;
            finishRevealAfterLoadingExpands(token, startPayload, progressPayload);
        }).catch(function () {
            if (token !== playbackToken) return;
            finishRevealAfterLoadingExpands(token, startPayload, null);
        });
    }

    function finishRevealAfterLoadingExpands(token, startPayload, progressPayload) {
        RecordController.applyDesignToWidgets(startPayload.designData);
        window.OverlayWidget.setActive(true);

        window.InfoWidget.setAlbumAndArtist(
            startPayload.projectorData.tagData.mediaTitle,
            startPayload.projectorData.tagData.artist
        );
        window.ProgressWidget.show();

        const trackNames = TrackResolver.getTrackNames().length > 0
            ? TrackResolver.getTrackNames()
            : TrackResolver.parseTrackNamesFromTrackList(startPayload.projectorData.tagData.trackList);

        TrackResolver.setTrackNames(trackNames);
        TrackResolver.setActiveTrackIndex(0);
        TracklistController.prepareForPlaybackStart(trackNames);

        RecordController.pauseSpin();

        const startTrackIndex = resolveStartTrackIndexFromProgressPayload(progressPayload);
        TrackResolver.setActiveTrackIndex(startTrackIndex);
        TracklistController.showAsCarouselWithActiveTrack(trackNames, startTrackIndex);
        applyLyricsForTrackIndex(startTrackIndex, '');

        const initialTrackHasNoLyrics = !LyricsController.hasLyrics();
        if (initialTrackHasNoLyrics && window.VisualizerWidget && window.VisualizerWidget.start) {
            window.VisualizerWidget.start();
        }

        revealRecordAndTracklist(token);

        loadingFadeOutTimer = setTimeout(function () {
            if (token !== playbackToken) return;
            if (window.LoadingWidget && window.LoadingWidget.fadeOut) window.LoadingWidget.fadeOut();
            LyricsController.unlockLyricsReveal();
            LyricsController.syncLyricsVisibilityWithPlaybackState(isPlayingState, awaitingMusicStart);
        }, LOADING_FADE_DELAY_MS);

        isPlayingState = true;
        currentPlayingAlbum = startPayload.album;

        if (progressPayload && progressPayload.duration) {
            ProgressController.applyProgressSample(progressPayload.position, progressPayload.duration, { running: true });
        } else {
            ProgressController.reset();
            window.ProgressWidget.update(0, 0);
        }
    }

    function resolveStartTrackIndexFromProgressPayload(progressPayload) {
        if (!progressPayload || !progressPayload.duration) return 0;
        return TrackResolver.resolveTrackIndex(progressPayload) ?? 0;
    }

    function revealRecordAndTracklist(token) {
        const timers = RecordController.revealRecordAndTracklistWithStaggeredSpin(token, getPlaybackToken, function () {
            const tracklistContainer = window.TracklistWidget.getContainer();
            if (tracklistContainer) {
                tracklistContainer.classList.add('visible');
                tracklistContainer.classList.add('carousel');
            }
            TracklistController.showAsCarouselWithActiveTrack(
                TrackResolver.getTrackNames(),
                TrackResolver.getActiveTrackIndex()
            );
        });
        if (timers) introRevealStaggerTimer = timers.staggerTimer;
    }

    function startPlayback(projectorData) {
        localStorage.setItem('vinyl_projection_active_payload', JSON.stringify(projectorData.toJson()));

        const effectiveDesignData = RecordController.resolveEffectiveDesignData(projectorData);
        const incomingAlbum = projectorData.tagData ? projectorData.tagData.mediaTitle.trim() : '';

        if (awaitingMusicStart && incomingAlbum && pendingStartPayload && incomingAlbum === pendingStartPayload.album) {
            pendingStartPayload = { projectorData, designData: effectiveDesignData, album: incomingAlbum };
            return;
        }

        if (isPlayingState && incomingAlbum && incomingAlbum === currentPlayingAlbum) {
            if (projectorData.hasDesignData()) {
                RecordController.applyDesignToWidgets(effectiveDesignData);
                window.OverlayWidget.setActive(true);
            }
            TrackResolver.buildLyricsLookupFromTrackList(projectorData.tagData.trackList);
            window.InfoWidget.setAlbumAndArtist(projectorData.tagData.mediaTitle, projectorData.tagData.artist);

            if (TrackResolver.getTrackNames().length === 0) {
                const trackNames = TrackResolver.parseTrackNamesFromTrackList(projectorData.tagData.trackList);
                TrackResolver.setTrackNames(trackNames);
            }

            TracklistController.showAsCarouselWithActiveTrack(
                TrackResolver.getTrackNames(),
                TrackResolver.getActiveTrackIndex()
            );
            return;
        }

        isPlayingState = false;
        const token = ++playbackToken;
        clearAllTransitionTimers();
        LyricsController.lockLyricsReveal();

        awaitingMusicStart = true;
        awaitingMusicStartToken = token;
        pendingStartPayload = { projectorData, designData: effectiveDesignData, album: incomingAlbum };

        const unknownTagIndicator = document.getElementById('unknown-tag-indicator');
        if (unknownTagIndicator) unknownTagIndicator.classList.remove('visible');

        if (window.ContextMessageWidget) window.ContextMessageWidget.hide();
        if (window.QrCodeWidget && window.QrCodeWidget.hide) window.QrCodeWidget.hide();

        RecordController.resetForNewPlayback();
        window.InfoWidget.setIdle();
        window.ProgressWidget.hide();
        window.ProgressWidget.reset();

        TrackResolver.clearTrackPositionOnly();
        TrackResolver.buildLyricsLookupFromTrackList(projectorData.tagData.trackList);
        TracklistController.clear();

        window.OverlayWidget.setActive(false);
        if (window.VisualizerWidget && window.VisualizerWidget.stop) window.VisualizerWidget.stop();
        ProgressController.reset();
        LyricsController.clearAndReset();

        if (window.LoadingWidget && window.LoadingWidget.beginScanLoading) {
            window.LoadingWidget.beginScanLoading();
        }
    }

    function stopPlayback(isError) {
        localStorage.removeItem('vinyl_projection_active_payload');

        const wasPlaying = isPlayingState || !!(idleStateRestoreTimer || recordHideCleanupTimer);

        isPlayingState = false;
        currentPlayingAlbum = '';
        currentMediaPlaybackState = MediaPlaybackState.Idle;
        awaitingMusicStart = false;
        pendingStartPayload = null;
        const token = ++playbackToken;
        clearAllTransitionTimers();

        window.InfoWidget.setIdle();
        window.ProgressWidget.hide();
        window.ProgressWidget.reset();

        RecordController.pauseSpin();

        const trackNamesBeforeClear = TrackResolver.getTrackNames().slice();
        const timers = TracklistController.hideAndClearAfterStopAnimation(token, getPlaybackToken, trackNamesBeforeClear, function () {
            TrackResolver.clear();
        });

        if (timers) {
            tracklistHideTimer = timers.hideTimer;
            tracklistClearTimer = timers.clearTimer;
        }

        if (!isError) {
            recordHideCleanupTimer = RecordController.hideRecordContainerWithCleanup(token, getPlaybackToken, RECORD_SLIDE_MS);
        } else {
            const recordContainer = window.RecordWidget.getRecordContainer();
            if (recordContainer) recordContainer.classList.remove('visible');
        }

        const unknownTagIndicator = document.getElementById('unknown-tag-indicator');
        if (unknownTagIndicator) unknownTagIndicator.classList.remove('visible');

        if (window.QrCodeWidget && window.QrCodeWidget.hide) window.QrCodeWidget.hide();

        window.OverlayWidget.setActive(false);
        if (window.VisualizerWidget && window.VisualizerWidget.stop) window.VisualizerWidget.stop();
        ProgressController.reset();
        LyricsController.clearAndReset();

        if (!isError && window.ContextMessageWidget) window.ContextMessageWidget.hide();
        if (isError) return;

        if (window.LoadingWidget) {
            if (wasPlaying) {
                idleStateRestoreTimer = setTimeout(function () {
                    if (token !== playbackToken) return;
                    if (window.LoadingWidget.revealIdleFromOverlay) {
                        window.LoadingWidget.revealIdleFromOverlay();
                    } else if (window.LoadingWidget.showIdle) {
                        window.LoadingWidget.showIdle();
                    }
                }, RECORD_SLIDE_MS + TRACKLIST_FADE_MS + 100);
            } else if (window.LoadingWidget.showIdle) {
                window.LoadingWidget.showIdle();
            }
        }
    }

    function handleProgress(payload) {
        if (awaitingMusicStart && awaitingMusicStartToken === playbackToken && isProgressPayloadSignallingActivePlayback(payload)) {
            beginPlaybackRevealSequence(payload);
            return;
        }

        if (!isPlayingState) return;

        const resolvedTrackIndex = TrackResolver.resolveTrackIndex(payload);

        LyricsController.applyDeferredLyricsSwapIfPending();

        if (TrackResolver.getTrackNames().length > 0 && resolvedTrackIndex !== undefined) {
            TrackResolver.setActiveTrackIndex(resolvedTrackIndex);
            TracklistController.showAsCarouselWithActiveTrack(TrackResolver.getTrackNames(), resolvedTrackIndex);
        }

        if (!payload.duration || payload.duration === 0) return;

        ProgressController.applyProgressSample(payload.position, payload.duration, {
            running: currentMediaPlaybackState === MediaPlaybackState.Playing,
        });
    }

    function handlePlaybackEvent(payload) {
        if (!payload) return;
        if (!isPlayingState && !awaitingMusicStart) return;

        const eventName = typeof payload.event === 'string' ? payload.event.toLowerCase() : '';
        const normalizedState = normalizeMediaPlaybackState(payload.state);
        const stateName = typeof payload.state === 'string' ? payload.state.toLowerCase() : '';

        if (eventName === 'track_changed' || payload.track_index !== undefined || payload.track_name) {
            const incomingTrackIndex = TrackResolver.resolveTrackIndex(payload);
            const isActualTrackChange = TrackResolver.isIncomingTrackDifferentFromCurrent(payload, incomingTrackIndex);
            const previousTrackTailLine = isActualTrackChange
                ? TrackResolver.getLastNonEmptyLyricLine(TrackResolver.getLyricsByTrackIndex(TrackResolver.getActiveTrackIndex()))
                : '';

            if (isActualTrackChange) {
                ProgressController.resetForTrackChange();

                const upcomingTrackHeadLine = incomingTrackIndex !== undefined
                    ? TrackResolver.getFirstNonEmptyLyricLine(TrackResolver.getLyricsByTrackIndex(incomingTrackIndex))
                    : TrackResolver.getFirstNonEmptyLyricLine(TrackResolver.getLyricsByTrackName(payload.track_name));

                LyricsController.beginInterTrackBridgeTransition(previousTrackTailLine, upcomingTrackHeadLine);
            }

            if (incomingTrackIndex !== undefined) {
                TrackResolver.setActiveTrackIndex(incomingTrackIndex);
                TracklistController.showAsCarouselWithActiveTrack(TrackResolver.getTrackNames(), incomingTrackIndex);
                applyLyricsForTrackIndex(incomingTrackIndex, previousTrackTailLine);
            } else if (payload.track_name) {
                LyricsController.setLyricsDataForCurrentTrack(TrackResolver.getLyricsByTrackName(payload.track_name));
            }
        }

        if (normalizedState !== null) {
            applyMediaPlaybackState(normalizedState, true);
        } else if (eventName === 'play' || stateName === 'playing') {
            applyMediaPlaybackState(MediaPlaybackState.Playing, true);
        } else if (eventName === 'pause' || stateName === 'paused') {
            applyMediaPlaybackState(MediaPlaybackState.Paused, true);
        } else if (eventName === 'stop' || stateName === 'stopped') {
            applyMediaPlaybackState(MediaPlaybackState.Stopped, false);
        }
    }

    function showUnknownTag(projectorData) {
        stopPlayback();
        if (window.QrCodeWidget && window.QrCodeWidget.show) window.QrCodeWidget.show(projectorData);
    }

    function showPlaybackError(message, projectorData) {
        let designData = null;

        if (projectorData && projectorData.hasDesignData()) {
            designData = RecordController.resolveEffectiveDesignData(projectorData);
        } else if (pendingStartPayload && pendingStartPayload.designData) {
            designData = pendingStartPayload.designData;
        }

        const wasPlaying = isPlayingState;
        stopPlayback(true);
        const currentToken = playbackToken;

        if (designData) RecordController.applyDesignToWidgets(designData);

        const ejectDelay = wasPlaying ? (RECORD_SLIDE_MS + TRACKLIST_FADE_MS) : 0;

        setTimeout(function () {
            if (currentToken !== playbackToken) return;
            if (window.LoadingWidget && window.LoadingWidget.showError) window.LoadingWidget.showError();
            if (window.RecordWidget && window.RecordWidget.ejectRecord) window.RecordWidget.ejectRecord();
            if (window.ContextMessageWidget) {
                window.ContextMessageWidget.showError(message);
            } else {
                console.error('Playback Error:', message);
            }
        }, ejectDelay + 50);
    }

    function updateQueueList(queueItemsArray) {
        if (!Array.isArray(queueItemsArray)) return;
        TrackResolver.setTrackNames(queueItemsArray);
        window.TracklistWidget.renderTracklist(queueItemsArray);
        TracklistController.updateCarouselForActiveTrack(queueItemsArray, TrackResolver.getActiveTrackIndex());
    }

    window.ProjectorPlayback = {
        startPlayback,
        stopPlayback,
        showUnknownTag,
        showPlaybackError,
        handleProgress,
        handlePlaybackEvent,
        updateQueueList,

        notifyMusicStarted: function (payload) {
            if (awaitingMusicStart && awaitingMusicStartToken === playbackToken) {
                beginPlaybackRevealSequence(payload || null);
            }
        },

        restoreState: function () {
            try {
                const saved = localStorage.getItem('vinyl_projection_active_payload');
                if (!saved) return;

                const projectorData = ProjectorData_t.fromJson(JSON.parse(saved));

                if (window.LoadingWidget) {
                    window.LoadingWidget.forceHide();
                    this._originalScan = window.LoadingWidget.beginScanLoading;
                    this._originalExpand = window.LoadingWidget.expandToOverlay;
                    window.LoadingWidget.beginScanLoading = () => Promise.resolve();
                    window.LoadingWidget.expandToOverlay = () => Promise.resolve();
                }

                this.startPlayback(projectorData);

                setTimeout(() => {
                    this.notifyMusicStarted(projectorData);
                    this.handlePlaybackEvent({ event: 'play', state: 'playing' });

                    if (window.LoadingWidget && this._originalScan) {
                        window.LoadingWidget.beginScanLoading = this._originalScan;
                        window.LoadingWidget.expandToOverlay = this._originalExpand;
                    }
                }, 50);
            } catch (error) {
                console.warn('Failed to restore playback state from refresh:', error);
            }
        },
    };

    if (window.LoadingWidget && window.LoadingWidget.showIdle) {
        window.LoadingWidget.showIdle();
    }
})();