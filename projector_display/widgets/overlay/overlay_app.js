(function () {
    var statusTimer = null;
    var isCurrentlyPaused = false;

    function setActive(active) {
        var fxContainer = document.getElementById('fx-video-container');
        if (!fxContainer) return;
        fxContainer.classList.toggle('active', Boolean(active));
    }

    function setOverlayArt(url) {
        var overlay = document.getElementById('fx-video-container');
        if (!overlay) return;

        if (url) {
            var safeOverlayUrl = String(url).replace(/"/g, '\\"');
            overlay.style.backgroundImage = 'url("' + safeOverlayUrl + '")';
            overlay.style.backgroundSize = 'cover';
            overlay.style.backgroundPosition = 'center center';
            overlay.style.backgroundRepeat = 'no-repeat';
        } else {
            overlay.style.backgroundImage = 'none';
        }
    }

    function clearOverlayArt() {
        setOverlayArt('');
    }

    function showStatusIcon(type) {
        var iconEl = document.getElementById('status-icon-overlay');
        var fxContainer = document.getElementById('fx-video-container');
        if (!iconEl) return;

        var stateChanged = false;

        if (type === 'play') {
            if (isCurrentlyPaused) {
                isCurrentlyPaused = false;
                if (fxContainer) fxContainer.classList.remove('paused');
                stateChanged = true;
            }
        } else if (type === 'pause') {
            if (!isCurrentlyPaused) {
                isCurrentlyPaused = true;
                if (fxContainer) fxContainer.classList.add('paused');
                stateChanged = true;
            }
        }

        if ((type === 'play' || type === 'pause') && !stateChanged) {
            return;
        }

        if (statusTimer) {
            clearTimeout(statusTimer);
            statusTimer = null;
        }

        var imgPath = '';
        if (type === 'play') imgPath = 'widgets/assets/play_overlay.png';
        else if (type === 'pause') imgPath = 'widgets/assets/pause_overlay.png';

        if (!imgPath) {
            iconEl.classList.remove('visible');
            return;
        }

        iconEl.style.backgroundImage = 'url("' + imgPath + '")';
        void iconEl.offsetWidth;
        iconEl.classList.add('visible');

        if (type !== 'pause') {
            statusTimer = setTimeout(function () {
                iconEl.classList.remove('visible');
            }, 2000);
        }
    }

    function resetStatus() {
        isCurrentlyPaused = false;
        var iconEl = document.getElementById('status-icon-overlay');
        var fxContainer = document.getElementById('fx-video-container');

        if (iconEl) iconEl.classList.remove('visible');
        if (fxContainer) fxContainer.classList.remove('paused');

        if (statusTimer) {
            clearTimeout(statusTimer);
            statusTimer = null;
        }
    }

    window.OverlayWidget = {
        setActive: setActive,
        setOverlayArt: setOverlayArt,
        clearOverlayArt: clearOverlayArt,
        showStatusIcon: showStatusIcon,
        resetStatus: resetStatus
    };
})();