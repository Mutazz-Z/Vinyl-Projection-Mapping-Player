(function () {
    var currentActiveIndex = 0;
    var uiTracks = [];

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

            var el = document.createElement('div');
            el.className = 'track-item';
            el.textContent = trackName;
            container.appendChild(el);

            uiTracks.push({
                name: trackName,
                element: el,
                data: trackItem
            });
        });
    }

    function getContainer() {
        return document.querySelector('#tracklist-widget .tracklist-container');
    }

    function setLinearLayout() {
        if (uiTracks.length === 0) return;

        var anchorIndex = currentActiveIndex || 0;
        var yStep = 58;

        uiTracks.forEach(function (track, index) {
            var el = track.element;
            if (!el) return;

            var offset = index - anchorIndex;
            var y = offset * yStep;

            el.classList.toggle('active', offset === 0);

            var opacity = 0;
            if (Math.abs(offset) === 0) opacity = 1;
            else if (Math.abs(offset) === 1) opacity = 0.45;
            else if (Math.abs(offset) === 2) opacity = 0.1;

            el.style.opacity = opacity;
            el.style.transform = 'translate(0px, calc(' + y + 'px - 50%)) scale(' + (offset === 0 ? 1.12 : 1) + ')';
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
            var el = track.element;
            if (!el) return;

            var offset = index - currentActiveIndex;

            if (Math.abs(offset) > 2) {
                el.style.opacity = '0';
                var yDir = offset > 0 ? 300 : -300;
                el.style.transform = 'translate(' + TEXT_GAP + 'px, ' + yDir + 'px) scale(0.5)';
                el.classList.remove('active');
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
                el.classList.add('active');
            } else {
                scale = 1.0 - (Math.abs(offset) * 0.15);
                opacity = 0.6 - (Math.abs(offset) * 0.25);
                el.classList.remove('active');
            }

            el.style.opacity = opacity;
            el.style.transform = 'translate(' + x + 'px, calc(' + y + 'px - 50%)) scale(' + scale + ')';
        });
    }

    function clear() {
        var container = document.getElementById('tracklist-arc');
        if (container) container.innerHTML = '';
        uiTracks = [];
    }

    window.TracklistWidget = {
        parseTracklist: parseTracklist,
        renderTracklist: renderTracklist,
        getContainer: getContainer,
        setLinearLayout: setLinearLayout,
        updateArcCarousel: updateArcCarousel,
        clear: clear
    };
})();