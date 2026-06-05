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
    let pendingAwaitingProgressPayload = null;

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

    function isProgressPayloadSignallingActivePlayback(payload) {
        return Number(payload.position) > 0;
    }

    function applyLyricsForTrackIndex(trackIndex) {
        const lyrics = TrackResolver.getLyricsByTrackIndex(trackIndex);
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
        pendingAwaitingProgressPayload = null;

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

    function maybeRevealPlaybackWhenReady(payloadOverride) {
        if (!awaitingMusicStart || awaitingMusicStartToken !== playbackToken) return;
        if (currentMediaPlaybackState !== MediaPlaybackState.Playing) return;
        if (TrackResolver.getTrackNames().length === 0) return;

        beginPlaybackRevealSequence(payloadOverride || pendingAwaitingProgressPayload || null);
    }

    function finishRevealAfterLoadingExpands(token, startPayload, progressPayload) {
        RecordController.applyDesignToWidgets(startPayload.designData);
        window.OverlayWidget.setActive(true);

        window.InfoWidget.setAlbumAndArtist(
            startPayload.projectorData.tagData.mediaTitle,
            startPayload.projectorData.tagData.artist
        );
        window.ProgressWidget.show();

        const trackNames = TrackResolver.getTrackNames();
        TrackResolver.setActiveTrackIndex(0);
        TracklistController.prepareForPlaybackStart(trackNames);

        RecordController.pauseSpin();

        const startTrackIndex = resolveStartTrackIndexFromProgressPayload(progressPayload);
        TrackResolver.setActiveTrackIndex(startTrackIndex);
        TracklistController.showAsCarouselWithActiveTrack(trackNames, startTrackIndex);
        applyLyricsForTrackIndex(startTrackIndex);

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
        pendingAwaitingProgressPayload = null;

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
        pendingAwaitingProgressPayload = null;
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
        if (awaitingMusicStart && awaitingMusicStartToken === playbackToken) {
            if (isProgressPayloadSignallingActivePlayback(payload)) {
                pendingAwaitingProgressPayload = payload;
            }
            maybeRevealPlaybackWhenReady(payload);
            return;
        }

        if (!isPlayingState) return;

        const resolvedTrackIndex = TrackResolver.resolveTrackIndex(payload);

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
        if (!isPlayingState && !awaitingMusicStart) return;

        const playbackState = payload.state;

        if (payload.track_idx !== undefined || payload.track_index !== undefined || payload.track_name !== undefined) {
            const incomingTrackIndex = TrackResolver.resolveTrackIndex(payload);
            const isActualTrackChange = TrackResolver.isIncomingTrackDifferentFromCurrent(payload, incomingTrackIndex);

            if (isActualTrackChange) ProgressController.resetForTrackChange();

            if (incomingTrackIndex !== undefined) {
                TrackResolver.setActiveTrackIndex(incomingTrackIndex);
                TracklistController.showAsCarouselWithActiveTrack(TrackResolver.getTrackNames(), incomingTrackIndex);
                applyLyricsForTrackIndex(incomingTrackIndex);
            }
        }

        applyMediaPlaybackState(playbackState, true);

        if (awaitingMusicStart) {
            maybeRevealPlaybackWhenReady(payload);
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
        TrackResolver.setTrackNames(queueItemsArray);
        window.TracklistWidget.renderTracklist(queueItemsArray);
        TracklistController.updateCarouselForActiveTrack(queueItemsArray, TrackResolver.getActiveTrackIndex());

        if (awaitingMusicStart) {
            maybeRevealPlaybackWhenReady(pendingAwaitingProgressPayload);
        }
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
        },
    };

    if (window.LoadingWidget && window.LoadingWidget.showIdle) {
        window.LoadingWidget.showIdle();
    }
})();