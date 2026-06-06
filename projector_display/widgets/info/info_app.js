(function () {
    var hideTimer = null;

    function getContainer() {
        return document.querySelector('#info-widget .info-container') || document.querySelector('.info-container');
    }

    function resetMarquee(element) {
        if (!element) return;
        element.classList.remove('marquee');
        if (element.dataset.originalText !== undefined) {
            element.textContent = element.dataset.originalText;
            delete element.dataset.originalText;
        }
    }

    function applyMarquee(element) {
        if (!element) return;
        var text = element.textContent;
        element.dataset.originalText = text;

        element.innerHTML = '';

        var firstTextSpan = document.createElement('span');
        firstTextSpan.textContent = text;

        var spacerSpan = document.createElement('span');
        spacerSpan.className = 'spacer';

        var secondTextSpan = document.createElement('span');
        secondTextSpan.textContent = text;

        element.appendChild(firstTextSpan);
        element.appendChild(spacerSpan);
        element.appendChild(secondTextSpan);

        element.classList.add('marquee');
    }

    function updateLayout() {
        var container = getContainer();
        if (!container) return;

        var titleEl = document.getElementById('album-title');
        var artistEl = document.getElementById('artist-name');
        var artistWrap = document.getElementById('artist-wrap');
        var titleWrap = document.getElementById('title-wrap');

        if (!titleEl || !artistEl || !titleWrap || !artistWrap) return;

        container.style.setProperty('--scale', 1);
        titleWrap.style.width = 'auto';
        titleWrap.style.flex = 'none';
        artistWrap.style.width = 'auto';
        artistWrap.style.flex = 'none';
        resetMarquee(titleEl);

        void container.offsetHeight;

        var rawTitleWidth = titleEl.scrollWidth;
        var rawArtistWidth = artistWrap.scrollWidth;
        var availableWidth = container.clientWidth - 8;

        if (rawTitleWidth === 0 && rawArtistWidth === 0) return;

        var actualGap = (rawTitleWidth > 0 && rawArtistWidth > 0) ? 20 : 0;

        var totalContentWidth = rawTitleWidth + rawArtistWidth + actualGap;
        var scale = Math.max(0.8, Math.min(1.2, availableWidth / totalContentWidth));

        var scaledArtistWidth = Math.ceil(rawArtistWidth * scale);
        var scaledTitleTextWidth = Math.ceil(rawTitleWidth * scale);

        var maxTitleBoxWidth = Math.floor(availableWidth - scaledArtistWidth - actualGap);

        container.style.setProperty('--scale', scale);

        artistWrap.style.width = scaledArtistWidth + 'px';
        artistWrap.style.flex = '0 0 ' + scaledArtistWidth + 'px';

        titleWrap.style.width = maxTitleBoxWidth + 'px';
        titleWrap.style.flex = '0 0 ' + maxTitleBoxWidth + 'px';

        if (scaledTitleTextWidth > maxTitleBoxWidth + 2) {
            applyMarquee(titleEl);
        }
    }

    function setText(album, artist) {
        var albumTitle = document.getElementById('album-title');
        var artistName = document.getElementById('artist-name');

        if (albumTitle) {
            resetMarquee(albumTitle);
            albumTitle.textContent = album || '';
        }
        if (artistName) {
            artistName.textContent = artist || '';
        }

        updateLayout();
    }

    function show(albumTitleText, artistNameText) {
        var container = getContainer();
        if (hideTimer) {
            clearTimeout(hideTimer);
            hideTimer = null;
        }

        setText(albumTitleText, artistNameText);

        container.classList.remove('hiding');
        if (!container.classList.contains('visible')) {
            requestAnimationFrame(function () {
                container.classList.add('visible');
            });
        }
    }

    function hide() {
        var container = getContainer();

        if (container && container.classList.contains('hiding')) {
            return;
        }

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

        hideTimer = setTimeout(function () {
            setText('', '');
            container.classList.remove('hiding');
            hideTimer = null;
        }, 1000);
    }

    window.addEventListener('resize', function () {
        clearTimeout(window.resizeTimer);
        window.resizeTimer = setTimeout(updateLayout, 100);
    });

    window.InfoWidget = {
        show: show,
        hide: hide,
    };
})();
