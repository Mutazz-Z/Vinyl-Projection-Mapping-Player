(function () {
    let currentTracks = [];
    let currentDesignData = {};
    let recordSpinTimer = null;

    let introRevealStaggerTimer = null;
    let loadingFadeOutTimer = null;
    let recordHideCleanupTimer = null;
    let tracklistHideVisibilityTimer = null;
    let tracklistDataFlushTimer = null;
    let idleStateRestoreTimer = null;

    let designApplyToken = 0;
    let playbackToken = 0;
    let isPlayingState = false;
    let currentPlayingAlbum = '';
    let currentActiveTrackIndex = 0;
    let awaitingMusicStart = false;
    let awaitingMusicStartToken = 0;
    let pendingStartPayload = null;

    const RECORD_SLIDE_MS = 700;
    const TRACKLIST_FADE_MS = 220;

    function parseTracklist(str) {
        return window.TracklistWidget.parseTracklist(str);
    }

    function renderTracklist() {
        window.TracklistWidget.renderTracklist(currentTracks);
    }

    function clearTransitionTimers() {
        if (recordSpinTimer) {
            clearTimeout(recordSpinTimer);
            recordSpinTimer = null;
        }
        if (introRevealStaggerTimer) {
            clearTimeout(introRevealStaggerTimer);
            introRevealStaggerTimer = null;
        }
        if (loadingFadeOutTimer) {
            clearTimeout(loadingFadeOutTimer);
            loadingFadeOutTimer = null;
        }
        if (recordHideCleanupTimer) {
            clearTimeout(recordHideCleanupTimer);
            recordHideCleanupTimer = null;
        }
        if (tracklistHideVisibilityTimer) {
            clearTimeout(tracklistHideVisibilityTimer);
            tracklistHideVisibilityTimer = null;
        }
        if (tracklistDataFlushTimer) {
            clearTimeout(tracklistDataFlushTimer);
            tracklistDataFlushTimer = null;
        }
        if (idleStateRestoreTimer) {
            clearTimeout(idleStateRestoreTimer);
            idleStateRestoreTimer = null;
        }
    }

    function getTracklistContainer() {
        return window.TracklistWidget.getContainer();
    }

    function cleanDesignValue(val) {
        return typeof val === 'string' ? val.trim() : '';
    }

    function hasAnyDesignData(data) {
        if (!data) return false;
        return Boolean(
            data.inner_record_color ||
            data.inner_record_image ||
            data.outer_design_color ||
            data.outer_design_image ||
            data.overlay_art ||
            data.album_cover_art
        );
    }

    function getEffectiveDesignData(payload) {
        const incoming = {
            inner_record_color: cleanDesignValue(payload && payload.inner_record_color),
            inner_record_image: cleanDesignValue(payload && payload.inner_record_image),
            outer_design_color: cleanDesignValue(payload && payload.outer_design_color),
            outer_design_image: cleanDesignValue(payload && payload.outer_design_image),
            overlay_art: cleanDesignValue(payload && payload.overlay_art),
            album_cover_art: cleanDesignValue(payload && payload.album_cover_art)
        };

        const previous = currentDesignData || {};
        const merged = {
            inner_record_color: incoming.inner_record_color || previous.inner_record_color || '',
            inner_record_image: incoming.inner_record_image || previous.inner_record_image || '',
            outer_design_color: incoming.outer_design_color || previous.outer_design_color || '',
            outer_design_image: incoming.outer_design_image || previous.outer_design_image || '',
            overlay_art: incoming.overlay_art || previous.overlay_art || '',
            album_cover_art: incoming.album_cover_art || previous.album_cover_art || ''
        };

        if (!hasAnyDesignData(incoming) && hasAnyDesignData(previous)) {
            console.warn('Play payload missing design fields; using previous design values.');
        } else if (
            hasAnyDesignData(previous) &&
            (!incoming.outer_design_image || !incoming.overlay_art || !incoming.inner_record_image)
        ) {
            console.warn('Play payload partially missing design fields; merged with previous values.', {
                missing_outer_design_image: !incoming.outer_design_image,
                missing_overlay_art: !incoming.overlay_art,
                missing_inner_record_image: !incoming.inner_record_image
            });
        }

        return merged;
    }

    function setTracklistLinearLayout() {
        window.TracklistWidget.setLinearLayout(currentTracks);
    }

    function clampTrackIndex(index) {
        if (!currentTracks || currentTracks.length === 0) return 0;
        var n = Number(index);
        if (isNaN(n)) return currentActiveTrackIndex;
        if (n < 0) return 0;
        if (n >= currentTracks.length) return currentTracks.length - 1;
        return Math.floor(n);
    }

    function updateArcCarousel(activeIndex) {
        currentActiveTrackIndex = clampTrackIndex(activeIndex);
        window.TracklistWidget.updateArcCarousel(currentTracks, currentActiveTrackIndex);
    }

    function startVisualizer() {
        window.VisualizerWidget.start();
    }

    function stopVisualizer() {
        window.VisualizerWidget.stop();
    }

    function startFxVideo() {
        window.OverlayWidget.setActive(true);
    }

    function stopFxVideo() {
        window.OverlayWidget.setActive(false);
    }

    function applyDesignData(designData) {
        if (!hasAnyDesignData(designData)) return;

        const token = ++designApplyToken;
        const safeDesignData = designData || {};

        currentDesignData = safeDesignData;

        if (token === designApplyToken) {
            window.RecordWidget.applyDesignData(safeDesignData);
            window.OverlayWidget.setOverlayArt(safeDesignData.overlay_art);
        }

        if (safeDesignData.album_cover_art && token === designApplyToken) {
            const albumArtElement = document.getElementById('album-art');
            if (albumArtElement) {
                const safeAlbumUrl = safeDesignData.album_cover_art.replace(/"/g, '\\"');
                albumArtElement.style.backgroundImage = 'url("' + safeAlbumUrl + '")';
            }
        }
    }

    function buildRegistrationUrl(payload) {
        if (payload && payload.registration_url) return payload.registration_url;
        const uid = (payload && payload.uid) ? payload.uid : '';
        const piIp = window.PI_IP || '192.168.50.214';
        return 'http://' + piIp + ':8000/?uid=' + encodeURIComponent(uid);
    }

    function renderUnknownTagQR(payload) {
        const qrImg = document.getElementById('unknown-tag-qr');
        const uidLabel = document.getElementById('unknown-tag-uid');
        if (!qrImg || !uidLabel) return;

        const url = buildRegistrationUrl(payload);
        if (typeof QRCode !== 'undefined') {
            const tmp = document.createElement('div');
            tmp.style.cssText = 'position:fixed;left:-9999px;top:-9999px;visibility:hidden;';
            document.body.appendChild(tmp);
            new QRCode(tmp, {
                text: url,
                width: 240,
                height: 240,
                correctLevel: QRCode.CorrectLevel.M
            });
            const canvas = tmp.querySelector('canvas');
            if (canvas) {
                qrImg.src = canvas.toDataURL('image/png');
            } else {
                const img = tmp.querySelector('img');
                if (img && img.src) {
                    qrImg.src = img.src;
                }
            }
            document.body.removeChild(tmp);
        }

        uidLabel.textContent = (payload && payload.uid) ? ('UID: ' + payload.uid) : '';
    }

    function continuePlaybackAnimations(token) {
        const record = window.RecordWidget.getRecord();
        const recordContainer = window.RecordWidget.getRecordContainer();
        const tracklistContainer = getTracklistContainer();

        if (recordContainer) {
            recordContainer.style.display = '';
            void recordContainer.offsetWidth;

            introRevealStaggerTimer = setTimeout(function () {
                if (token !== playbackToken) return;

                if (tracklistContainer) tracklistContainer.classList.add('visible');
                recordContainer.classList.add('visible');
                if (tracklistContainer) tracklistContainer.classList.add('carousel');
                updateArcCarousel(0);

                recordSpinTimer = setTimeout(function () {
                    if (token !== playbackToken) return;
                    if (record) window.RecordWidget.setSpinState('running');
                }, RECORD_SLIDE_MS);
            }, TRACKLIST_FADE_MS);
        } else {
            if (tracklistContainer) tracklistContainer.classList.add('carousel');
            updateArcCarousel(0);
        }
    }

    function isProgressPlayingSignal(payload) {
        if (!payload) return false;
        const pos = Number(payload.position || 0);
        return (
            pos > 0 ||
            payload.playing === true ||
            payload.is_playing === true ||
            (typeof payload.state === 'string' && payload.state.toLowerCase() === 'playing')
        );
    }

    function resolveTrackIndexFromPayload(payload) {
        if (!payload) return undefined;

        var idx = payload.track_idx;
        if (idx === undefined && payload.track_index !== undefined) {
            idx = payload.track_index;
        }

        if (idx !== undefined && idx !== null && !isNaN(Number(idx))) {
            var numericIdx = Number(idx);
            if (numericIdx >= 0) {
                return numericIdx;
            }
        }

        var trackName = typeof payload.track_name === 'string' ? payload.track_name.trim().toLowerCase() : '';
        if (!trackName || !currentTracks || !currentTracks.length) {
            return undefined;
        }

        for (var i = 0; i < currentTracks.length; i++) {
            var name = (currentTracks[i] && currentTracks[i].name ? String(currentTracks[i].name) : '').trim().toLowerCase();
            if (!name) continue;
            if (name === trackName) return i;
        }

        for (var j = 0; j < currentTracks.length; j++) {
            var candidate = (currentTracks[j] && currentTracks[j].name ? String(currentTracks[j].name) : '').trim().toLowerCase();
            if (!candidate) continue;
            if (candidate.indexOf(trackName) !== -1 || trackName.indexOf(candidate) !== -1) {
                return j;
            }
        }

        return undefined;
    }

    function resolveTrackIndexFromEventFallback(payload) {
        if (!payload || !payload.event) return undefined;
        var eventName = String(payload.event).toLowerCase();
        if (!currentTracks || currentTracks.length === 0) return undefined;

        if (eventName === 'skip_forward' || eventName === 'track_changed') {
            return clampTrackIndex(currentActiveTrackIndex + 1);
        }
        if (eventName === 'skip_backward') {
            return clampTrackIndex(currentActiveTrackIndex - 1);
        }
        return undefined;
    }

    function resolveAwaitingMusicStart(progressPayload) {
        if (!awaitingMusicStart || awaitingMusicStartToken !== playbackToken) return;

        const token = playbackToken;
        const startPayload = pendingStartPayload;

        awaitingMusicStart = false;

        if (!startPayload) return;
        if (!window.LoadingWidget || !window.LoadingWidget.expandToOverlay) return;

        window.LoadingWidget.expandToOverlay().then(function () {
            if (token !== playbackToken) return;

            applyDesignData(startPayload.designData);
            startVisualizer();
            startFxVideo();

            window.InfoWidget.setAlbumAndArtist(startPayload.payload.album, startPayload.payload.artist);
            window.ProgressWidget.show();

            currentTracks = parseTracklist(startPayload.payload.tracks);
            renderTracklist();
            currentActiveTrackIndex = 0;

            const tracklistContainer = getTracklistContainer();
            if (tracklistContainer) {
                tracklistContainer.classList.remove('carousel');
                tracklistContainer.classList.remove('visible');
                setTracklistLinearLayout();
            }

            const record = window.RecordWidget.getRecord();
            if (record) window.RecordWidget.setSpinState('paused');

            continuePlaybackAnimations(token);

            loadingFadeOutTimer = setTimeout(function () {
                if (token !== playbackToken) return;
                if (window.LoadingWidget && window.LoadingWidget.fadeOut) {
                    window.LoadingWidget.fadeOut();
                }
            }, TRACKLIST_FADE_MS + RECORD_SLIDE_MS + 80);

            isPlayingState = true;
            currentPlayingAlbum = startPayload.album;

            if (progressPayload && progressPayload.duration) {
                window.ProgressWidget.update(progressPayload.position, progressPayload.duration);
                var startTrackIndex = resolveTrackIndexFromPayload(progressPayload);
                if (startTrackIndex === undefined) {
                    startTrackIndex = resolveTrackIndexFromEventFallback(progressPayload);
                }
                if (currentTracks.length > 0 && startTrackIndex !== undefined) {
                    updateArcCarousel(startTrackIndex);
                }
            } else {
                window.ProgressWidget.update(0, 0);
            }
        }).catch(function () {
            if (token !== playbackToken) return;

            applyDesignData(startPayload.designData);
            startVisualizer();
            startFxVideo();
            window.InfoWidget.setAlbumAndArtist(startPayload.payload.album, startPayload.payload.artist);
            window.ProgressWidget.show();
            currentTracks = parseTracklist(startPayload.payload.tracks);
            renderTracklist();
            continuePlaybackAnimations(token);
            isPlayingState = true;
            currentPlayingAlbum = startPayload.album;
        });
    }

    function stopPlayback() {
        isPlayingState = false;
        currentPlayingAlbum = '';
        awaitingMusicStart = false;
        pendingStartPayload = null;
        const token = ++playbackToken;
        clearTransitionTimers();

        window.InfoWidget.setIdle();
        window.ProgressWidget.hide();
        window.ProgressWidget.reset();

        const record = window.RecordWidget.getRecord();
        const recordContainer = window.RecordWidget.getRecordContainer();
        const tracklistContainer = getTracklistContainer();

        if (tracklistContainer) {
            tracklistContainer.classList.remove('carousel');
            tracklistContainer.classList.add('visible');
            setTracklistLinearLayout();
        }

        if (recordContainer) {
            recordContainer.classList.remove('visible');

            recordHideCleanupTimer = setTimeout(function () {
                if (token !== playbackToken) return;
                recordContainer.style.display = 'none';
                window.RecordWidget.clearDesignData();

                currentDesignData = {};
                window.OverlayWidget.clearOverlayArt();
            }, RECORD_SLIDE_MS);
        }

        if (record) window.RecordWidget.setSpinState('paused');

        if (tracklistContainer) {
            tracklistHideVisibilityTimer = setTimeout(function () {
                if (token !== playbackToken) return;
                tracklistContainer.classList.remove('visible');
            }, RECORD_SLIDE_MS);

            tracklistDataFlushTimer = setTimeout(function () {
                if (token !== playbackToken) return;
                window.TracklistWidget.clear();
                currentTracks = [];
                currentActiveTrackIndex = 0;
            }, RECORD_SLIDE_MS + TRACKLIST_FADE_MS);
        } else {
            window.TracklistWidget.clear();
            currentTracks = [];
            currentActiveTrackIndex = 0;
        }

        const unknownIndicator = document.getElementById('unknown-tag-indicator');
        if (unknownIndicator) unknownIndicator.classList.remove('visible');

        stopVisualizer();
        stopFxVideo();

        idleStateRestoreTimer = setTimeout(function () {
            if (token !== playbackToken) return;
            if (window.LoadingWidget && window.LoadingWidget.revealIdleFromOverlay) {
                window.LoadingWidget.revealIdleFromOverlay();
            } else if (window.LoadingWidget && window.LoadingWidget.showIdle) {
                window.LoadingWidget.showIdle();
            }
        }, RECORD_SLIDE_MS + TRACKLIST_FADE_MS);
    }

    function showUnknownTag(payload) {
        stopPlayback();
        renderUnknownTagQR(payload);

        const fxContainer = document.getElementById('fx-video-container');
        if (fxContainer) fxContainer.classList.add('active');

        const unknownIndicator = document.getElementById('unknown-tag-indicator');
        if (unknownIndicator) unknownIndicator.classList.add('visible');
    }

    function startPlayback(payload) {
        const effectiveDesignData = getEffectiveDesignData(payload);
        const incomingAlbum = (payload && payload.album) ? payload.album.trim() : '';

        if (awaitingMusicStart && incomingAlbum && pendingStartPayload && incomingAlbum === pendingStartPayload.album) {
            pendingStartPayload = {
                payload: payload,
                designData: effectiveDesignData,
                album: incomingAlbum
            };
            return;
        }

        if (isPlayingState && incomingAlbum && incomingAlbum === currentPlayingAlbum) {
            if (hasAnyDesignData(effectiveDesignData)) {
                applyDesignData(effectiveDesignData);
                startFxVideo();
            }
            window.InfoWidget.setAlbumAndArtist(payload.album, payload.artist);
            return;
        }

        isPlayingState = false;
        const token = ++playbackToken;
        clearTransitionTimers();

        awaitingMusicStart = true;
        awaitingMusicStartToken = token;
        pendingStartPayload = {
            payload: payload,
            designData: effectiveDesignData,
            album: incomingAlbum
        };

        const unknownIndicator = document.getElementById('unknown-tag-indicator');
        if (unknownIndicator) unknownIndicator.classList.remove('visible');

        window.InfoWidget.setIdle();
        window.ProgressWidget.hide();
        window.ProgressWidget.reset();
        window.TracklistWidget.clear();
        currentTracks = [];
        currentActiveTrackIndex = 0;

        const tracklistContainer = getTracklistContainer();
        if (tracklistContainer) {
            tracklistContainer.classList.remove('carousel');
            tracklistContainer.classList.remove('visible');
            setTracklistLinearLayout();
        }

        const record = window.RecordWidget.getRecord();
        const recordContainer = window.RecordWidget.getRecordContainer();

        if (record) window.RecordWidget.setSpinState('paused');

        if (recordContainer) {
            recordContainer.classList.remove('visible');
            recordContainer.style.display = 'none';
        }

        stopVisualizer();
        stopFxVideo();

        if (window.LoadingWidget && window.LoadingWidget.beginScanLoading) {
            window.LoadingWidget.beginScanLoading();
        }
    }

    function handleProgress(payload) {
        if (awaitingMusicStart && awaitingMusicStartToken === playbackToken && isProgressPlayingSignal(payload)) {
            resolveAwaitingMusicStart(payload);
            return;
        }

        if (!payload.duration || payload.duration === 0) return;

        window.ProgressWidget.update(payload.position, payload.duration);

        var activeTrackIndex = resolveTrackIndexFromPayload(payload);
        if (activeTrackIndex === undefined) {
            activeTrackIndex = resolveTrackIndexFromEventFallback(payload);
        }

        if (currentTracks.length > 0 && activeTrackIndex !== undefined) {
            updateArcCarousel(activeTrackIndex);
        }
    }

    window.ProjectorPlayback = {
        startPlayback: startPlayback,
        stopPlayback: stopPlayback,
        showUnknownTag: showUnknownTag,
        handleProgress: handleProgress,
        notifyMusicStarted: function (payload) {
            if (awaitingMusicStart && awaitingMusicStartToken === playbackToken) {
                resolveAwaitingMusicStart(payload || null);
            }
        }
    };

    if (window.LoadingWidget && window.LoadingWidget.showIdle) {
        window.LoadingWidget.showIdle();
    }
})();