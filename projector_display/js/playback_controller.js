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
    let currentMediaPlaybackState = MediaPlaybackState.Idle;
    let awaitingMusicStart = false;
    let awaitingMusicStartToken = 0;
    let pendingStartPayload = null;
    let hasLyrics = false;
    let lyricsRevealUnlocked = false;
    let latestLyricsData = null;
    let renderedLyricsData = null;
    let deferLyricsSwapUntilProgress = false;
    let lyricsHideInProgress = false;
    let lyricsHiddenCallbacks = [];
    let trackLyricsByTrackName = {};
    let progressAnimationFrame = null;
    let playbackClockRunning = false;
    let sampledProgressSeconds = 0;
    let sampledDurationSeconds = 0;
    let sampledAtMs = 0;
    let lastRenderedProgressSeconds = null;

    const RECORD_SLIDE_MS = 700;
    const TRACKLIST_FADE_MS = 220;
    const PROGRESS_RENDER_EPSILON_SECONDS = 0.03;
    const PROGRESS_SEEK_RESET_SECONDS = 1.5;

    function parseTracklist(trackList) {
        if (Array.isArray(trackList)) {
            return trackList.map(function (entry) { return entry.track || ''; }).filter(Boolean);
        }
        return [];
    }

    function normaliseTrackName(name) {
        return typeof name === 'string' ? name.trim().toLowerCase() : '';
    }

    function normalizeMediaPlaybackState(state) {
        if (typeof state === 'number' && !isNaN(state)) {
            return state;
        }

        if (typeof state === 'string') {
            const lowerState = state.trim().toLowerCase();
            switch (lowerState) {
                case 'playing':
                    return MediaPlaybackState.Playing;
                case 'paused':
                    return MediaPlaybackState.Paused;
                case 'idle':
                    return MediaPlaybackState.Idle;
                case 'buffering':
                    return MediaPlaybackState.Buffering;
                case 'unknown':
                    return MediaPlaybackState.Unknown;
                case 'stopped':
                    return MediaPlaybackState.Stopped;
                case 'error':
                    return MediaPlaybackState.Error;
                case 'offline':
                case 'off':
                case 'standby':
                    return MediaPlaybackState.Offline;
            }
        }

        return null;
    }

    function isMediaStatePlaying(state) {
        return state === MediaPlaybackState.Playing;
    }

    function applyMediaPlaybackState(nextState, showPlayFeedback) {
        if (nextState === null || nextState === undefined) return;

        const previousState = currentMediaPlaybackState;
        currentMediaPlaybackState = nextState;

        if (isMediaStatePlaying(nextState)) {
            if (window.RecordWidget && window.RecordWidget.setSpinState) {
                window.RecordWidget.setSpinState('running');
            }
            resumeProgressClock();
            syncLyricsPresentation();

            if (showPlayFeedback && previousState !== MediaPlaybackState.Playing) {
                if (window.OverlayWidget && window.OverlayWidget.showStatusIcon) {
                    window.OverlayWidget.showStatusIcon('play');
                }
            }
            return;
        }

        pauseProgressClock();

        if (window.RecordWidget && window.RecordWidget.setSpinState) {
            window.RecordWidget.setSpinState('paused');
        }

        if (!hasLyrics && window.VisualizerWidget && window.VisualizerWidget.pause) {
            window.VisualizerWidget.pause();
        }

        if (nextState === MediaPlaybackState.Paused && previousState !== MediaPlaybackState.Paused) {
            if (window.OverlayWidget && window.OverlayWidget.showStatusIcon) {
                window.OverlayWidget.showStatusIcon('pause');
            }
        }
    }

    function setTrackLyricsData(lyricsData) {
        const hasLines = lyricsData && Array.isArray(lyricsData.lines) && lyricsData.lines.length > 0;
        hasLyrics = hasLines;
        latestLyricsData = hasLines ? lyricsData : null;
        if (!hasLines) {
            renderedLyricsData = null;
            deferLyricsSwapUntilProgress = false;
        }
        syncLyricsPresentation();
    }

    function buildTrackLyricsLookup(trackList) {
        trackLyricsByTrackName = {};
        if (!Array.isArray(trackList)) return;

        trackList.forEach(function (entry) {
            const key = normaliseTrackName(entry && entry.track);
            if (!key) return;

            const lyrics = entry && entry.lyrics;
            if (!lyrics || !Array.isArray(lyrics.lines) || lyrics.lines.length === 0) return;

            trackLyricsByTrackName[key] = lyrics;
        });
    }

    function getTrackLyricsByName(trackName) {
        const key = normaliseTrackName(trackName);
        if (!key) return null;

        const lyrics = trackLyricsByTrackName[key];
        if (!lyrics || !Array.isArray(lyrics.lines) || lyrics.lines.length === 0) return null;
        return lyrics;
    }

    function getTrackLyricsByIndex(trackIndex) {
        if (!currentTracks || currentTracks.length === 0) return null;
        const safeIndex = clampTrackIndex(trackIndex);
        return getTrackLyricsByName(currentTracks[safeIndex]);
    }

    function getFirstLyricText(lyricsData) {
        if (!lyricsData || !Array.isArray(lyricsData.lines) || lyricsData.lines.length === 0) return '';
        for (var i = 0; i < lyricsData.lines.length; i++) {
            var line = lyricsData.lines[i];
            if (line && typeof line.text === 'string' && line.text.trim() !== '') {
                return line.text;
            }
        }
        return '';
    }

    function getLastLyricText(lyricsData) {
        if (!lyricsData || !Array.isArray(lyricsData.lines) || lyricsData.lines.length === 0) return '';
        for (var i = lyricsData.lines.length - 1; i >= 0; i--) {
            var line = lyricsData.lines[i];
            if (line && typeof line.text === 'string' && line.text.trim() !== '') {
                return line.text;
            }
        }
        return '';
    }

    function applyLyricsTrackContextForIndex(trackIndex, previousTrackLineOverride) {
        if (!window.LyricsWidget || !window.LyricsWidget.setTrackContext) return;

        var previousTrackLine = previousTrackLineOverride || '';
        var upcomingTrackLine = '';

        if (!previousTrackLine && trackIndex > 0) {
            previousTrackLine = getLastLyricText(getTrackLyricsByIndex(trackIndex - 1));
        }

        upcomingTrackLine = getFirstLyricText(getTrackLyricsByIndex(trackIndex + 1));

        window.LyricsWidget.setTrackContext({
            previousTrackLine: previousTrackLine,
            upcomingTrackLine: upcomingTrackLine
        });
    }

    function applyTrackLyricsForTrackName(trackName) {
        const key = normaliseTrackName(trackName);
        if (!key) return false;

        const lyrics = getTrackLyricsByName(trackName);
        if (!lyrics || !Array.isArray(lyrics.lines) || lyrics.lines.length === 0) return false;

        if (currentTracks && currentTracks.length > 0) {
            for (var i = 0; i < currentTracks.length; i++) {
                if (normaliseTrackName(currentTracks[i]) === key) {
                    applyLyricsTrackContextForIndex(i, '');
                    break;
                }
            }
        }

        setTrackLyricsData(lyrics);
        return true;
    }

    function applyTrackLyricsForTrackIndex(trackIndex, options) {
        if (!currentTracks || currentTracks.length === 0) return false;
        const safeIndex = clampTrackIndex(trackIndex);
        applyLyricsTrackContextForIndex(safeIndex, options && options.previousTrackLineOverride ? options.previousTrackLineOverride : '');
        return applyTrackLyricsForTrackName(currentTracks[safeIndex]);
    }

    function renderTracklist() {
        window.TracklistWidget.renderTracklist(currentTracks);
    }

    function getNowMs() {
        if (typeof performance !== 'undefined' && performance.now) {
            return performance.now();
        }
        return Date.now();
    }

    function cancelProgressAnimation() {
        if (progressAnimationFrame !== null) {
            cancelAnimationFrame(progressAnimationFrame);
            progressAnimationFrame = null;
        }
    }

    function getProjectedProgressSeconds(nowMs) {
        var projected = Number(sampledProgressSeconds || 0);
        var duration = Number(sampledDurationSeconds || 0);

        if (playbackClockRunning && sampledAtMs > 0) {
            projected += Math.max(0, ((nowMs || getNowMs()) - sampledAtMs) / 1000);
        }

        if (duration > 0) {
            projected = Math.min(Math.max(projected, 0), duration);
        } else {
            projected = Math.max(projected, 0);
        }

        return projected;
    }

    function renderProgressFrame(force) {
        if (!sampledDurationSeconds || sampledDurationSeconds <= 0) return;

        var projected = getProjectedProgressSeconds();
        if (!force && lastRenderedProgressSeconds !== null && Math.abs(projected - lastRenderedProgressSeconds) < PROGRESS_RENDER_EPSILON_SECONDS) {
            return;
        }

        lastRenderedProgressSeconds = projected;
        window.ProgressWidget.update(projected, sampledDurationSeconds);
        if (window.LyricsWidget) window.LyricsWidget.syncProgress(projected);
    }

    function scheduleProgressAnimation() {
        if (progressAnimationFrame !== null || !playbackClockRunning) return;

        progressAnimationFrame = requestAnimationFrame(function tick() {
            progressAnimationFrame = null;

            if (!isPlayingState || awaitingMusicStart || !playbackClockRunning) return;

            renderProgressFrame(false);
            scheduleProgressAnimation();
        });
    }

    function applyProgressSample(position, duration, options) {
        var nextDuration = Number(duration || 0);
        var samplePosition = Number(position || 0);
        var nowMs = getNowMs();
        var projectedBeforeSample = getProjectedProgressSeconds(nowMs);
        var shouldRunClock = options && options.running === true;
        var shouldPauseClock = options && options.running === false;
        var sampleDriftSeconds = samplePosition - projectedBeforeSample;
        var shouldSnapToSample = !playbackClockRunning ||
            shouldPauseClock ||
            lastRenderedProgressSeconds === null ||
            Math.abs(sampleDriftSeconds) > PROGRESS_SEEK_RESET_SECONDS;

        sampledDurationSeconds = nextDuration > 0 ? nextDuration : sampledDurationSeconds;

        if (shouldSnapToSample) {
            sampledProgressSeconds = Math.max(0, samplePosition);
        } else {
            sampledProgressSeconds = Math.max(0, Math.max(projectedBeforeSample, samplePosition));
        }

        sampledAtMs = nowMs;

        if (shouldPauseClock) {
            playbackClockRunning = false;
            cancelProgressAnimation();
        } else if (shouldRunClock) {
            playbackClockRunning = true;
        }

        renderProgressFrame(true);

        if (playbackClockRunning) {
            scheduleProgressAnimation();
        }
    }

    function pauseProgressClock() {
        if (!playbackClockRunning) return;
        applyProgressSample(getProjectedProgressSeconds(), sampledDurationSeconds, { running: false });
    }

    function resumeProgressClock() {
        if (playbackClockRunning || !sampledDurationSeconds || sampledDurationSeconds <= 0) return;
        applyProgressSample(getProjectedProgressSeconds(), sampledDurationSeconds, { running: true });
    }

    function resetProgressClock() {
        cancelProgressAnimation();
        playbackClockRunning = false;
        sampledProgressSeconds = 0;
        sampledDurationSeconds = 0;
        sampledAtMs = 0;
        lastRenderedProgressSeconds = null;
    }

    function resetProgressClockForTrackChange() {
        cancelProgressAnimation();
        sampledProgressSeconds = 0;
        sampledDurationSeconds = 0;
        sampledAtMs = getNowMs();
        lastRenderedProgressSeconds = null;

        if (window.ProgressWidget) {
            window.ProgressWidget.update(0, 0);
        }
        if (window.LyricsWidget) {
            window.LyricsWidget.syncProgress(0);
        }

        if (playbackClockRunning) {
            scheduleProgressAnimation();
        }
    }

    function isTrackChangeForDifferentTrack(payload, incomingIndex) {
        if (!payload) return false;

        if (incomingIndex !== undefined && incomingIndex !== currentActiveTrackIndex) {
            return true;
        }

        if (payload.track_name && currentTracks && currentTracks.length > 0) {
            var currentTrackName = currentTracks[currentActiveTrackIndex] || '';
            return normaliseTrackName(payload.track_name) !== normaliseTrackName(currentTrackName);
        }

        return false;
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

    function hasAnyDesignData(projectorData) {
        if (!projectorData || !projectorData.tagData) return false;
        const tag = projectorData.tagData;
        return Boolean(
            tag.labelColor ||
            tag.labelImage ||
            tag.outerRingColor ||
            tag.outerRingImage ||
            tag.projectionOverlay ||
            tag.coverImage
        );
    }

    function getEffectiveDesignData(projectorData) {
        const tag = (projectorData && projectorData.tagData) ? projectorData.tagData : {};

        const incoming = {
            labelColor: cleanDesignValue(tag.labelColor),
            labelImage: cleanDesignValue(tag.labelImage),
            outerRingColor: cleanDesignValue(tag.outerRingColor),
            outerRingImage: cleanDesignValue(tag.outerRingImage),
            projectionOverlay: cleanDesignValue(tag.projectionOverlay),
            coverImage: cleanDesignValue(tag.coverImage),
            inner_record_color: cleanDesignValue(tag.labelColor),
            inner_record_image: cleanDesignValue(tag.labelImage),
            outer_design_color: cleanDesignValue(tag.outerRingColor),
            outer_design_image: cleanDesignValue(tag.outerRingImage)
        };

        const previous = currentDesignData || {};
        const merged = {
            labelColor: incoming.labelColor || previous.labelColor || '',
            labelImage: incoming.labelImage || previous.labelImage || '',
            outerRingColor: incoming.outerRingColor || previous.outerRingColor || '',
            outerRingImage: incoming.outerRingImage || previous.outerRingImage || '',
            projectionOverlay: incoming.projectionOverlay || previous.projectionOverlay || '',
            coverImage: incoming.coverImage || previous.coverImage || '',

            inner_record_color: incoming.inner_record_color || previous.inner_record_color || '',
            inner_record_image: incoming.inner_record_image || previous.inner_record_image || '',
            outer_design_color: incoming.outer_design_color || previous.outer_design_color || '',
            outer_design_image: incoming.outer_design_image || previous.outer_design_image || ''
        };

        if (!hasAnyDesignData(projectorData) && hasAnyDesignData({ tagData: previous })) {
            console.warn('ProjectorData missing design fields; using previous design values.');
        } else if (
            hasAnyDesignData({ tagData: previous }) &&
            (!incoming.outerRingImage || !incoming.projectionOverlay || !incoming.labelImage)
        ) {
            console.warn('ProjectorData partially missing design fields; merged with previous values.');
        }

        return merged;
    }

    function setTracklistLinearLayout() {
        window.TracklistWidget.setLinearLayout(currentTracks);
    }

    function updateQueueList(queueItemsArray) {
        if (!Array.isArray(queueItemsArray)) return;

        currentTracks = queueItemsArray;

        renderTracklist();

        const tracklistContainer = getTracklistContainer();
        if (tracklistContainer && tracklistContainer.classList.contains('carousel')) {
            updateArcCarousel(currentActiveTrackIndex);
        } else {
            setTracklistLinearLayout();
        }
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

    function showLyricsWidget() {
        const el = document.getElementById('lyrics-widget');
        if (!el) return;

        lyricsHideInProgress = false;
        lyricsHiddenCallbacks = [];
        el.ontransitionend = null;

        el.style.display = 'block';
        void el.offsetWidth;
        el.classList.add('visible');
    }

    function hideLyricsWidget(onHidden) {
        const el = document.getElementById('lyrics-widget');
        if (onHidden) {
            lyricsHiddenCallbacks.push(onHidden);
        }

        if (!el) {
            while (lyricsHiddenCallbacks.length > 0) {
                const callback = lyricsHiddenCallbacks.shift();
                if (callback) callback();
            }
            return;
        }

        if (el.style.display === 'none') {
            el.style.display = 'none';
            el.ontransitionend = null;
            while (lyricsHiddenCallbacks.length > 0) {
                const callback = lyricsHiddenCallbacks.shift();
                if (callback) callback();
            }
            return;
        }

        if (lyricsHideInProgress) {
            return;
        }

        lyricsHideInProgress = true;

        el.ontransitionend = function (event) {
            if (!event || event.propertyName !== 'transform') return;
            if (el.classList.contains('visible')) return;
            el.style.display = 'none';
            el.ontransitionend = null;
            lyricsHideInProgress = false;
            while (lyricsHiddenCallbacks.length > 0) {
                const callback = lyricsHiddenCallbacks.shift();
                if (callback) callback();
            }
        };

        el.classList.remove('visible');
    }

    function startVisualizer() {
        if (hasLyrics) return;
        window.VisualizerWidget.start();
    }

    function stopVisualizer() {
        window.VisualizerWidget.stop();
    }

    function syncLyricsPresentation() {
        if (!isPlayingState || awaitingMusicStart || !lyricsRevealUnlocked) {
            hideLyricsWidget();
            return;
        }

        if (hasLyrics && latestLyricsData) {
            stopVisualizer();
            showLyricsWidget();
            if (window.LyricsWidget && !deferLyricsSwapUntilProgress && renderedLyricsData !== latestLyricsData) {
                window.LyricsWidget.updateLyrics(latestLyricsData);
                renderedLyricsData = latestLyricsData;
            }
            return;
        }

        hideLyricsWidget(function () {
            if (window.LyricsWidget) window.LyricsWidget.clear();
            renderedLyricsData = null;
        });
        startVisualizer();
    }

    function startFxVideo() {
        window.OverlayWidget.setActive(true);
    }

    function stopFxVideo() {
        window.OverlayWidget.setActive(false);
    }

    function applyDesignData(designData) {
        if (!designData || !Object.values(designData).some(Boolean)) return;

        const token = ++designApplyToken;
        currentDesignData = designData;

        if (token === designApplyToken) {
            window.RecordWidget.applyDesignData(designData);
            window.OverlayWidget.setOverlayArt(designData.projectionOverlay);
        }

        if (designData.coverImage && token === designApplyToken) {
            const albumArtElement = document.getElementById('album-art');
            if (albumArtElement) {
                const safeAlbumUrl = designData.coverImage.replace(/"/g, '\"');
                albumArtElement.style.backgroundImage = 'url("' + safeAlbumUrl + '")';
            }
        }
    }

    function buildRegistrationUrl(projectorData) {
        if (projectorData && projectorData.registerTagUrl) return projectorData.registerTagUrl;
        const uid = (projectorData && projectorData.tagData) ? projectorData.tagData.tagUid : '';
        const piIp = window.PI_IP || '192.168.50.214';
        return 'http://' + piIp + ':8000/?uid=' + encodeURIComponent(uid);
    }

    function renderUnknownTagQR(projectorData) {
        const qrImg = document.getElementById('unknown-tag-qr');
        const uidLabel = document.getElementById('unknown-tag-uid');
        if (!qrImg || !uidLabel) return;

        const url = buildRegistrationUrl(projectorData);
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

        uidLabel.textContent = (projectorData && projectorData.tagData && projectorData.tagData.tagUid)
            ? ('UID: ' + projectorData.tagData.tagUid)
            : '';
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

                updateArcCarousel(currentActiveTrackIndex);

                recordSpinTimer = setTimeout(function () {
                    if (token !== playbackToken) return;
                    if (record) window.RecordWidget.setSpinState('running');
                }, RECORD_SLIDE_MS);
            }, TRACKLIST_FADE_MS);
        } else {
            if (tracklistContainer) tracklistContainer.classList.add('carousel');
            updateArcCarousel(currentActiveTrackIndex);
        }
    }

    function primeInitialTrackLyrics(progressPayload) {
        var startTrackIndex;

        if (progressPayload && progressPayload.duration) {
            startTrackIndex = resolveTrackIndexFromPayload(progressPayload);
            if (startTrackIndex === undefined) {
                startTrackIndex = resolveTrackIndexFromEventFallback(progressPayload);
            }
        }

        if (startTrackIndex === undefined) {
            startTrackIndex = 0;
        }

        if (currentTracks.length > 0) {
            updateArcCarousel(startTrackIndex);
            return applyTrackLyricsForTrackIndex(startTrackIndex, { previousTrackLineOverride: '' });
        }

        return false;
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
            var name = typeof currentTracks[i] === 'string' ? currentTracks[i].trim().toLowerCase() : '';
            if (!name) continue;
            if (name === trackName) return i;
        }

        for (var j = 0; j < currentTracks.length; j++) {
            var candidate = typeof currentTracks[j] === 'string' ? currentTracks[j].trim().toLowerCase() : '';
            if (!candidate) continue;
            if (candidate.indexOf(trackName) !== -1 || trackName.indexOf(candidate) !== -1) {
                return j;
            }
        }

        return undefined;
    }

    function detectHijack(payload) {
        if (!isPlayingState || !payload) return false;

        const trackName = typeof payload.track_name === 'string' ? payload.track_name.trim() : '';
        const incomingAlbum = typeof payload.album === 'string' ? payload.album.trim() :
            (typeof payload.album_name === 'string' ? payload.album_name.trim() : '');

        if (incomingAlbum && currentPlayingAlbum) {
            const incLower = incomingAlbum.toLowerCase();
            const currLower = currentPlayingAlbum.toLowerCase();
            if (incLower.indexOf(currLower) === -1 && currLower.indexOf(incLower) === -1) {
                return "Playback Error\n\nTarget device is playing a different album";
            }
        }

        if (trackName && currentTracks && currentTracks.length > 0) {
            const resolvedIdx = resolveTrackIndexFromPayload(payload);
            if (resolvedIdx === undefined) {
                return "Playback Error\n\nTarget device is playing a different track";
            }
        }

        return false;
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
            startFxVideo();

            window.InfoWidget.setAlbumAndArtist(
                startPayload.projectorData.tagData.mediaTitle,
                startPayload.projectorData.tagData.artist
            );
            window.ProgressWidget.show();

            if (!currentTracks || currentTracks.length === 0) {
                currentTracks = parseTracklist(startPayload.projectorData.tagData.trackList);
            } renderTracklist();
            currentActiveTrackIndex = 0;

            const tracklistContainer = getTracklistContainer();
            if (tracklistContainer) {
                tracklistContainer.classList.remove('carousel');
                tracklistContainer.classList.remove('visible');
                setTracklistLinearLayout();
            }

            const record = window.RecordWidget.getRecord();
            if (record) window.RecordWidget.setSpinState('paused');

            const initialTrackHasLyrics = primeInitialTrackLyrics(progressPayload);
            if (!initialTrackHasLyrics) {
                startVisualizer();
            }

            continuePlaybackAnimations(token);

            loadingFadeOutTimer = setTimeout(function () {
                if (token !== playbackToken) return;
                if (window.LoadingWidget && window.LoadingWidget.fadeOut) {
                    window.LoadingWidget.fadeOut();
                }
                lyricsRevealUnlocked = true;
                syncLyricsPresentation();
            }, TRACKLIST_FADE_MS + RECORD_SLIDE_MS + 80);

            isPlayingState = true;
            currentPlayingAlbum = startPayload.album;

            if (progressPayload && progressPayload.duration) {
                applyProgressSample(progressPayload.position, progressPayload.duration, { running: true });
            } else {
                resetProgressClock();
                window.ProgressWidget.update(0, 0);
            }
        }).catch(function () {
            if (token !== playbackToken) return;

            applyDesignData(startPayload.designData);
            startFxVideo();
            window.InfoWidget.setAlbumAndArtist(
                startPayload.projectorData.tagData.mediaTitle,
                startPayload.projectorData.tagData.artist
            );
            window.ProgressWidget.show();
            currentTracks = parseTracklist(startPayload.projectorData.tagData.trackList);
            renderTracklist();
            const initialTrackHasLyrics = primeInitialTrackLyrics(null);
            if (!initialTrackHasLyrics) {
                startVisualizer();
            }
            continuePlaybackAnimations(token);
            isPlayingState = true;
            currentPlayingAlbum = startPayload.album;
            lyricsRevealUnlocked = true;
            resetProgressClock();
            syncLyricsPresentation();
        });
    }

    function stopPlayback(isError) {
        localStorage.removeItem('vinyl_projection_active_payload');

        const isAnimatingOut = !!(idleStateRestoreTimer || recordHideCleanupTimer);
        const wasPlaying = isPlayingState || isAnimatingOut;

        isPlayingState = false;
        currentPlayingAlbum = '';
        currentMediaPlaybackState = MediaPlaybackState.Idle;
        awaitingMusicStart = false;
        pendingStartPayload = null;
        const token = ++playbackToken;
        clearTransitionTimers();

        window.InfoWidget.setIdle();
        window.ProgressWidget.hide();
        window.ProgressWidget.reset();

        if (window.RecordWidget && window.RecordWidget.resetRecord) {
            window.RecordWidget.resetRecord();
        }

        const record = window.RecordWidget.getRecord();
        const recordContainer = window.RecordWidget.getRecordContainer();
        const tracklistContainer = getTracklistContainer();

        if (tracklistContainer) {
            tracklistContainer.classList.remove('carousel');
            tracklistContainer.classList.add('visible');
            setTracklistLinearLayout();
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
            if (window.LyricsWidget) window.LyricsWidget.clear();
            currentTracks = [];
            currentActiveTrackIndex = 0;
        }

        if (recordContainer) {
            recordContainer.classList.remove('visible');

            if (!isError) {
                recordHideCleanupTimer = setTimeout(function () {
                    if (token !== playbackToken) return;
                    recordContainer.style.display = 'none';
                    window.RecordWidget.clearDesignData();
                    currentDesignData = {};
                    window.OverlayWidget.clearOverlayArt();
                    if (window.OverlayWidget.resetStatus) window.OverlayWidget.resetStatus();
                }, RECORD_SLIDE_MS);
            }
        }

        if (record) window.RecordWidget.setSpinState('paused');

        const unknownIndicator = document.getElementById('unknown-tag-indicator');
        if (unknownIndicator) unknownIndicator.classList.remove('visible');

        if (window.QrCodeWidget && window.QrCodeWidget.hide) {
            window.QrCodeWidget.hide();
        }

        stopVisualizer();
        stopFxVideo();
        hasLyrics = false;
        latestLyricsData = null;
        lyricsRevealUnlocked = false;
        trackLyricsByTrackName = {};
        resetProgressClock();
        hideLyricsWidget(function () {
            if (window.LyricsWidget) window.LyricsWidget.clear();
        });

        if (!isError && window.ContextMessageWidget) {
            window.ContextMessageWidget.hide();
        }

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

    function showUnknownTag(projectorData) {
        stopPlayback();

        if (window.QrCodeWidget && window.QrCodeWidget.show) {
            window.QrCodeWidget.show(projectorData);
        }
    }

    function showPlaybackError(message, projectorData) {
        let designData = null;

        if (projectorData && hasAnyDesignData(projectorData)) {
            designData = getEffectiveDesignData(projectorData);
        } else if (pendingStartPayload && pendingStartPayload.designData) {
            designData = pendingStartPayload.designData;
        }

        const wasPlaying = isPlayingState;
        stopPlayback(true);
        const currentToken = playbackToken;

        if (designData && window.RecordWidget && window.RecordWidget.applyDesignData) {
            window.RecordWidget.applyDesignData(designData);
        }

        const ejectDelay = wasPlaying ? (RECORD_SLIDE_MS + TRACKLIST_FADE_MS) : 0;

        setTimeout(function () {
            if (currentToken !== playbackToken) return;

            if (window.LoadingWidget && window.LoadingWidget.showError) {
                window.LoadingWidget.showError();
            }

            if (window.RecordWidget && window.RecordWidget.ejectRecord) {
                window.RecordWidget.ejectRecord();
            }

            if (window.ContextMessageWidget) {
                window.ContextMessageWidget.showError(message);
            } else {
                console.error("Playback Error:", message);
            }
        }, ejectDelay + 50);
    }

    function startPlayback(projectorData) {
        localStorage.setItem('vinyl_projection_active_payload', JSON.stringify(projectorData.toJson()));

        const effectiveDesignData = getEffectiveDesignData(projectorData);
        const incomingAlbum = projectorData.tagData ? projectorData.tagData.mediaTitle.trim() : '';

        if (awaitingMusicStart && incomingAlbum && pendingStartPayload && incomingAlbum === pendingStartPayload.album) {
            pendingStartPayload = {
                projectorData: projectorData,
                designData: effectiveDesignData,
                album: incomingAlbum,
            };
            return;
        }

        if (isPlayingState && incomingAlbum && incomingAlbum === currentPlayingAlbum) {
            if (hasAnyDesignData(projectorData)) {
                applyDesignData(effectiveDesignData);
                startFxVideo();
            }
            buildTrackLyricsLookup(projectorData.tagData.trackList);
            window.InfoWidget.setAlbumAndArtist(projectorData.tagData.mediaTitle, projectorData.tagData.artist);

            if (!currentTracks || currentTracks.length === 0) {
                currentTracks = parseTracklist(projectorData.tagData.trackList);
            }
            renderTracklist();
            return;
        }

        isPlayingState = false;
        const token = ++playbackToken;
        clearTransitionTimers();
        lyricsRevealUnlocked = false;
        latestLyricsData = null;

        awaitingMusicStart = true;
        awaitingMusicStartToken = token;
        buildTrackLyricsLookup(projectorData.tagData.trackList);
        pendingStartPayload = {
            projectorData: projectorData,
            designData: effectiveDesignData,
            album: incomingAlbum,
        };

        const unknownIndicator = document.getElementById('unknown-tag-indicator');
        if (unknownIndicator) unknownIndicator.classList.remove('visible');

        if (window.ContextMessageWidget) {
            window.ContextMessageWidget.hide();
        }

        if (window.QrCodeWidget && window.QrCodeWidget.hide) {
            window.QrCodeWidget.hide();
        }

        if (window.RecordWidget && window.RecordWidget.resetRecord) {
            window.RecordWidget.resetRecord();
        }

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
        hasLyrics = false;
        resetProgressClock();
        setTrackLyricsData(null);
        if (window.LyricsWidget && window.LyricsWidget.setTrackContext) {
            window.LyricsWidget.setTrackContext({ previousTrackLine: '', upcomingTrackLine: '' });
        }
        hideLyricsWidget(function () {
            if (window.LyricsWidget) window.LyricsWidget.clear();
        });

        if (window.LoadingWidget && window.LoadingWidget.beginScanLoading) {
            window.LoadingWidget.beginScanLoading();
        }
    }

    function handleProgress(payload) {
        if (awaitingMusicStart && awaitingMusicStartToken === playbackToken && isProgressPlayingSignal(payload)) {
            resolveAwaitingMusicStart(payload);
            return;
        }

        if (!isPlayingState) return;

        const hijackErrorMsg = detectHijack(payload);
        if (hijackErrorMsg) {
            showPlaybackError(hijackErrorMsg);
            return;
        }

        var activeTrackIndex = resolveTrackIndexFromPayload(payload);
        if (activeTrackIndex === undefined) {
            activeTrackIndex = resolveTrackIndexFromEventFallback(payload);
        }

        if (deferLyricsSwapUntilProgress && hasLyrics && latestLyricsData && window.LyricsWidget) {
            window.LyricsWidget.updateLyrics(latestLyricsData);
            renderedLyricsData = latestLyricsData;
            deferLyricsSwapUntilProgress = false;
        }

        if (currentTracks.length > 0 && activeTrackIndex !== undefined) {
            updateArcCarousel(activeTrackIndex);
        }

        if (!payload.duration || payload.duration === 0) return;

        applyProgressSample(payload.position, payload.duration, { running: isMediaStatePlaying(currentMediaPlaybackState) });
    }

    function handlePlaybackEvent(payload) {
        if (!payload) return;
        if (!isPlayingState && !awaitingMusicStart) return;

        const hijackErrorMsg = detectHijack(payload);
        if (hijackErrorMsg) {
            showPlaybackError(hijackErrorMsg);
            return;
        }

        const eventName = typeof payload.event === 'string' ? payload.event.toLowerCase() : '';
        const normalizedState = normalizeMediaPlaybackState(payload.state);
        const stateName = typeof payload.state === 'string' ? payload.state.toLowerCase() : '';

        if (eventName === 'track_changed' || payload.track_index !== undefined || payload.track_name) {
            var incomingIndex = resolveTrackIndexFromPayload(payload);
            if (incomingIndex === undefined) {
                incomingIndex = resolveTrackIndexFromEventFallback(payload);
            }
            var didTrackChange = isTrackChangeForDifferentTrack(payload, incomingIndex);
            var previousTrackTailLine = didTrackChange
                ? getLastLyricText(getTrackLyricsByIndex(currentActiveTrackIndex))
                : '';

            if (didTrackChange) {
                resetProgressClockForTrackChange();
                if (window.LyricsWidget && window.LyricsWidget.enterInterTrackBridge) {
                    var upcomingTrackLineForBridge = '';
                    if (incomingIndex !== undefined) {
                        upcomingTrackLineForBridge = getFirstLyricText(getTrackLyricsByIndex(incomingIndex));
                    } else if (payload.track_name) {
                        upcomingTrackLineForBridge = getFirstLyricText(getTrackLyricsByName(payload.track_name));
                    }

                    window.LyricsWidget.enterInterTrackBridge({
                        previousTrackLine: previousTrackTailLine,
                        upcomingTrackLine: upcomingTrackLineForBridge
                    });
                }
                deferLyricsSwapUntilProgress = true;
            }

            if (incomingIndex !== undefined) {
                updateArcCarousel(incomingIndex);
                applyTrackLyricsForTrackIndex(incomingIndex, { previousTrackLineOverride: previousTrackTailLine });
            } else if (payload.track_name) {
                applyTrackLyricsForTrackName(payload.track_name);
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

    window.ProjectorPlayback = {
        startPlayback: startPlayback,
        stopPlayback: stopPlayback,
        showUnknownTag: showUnknownTag,
        showPlaybackError: showPlaybackError,
        handleProgress: handleProgress,
        handlePlaybackEvent: handlePlaybackEvent,
        updateQueueList: updateQueueList,
        notifyMusicStarted: function (payload) {
            if (awaitingMusicStart && awaitingMusicStartToken === playbackToken) {
                resolveAwaitingMusicStart(payload || null);
            }
        },
        restoreState: function () {
            try {
                const saved = localStorage.getItem('vinyl_projection_active_payload');
                if (saved) {
                    const projectorData = ProjectorData_t.fromJson(JSON.parse(saved));

                    if (window.LoadingWidget) {
                        window.LoadingWidget.forceHide();

                        this._originalScan = window.LoadingWidget.beginScanLoading;
                        this._originalExpand = window.LoadingWidget.expandToOverlay;
                        window.LoadingWidget.beginScanLoading = function () { return Promise.resolve(); };
                        window.LoadingWidget.expandToOverlay = function () { return Promise.resolve(); };
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
                }
            } catch (e) {
                console.warn('Failed to restore playback state from refresh:', e);
            }
        }
    };


    if (window.LoadingWidget && window.LoadingWidget.showIdle) {
        window.LoadingWidget.showIdle();
    }
})();