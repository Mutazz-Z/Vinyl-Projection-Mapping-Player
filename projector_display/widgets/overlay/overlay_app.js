(function() {
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

    window.OverlayWidget = {
        setActive: setActive,
        setOverlayArt: setOverlayArt,
        clearOverlayArt: clearOverlayArt
    };
})();
