(function () {
    var TRACKLIST_FADE_MS = 220;
    var RECORD_SLIDE_MS = 700;

    var currentActiveIndex = 0;
    var uiTracks = [];
    var pendingHideTimer = null;
    var pendingClearTimer = null;

    function parseTracklist(str) {
        return (str || '').split('\n').map(function (t) { return t.trim(); }).filter(Boolean);
    }

    function renderTracklist(tracks) {
        var container = document.getElementById('tracklist-arc');
        if (!container) return;
        container.innerHTML = '';

        currentActiveIndex = 0;
        uiTracks = [];

        (tracks || []).forEach(function (trackItem) {
            var trackName = typeof trackItem === 'string' ? trackItem : (trackItem.track || trackItem.name || '');
            if (!trackName) return;

            var trackElement = document.createElement('div');
            trackElement.className = 'track-item';
            trackElement.textContent = trackName;
            container.appendChild(trackElement);

            uiTracks.push({
                name: trackName,
                element: trackElement,
                data: trackItem
            });
        });
    }

    function getContainer() {
        return document.querySelector('#tracklist-widget .tracklist-container');
    }

    function show(options) {
        var config = options || {};

        if (config.prepareForPlayback === true) {
            var projectorData = config.projectorData || {};
            var trackList = (projectorData && projectorData.tagData && projectorData.tagData.trackList) || [];

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

        var container = getContainer();
        if (!container) return;
        container.classList.add('visible');
        container.classList.add('carousel');
        updateArcCarousel(uiTracks.map(function (t) { return t.name; }), currentActiveIndex);
    }

    function hide(options) {
        var config = options || {};

        if (config.cancelPendingTransitions === true) {
            cancelPendingTransitions();
        }

        if (config.beginStopSequence) {
            var stopConfig = config.beginStopSequence;
            cancelPendingTransitions();

            var trackNamesBeforeClear = TrackResolver.getTrackNames().slice();

            var timers = hideAndClearAfterStopAnimation(stopConfig.token, stopConfig.getPlaybackToken, trackNamesBeforeClear, function () {
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

        var container = getContainer();
        if (!container) return;
        container.classList.remove('visible');
    }

    function setLinearLayout() {
        if (uiTracks.length === 0) return;

        var anchorIndex = currentActiveIndex || 0;
        var yStep = 58;

        uiTracks.forEach(function (track, index) {
            var trackElement = track.element;
            if (!trackElement) return;

            var offset = index - anchorIndex;
            var y = offset * yStep;

            trackElement.classList.toggle('active', offset === 0);

            var opacity = 0;
            if (Math.abs(offset) === 0) opacity = 1;
            else if (Math.abs(offset) === 1) opacity = 0.45;
            else if (Math.abs(offset) === 2) opacity = 0.1;

            trackElement.style.opacity = opacity;
            trackElement.style.transform = 'translate(0px, calc(' + y + 'px - 50%)) scale(' + (offset === 0 ? 1.12 : 1) + ')';
        });
    }

    function updateArcCarousel(tracks_ignored, activeIndex) {
        if (uiTracks.length === 0) return;

        var container = getContainer();

        if (container && !container.classList.contains('carousel')) {
            var newIndex = parseInt(activeIndex, 10);
            if (!isNaN(newIndex)) currentActiveIndex = newIndex;

            setLinearLayout();
            return;
        }

        var safeIndex = parseInt(activeIndex, 10);
        if (!isNaN(safeIndex)) {
            currentActiveIndex = safeIndex;
        }

        var TEXT_GAP = 40;
        var ARC_RADIUS = 250;
        var ANGLE_STEP = 0.35;

        uiTracks.forEach(function (track, index) {
            var trackElement = track.element;
            if (!trackElement) return;

            var offset = index - currentActiveIndex;

            if (Math.abs(offset) > 2) {
                trackElement.style.opacity = '0';
                var yDir = offset > 0 ? 300 : -300;
                trackElement.style.transform = 'translate(' + TEXT_GAP + 'px, ' + yDir + 'px) scale(0.5)';
                trackElement.classList.remove('active');
                return;
            }

            var angle = offset * ANGLE_STEP;
            var x = (Math.cos(angle) * ARC_RADIUS) - ARC_RADIUS + TEXT_GAP;
            var y = Math.sin(angle) * ARC_RADIUS;

            var scale = 1;
            var opacity = 1;

            if (offset === 0) {
                scale = 1.3;
                opacity = 1;
                trackElement.classList.add('active');
            } else {
                scale = 1.0 - (Math.abs(offset) * 0.15);
                opacity = 0.6 - (Math.abs(offset) * 0.25);
                trackElement.classList.remove('active');
            }

            trackElement.style.opacity = opacity;
            trackElement.style.transform = 'translate(' + x + 'px, calc(' + y + 'px - 50%)) scale(' + scale + ')';
        });
    }

    function clear() {
        var container = document.getElementById('tracklist-arc');
        if (container) container.innerHTML = '';
        uiTracks = [];
    }

    function consumeQueueList(tracks) {
        renderTracklist(tracks || []);
        updateArcCarousel(tracks || [], currentActiveIndex);
    }

    function consumeActiveTrack(activeTrack) {
        if (!activeTrack) return;

        var resolvedIndex = null;

        if (activeTrack.track_index !== undefined && activeTrack.track_index !== null) {
            var numeric = Number(activeTrack.track_index);
            if (!Number.isNaN(numeric)) {
                resolvedIndex = numeric;
            }
        }

        if (resolvedIndex === null && activeTrack.track_name) {
            var incomingName = String(activeTrack.track_name).trim().toLowerCase();
            for (var i = 0; i < uiTracks.length; i++) {
                if (String(uiTracks[i].name).trim().toLowerCase() === incomingName) {
                    resolvedIndex = i;
                    break;
                }
            }
        }

        if (resolvedIndex === null) return;

        currentActiveIndex = Math.max(0, Math.min(uiTracks.length - 1, Math.floor(resolvedIndex)));
        updateArcCarousel(uiTracks.map(function (t) { return t.name; }), currentActiveIndex);
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

    function hideAndClearAfterStopAnimation(guardToken, getPlaybackToken, trackNamesBeforeClear, onCleared) {
        var container = getContainer();

        if (!container) {
            clear();
            if (onCleared) onCleared();
            return null;
        }

        container.classList.remove('carousel');
        container.classList.add('visible');
        setLinearLayout(trackNamesBeforeClear);

        var hideTimer = setTimeout(function () {
            if (guardToken !== getPlaybackToken()) return;
            container.classList.remove('visible');
        }, RECORD_SLIDE_MS);

        var clearTimer = setTimeout(function () {
            if (guardToken !== getPlaybackToken()) return;
            clear();
            if (onCleared) onCleared();
        }, RECORD_SLIDE_MS + TRACKLIST_FADE_MS);

        return { hideTimer: hideTimer, clearTimer: clearTimer };
    }

    window.TracklistWidget = {
        show: show,
        hide: hide,
    };
})();