(function() {
    var hideTimer = null;

    function getContainer() {
        return document.querySelector('#info-widget .info-container');
    }

    function setText(album, artist) {
        var albumTitle = document.getElementById('album-title');
        var artistName = document.getElementById('artist-name');
        if (albumTitle) albumTitle.textContent = album || '';
        if (artistName) artistName.textContent = artist || '';
    }

    function setAlbumAndArtist(album, artist) {
        var container = getContainer();
        if (hideTimer) {
            clearTimeout(hideTimer);
            hideTimer = null;
        }

        setText(album, artist);

        if (!container) return;
        container.classList.remove('hiding');
        if (!container.classList.contains('visible')) {
            requestAnimationFrame(function() {
                container.classList.add('visible');
            });
        }
    }

    function setIdle() {
        var container = getContainer();
        if (hideTimer) {
            clearTimeout(hideTimer);
            hideTimer = null;
        }

        if (!container || !container.classList.contains('visible')) {
            setText('', '');
            return;
        }

        container.classList.remove('visible');
        container.classList.add('hiding');

        hideTimer = setTimeout(function() {
            setText('', '');
            container.classList.remove('hiding');
            hideTimer = null;
        }, 380);
    }

    window.InfoWidget = {
        setAlbumAndArtist: setAlbumAndArtist,
        setIdle: setIdle
    };
})();
