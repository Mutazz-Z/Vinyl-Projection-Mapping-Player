"use strict";
(function () {
    const TRACKLIST_FADE_MS = 220;
    const RECORD_SLIDE_MS = 700;
    let currentActiveIndex = 0;
    let uiTracks = [];
    let pendingHideTimer = null;
    let pendingClearTimer = null;
    function renderTracklist(tracks) {
        const container = document.getElementById('tracklist-arc');
        if (!container)
            return;
        container.innerHTML = '';
        currentActiveIndex = 0;
        uiTracks = [];
        (tracks || []).forEach(function (trackItem) {
            const trackName = typeof trackItem === 'string' ? trackItem : (trackItem.track || '');
            if (!trackName)
                return;
            const trackElement = document.createElement('div');
            trackElement.className = 'track-item';
            trackElement.textContent = trackName;
            container.appendChild(trackElement);
            uiTracks.push({
                name: trackName,
                element: trackElement,
                data: trackItem,
            });
        });
    }
    function getContainer() {
        return document.querySelector('#tracklist-widget .tracklist-container');
    }
    function show(options) {
        const config = (options && typeof options === 'object') ? options : {};
        if (config.prepareForPlayback === true) {
            const projectorData = config.projectorData;
            const trackList = projectorData?.tagData?.trackList || [];
            TrackResolver.clearTrackPositionOnly();
            TrackResolver.buildLyricsLookupFromTrackList(trackList);
            consumeQueueList(trackList.map(function (entry) {
                return entry.track;
            }));
        }
        if (Object.prototype.hasOwnProperty.call(config, 'queueList')) {
            consumeQueueList(config.queueList || []);
        }
        if (config.activeTrack) {
            consumeActiveTrack(config.activeTrack);
        }
        if (config.visible === false) {
            return;
        }
        const container = getContainer();
        if (!container)
            return;
        container.classList.add('visible');
        container.classList.add('carousel');
        updateArcCarousel(currentActiveIndex);
    }
    function hide(options) {
        const config = (options && typeof options === 'object') ? options : {};
        if (config.cancelPendingTransitions === true) {
            cancelPendingTransitions();
        }
        if (config.beginStopSequence) {
            const stopConfig = config.beginStopSequence;
            cancelPendingTransitions();
            const timers = hideAndClearAfterStopAnimation(stopConfig.token, stopConfig.getPlaybackToken, function () {
                TrackResolver.clear();
            });
            if (timers) {
                pendingHideTimer = timers.hideTimer || null;
                pendingClearTimer = timers.clearTimer || null;
            }
            return timers;
        }
        if (config.clear === true) {
            clear();
        }
        if (config.visible === false) {
            return;
        }
        const container = getContainer();
        if (!container)
            return;
        container.classList.remove('visible');
    }
    function setLinearLayout() {
        if (uiTracks.length === 0)
            return;
        const anchorIndex = currentActiveIndex || 0;
        const yStep = 58;
        uiTracks.forEach(function (track, index) {
            const trackElement = track.element;
            if (!trackElement)
                return;
            const offset = index - anchorIndex;
            const y = offset * yStep;
            trackElement.classList.toggle('active', offset === 0);
            let opacity = 0;
            if (Math.abs(offset) === 0)
                opacity = 1;
            else if (Math.abs(offset) === 1)
                opacity = 0.45;
            else if (Math.abs(offset) === 2)
                opacity = 0.1;
            trackElement.style.opacity = String(opacity);
            trackElement.style.transform = 'translate(0px, calc(' + y + 'px - 50%)) scale(' + (offset === 0 ? 1.12 : 1) + ')';
        });
    }
    function updateArcCarousel(activeIndex) {
        if (uiTracks.length === 0)
            return;
        const container = getContainer();
        if (container && !container.classList.contains('carousel')) {
            const newIndex = Number(activeIndex);
            if (!Number.isNaN(newIndex))
                currentActiveIndex = newIndex;
            setLinearLayout();
            return;
        }
        const safeIndex = Number(activeIndex);
        if (!Number.isNaN(safeIndex)) {
            currentActiveIndex = safeIndex;
        }
        const TEXT_GAP = 40;
        const ARC_RADIUS = 250;
        const ANGLE_STEP = 0.35;
        uiTracks.forEach(function (track, index) {
            const trackElement = track.element;
            if (!trackElement)
                return;
            const offset = index - currentActiveIndex;
            if (Math.abs(offset) > 2) {
                trackElement.style.opacity = '0';
                const yDir = offset > 0 ? 300 : -300;
                trackElement.style.transform = 'translate(' + TEXT_GAP + 'px, ' + yDir + 'px) scale(0.5)';
                trackElement.classList.remove('active');
                return;
            }
            const angle = offset * ANGLE_STEP;
            const x = (Math.cos(angle) * ARC_RADIUS) - ARC_RADIUS + TEXT_GAP;
            const y = Math.sin(angle) * ARC_RADIUS;
            let scale = 1;
            let opacity = 1;
            if (offset === 0) {
                scale = 1.3;
                opacity = 1;
                trackElement.classList.add('active');
            }
            else {
                scale = 1.0 - (Math.abs(offset) * 0.15);
                opacity = 0.6 - (Math.abs(offset) * 0.25);
                trackElement.classList.remove('active');
            }
            trackElement.style.opacity = String(opacity);
            trackElement.style.transform = 'translate(' + x + 'px, calc(' + y + 'px - 50%)) scale(' + scale + ')';
        });
    }
    function clear() {
        const container = document.getElementById('tracklist-arc');
        if (container)
            container.innerHTML = '';
        uiTracks = [];
    }
    function consumeQueueList(tracks) {
        renderTracklist(tracks || []);
        updateArcCarousel(currentActiveIndex);
    }
    function consumeActiveTrack(activeTrack) {
        if (!activeTrack)
            return;
        let resolvedIndex = null;
        if (activeTrack.track_index !== undefined && activeTrack.track_index !== null) {
            const numeric = Number(activeTrack.track_index);
            if (!Number.isNaN(numeric)) {
                resolvedIndex = numeric;
            }
        }
        if (resolvedIndex === null && activeTrack.track_name) {
            const incomingName = String(activeTrack.track_name).trim().toLowerCase();
            for (let i = 0; i < uiTracks.length; i++) {
                if (String(uiTracks[i].name).trim().toLowerCase() === incomingName) {
                    resolvedIndex = i;
                    break;
                }
            }
        }
        if (resolvedIndex === null)
            return;
        currentActiveIndex = Math.max(0, Math.min(uiTracks.length - 1, Math.floor(resolvedIndex)));
        updateArcCarousel(currentActiveIndex);
    }
    function cancelPendingTransitions() {
        if (pendingHideTimer) {
            clearTimeout(pendingHideTimer);
            pendingHideTimer = null;
        }
        if (pendingClearTimer) {
            clearTimeout(pendingClearTimer);
            pendingClearTimer = null;
        }
    }
    function hideAndClearAfterStopAnimation(guardToken, getPlaybackToken, onCleared) {
        const container = getContainer();
        if (!container) {
            clear();
            if (onCleared)
                onCleared();
            return null;
        }
        container.classList.remove('carousel');
        container.classList.add('visible');
        setLinearLayout();
        const hideTimer = setTimeout(function () {
            if (guardToken !== getPlaybackToken())
                return;
            container.classList.remove('visible');
        }, RECORD_SLIDE_MS);
        const clearTimer = setTimeout(function () {
            if (guardToken !== getPlaybackToken())
                return;
            clear();
            if (onCleared)
                onCleared();
        }, RECORD_SLIDE_MS + TRACKLIST_FADE_MS);
        return { hideTimer: hideTimer, clearTimer: clearTimer };
    }
    window.TracklistWidget = {
        show: show,
        hide: hide,
    };
})();
