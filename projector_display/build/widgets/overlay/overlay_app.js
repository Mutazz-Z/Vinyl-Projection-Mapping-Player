"use strict";
(function () {
    let statusTimer = null;
    let isCurrentlyPaused = false;
    function getOverlayContainer() {
        return document.getElementById('fx-video-container');
    }
    function setActive(active) {
        const overlayContainer = getOverlayContainer();
        if (!overlayContainer)
            return;
        overlayContainer.classList.toggle('active', Boolean(active));
    }
    function setOverlayArt(url) {
        const overlayContainer = getOverlayContainer();
        if (!overlayContainer)
            return;
        if (url) {
            const safeOverlayUrl = String(url).replace(/"/g, '\\"');
            overlayContainer.style.backgroundImage = 'url("' + safeOverlayUrl + '")';
            overlayContainer.style.backgroundSize = 'cover';
            overlayContainer.style.backgroundPosition = 'center center';
            overlayContainer.style.backgroundRepeat = 'no-repeat';
        }
        else {
            overlayContainer.style.backgroundImage = 'none';
        }
    }
    function clearOverlayArt() {
        setOverlayArt('');
    }
    function showStatusIcon(type) {
        const iconElement = document.getElementById('status-icon-overlay');
        const overlayContainer = getOverlayContainer();
        if (!iconElement)
            return;
        let stateChanged = false;
        if (type === 'play') {
            if (isCurrentlyPaused) {
                isCurrentlyPaused = false;
                if (overlayContainer)
                    overlayContainer.classList.remove('paused');
                stateChanged = true;
            }
        }
        else if (type === 'pause') {
            if (!isCurrentlyPaused) {
                isCurrentlyPaused = true;
                if (overlayContainer)
                    overlayContainer.classList.add('paused');
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
        let imgPath = '';
        if (type === 'play')
            imgPath = 'widgets/assets/play_overlay.png';
        else if (type === 'pause')
            imgPath = 'widgets/assets/pause_overlay.png';
        if (!imgPath) {
            iconElement.classList.remove('visible');
            return;
        }
        iconElement.style.backgroundImage = 'url("' + imgPath + '")';
        void iconElement.offsetWidth;
        iconElement.classList.add('visible');
        if (type !== 'pause') {
            statusTimer = setTimeout(function () {
                iconElement.classList.remove('visible');
            }, 2000);
        }
    }
    function resetStatus() {
        isCurrentlyPaused = false;
        const iconElement = document.getElementById('status-icon-overlay');
        const overlayContainer = getOverlayContainer();
        if (iconElement)
            iconElement.classList.remove('visible');
        if (overlayContainer)
            overlayContainer.classList.remove('paused');
        if (statusTimer) {
            clearTimeout(statusTimer);
            statusTimer = null;
        }
    }
    function consumePlaybackState(state) {
        const numeric = Number(state);
        if (numeric === MediaPlaybackState.Playing) {
            play();
            return;
        }
        if (numeric === MediaPlaybackState.Paused) {
            pause();
        }
    }
    function updateData(overlayData) {
        setOverlayArt(overlayData.overlayImage);
    }
    function show(options) {
        const config = (options && typeof options === 'object') ? options : {};
        if (config.visible !== false) {
            setActive(true);
        }
        if (Object.prototype.hasOwnProperty.call(config, 'overlayArt')) {
            setOverlayArt(config.overlayArt);
        }
        if (Object.prototype.hasOwnProperty.call(config, 'playbackState')) {
            consumePlaybackState(Number(config.playbackState));
        }
        if (typeof config.statusIconType === 'string') {
            showStatusIcon(config.statusIconType);
        }
        if (config.resetStatus === true) {
            resetStatus();
        }
    }
    function hide(options) {
        const config = (options && typeof options === 'object') ? options : {};
        if (config.visible !== false) {
            setActive(false);
        }
        if (config.clearOverlayArt === true) {
            clearOverlayArt();
        }
        if (config.resetStatus === true) {
            resetStatus();
        }
    }
    function play() {
        showStatusIcon('play');
    }
    function pause() {
        showStatusIcon('pause');
    }
    window.OverlayWidget = {
        show: show,
        hide: hide,
        updateData: updateData,
    };
})();
