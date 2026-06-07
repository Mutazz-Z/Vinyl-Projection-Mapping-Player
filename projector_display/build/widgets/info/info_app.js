"use strict";
(function () {
    let pendingTransitionCleanup = null;
    const appWindow = window;
    function getContainer() {
        return document.querySelector('#info-widget .info-container') || document.querySelector('.info-container');
    }
    function resetMarquee(element) {
        if (!element)
            return;
        element.classList.remove('marquee');
        if (element.dataset.originalText !== undefined) {
            element.textContent = element.dataset.originalText;
            delete element.dataset.originalText;
        }
    }
    function applyMarquee(element) {
        if (!element)
            return;
        const text = element.textContent || '';
        element.dataset.originalText = text;
        element.innerHTML = '';
        const firstTextSpan = document.createElement('span');
        firstTextSpan.textContent = text;
        const spacerSpan = document.createElement('span');
        spacerSpan.className = 'spacer';
        const secondTextSpan = document.createElement('span');
        secondTextSpan.textContent = text;
        element.appendChild(firstTextSpan);
        element.appendChild(spacerSpan);
        element.appendChild(secondTextSpan);
        element.classList.add('marquee');
    }
    function updateLayout() {
        const container = getContainer();
        if (!container)
            return;
        const titleEl = document.getElementById('album-title');
        const artistEl = document.getElementById('artist-name');
        const artistWrap = document.getElementById('artist-wrap');
        const titleWrap = document.getElementById('title-wrap');
        if (!titleEl || !artistEl || !titleWrap || !artistWrap)
            return;
        container.style.setProperty('--scale', '1');
        titleWrap.style.width = 'auto';
        titleWrap.style.flex = 'none';
        artistWrap.style.width = 'auto';
        artistWrap.style.flex = 'none';
        resetMarquee(titleEl);
        void container.offsetHeight;
        const rawTitleWidth = titleEl.scrollWidth;
        const rawArtistWidth = artistWrap.scrollWidth;
        const availableWidth = container.clientWidth - 8;
        if (rawTitleWidth === 0 && rawArtistWidth === 0)
            return;
        const actualGap = (rawTitleWidth > 0 && rawArtistWidth > 0) ? 20 : 0;
        const totalContentWidth = rawTitleWidth + rawArtistWidth + actualGap;
        const scale = Math.max(0.8, Math.min(1.2, availableWidth / totalContentWidth));
        const scaledArtistWidth = Math.ceil(rawArtistWidth * scale);
        const scaledTitleTextWidth = Math.ceil(rawTitleWidth * scale);
        const maxTitleBoxWidth = Math.floor(availableWidth - scaledArtistWidth - actualGap);
        container.style.setProperty('--scale', String(scale));
        artistWrap.style.width = scaledArtistWidth + 'px';
        artistWrap.style.flex = '0 0 ' + scaledArtistWidth + 'px';
        titleWrap.style.width = maxTitleBoxWidth + 'px';
        titleWrap.style.flex = '0 0 ' + maxTitleBoxWidth + 'px';
        if (scaledTitleTextWidth > maxTitleBoxWidth + 2) {
            applyMarquee(titleEl);
        }
    }
    function setText(album, artist) {
        const albumTitle = document.getElementById('album-title');
        const artistName = document.getElementById('artist-name');
        if (albumTitle) {
            resetMarquee(albumTitle);
            albumTitle.textContent = album || '';
        }
        if (artistName) {
            artistName.textContent = artist || '';
        }
        updateLayout();
    }
    function show() {
        const container = getContainer();
        if (!container)
            return;
        if (pendingTransitionCleanup) {
            pendingTransitionCleanup();
            pendingTransitionCleanup = null;
        }
        container.classList.remove('hiding');
        if (!container.classList.contains('visible')) {
            requestAnimationFrame(function () {
                container.classList.add('visible');
            });
        }
    }
    function hide() {
        const container = getContainer();
        if (container && container.classList.contains('hiding')) {
            return;
        }
        if (pendingTransitionCleanup) {
            pendingTransitionCleanup();
            pendingTransitionCleanup = null;
        }
        if (!container) {
            return;
        }
        const onTransitionEnd = function (event) {
            const transitionEvent = event;
            if (transitionEvent.target !== container)
                return;
            if (transitionEvent.propertyName !== 'transform')
                return;
            container.classList.remove('hiding');
            container.removeEventListener('transitionend', onTransitionEnd);
            if (pendingTransitionCleanup === cleanup) {
                pendingTransitionCleanup = null;
            }
        };
        const cleanup = function () {
            container.removeEventListener('transitionend', onTransitionEnd);
            container.classList.remove('hiding');
        };
        pendingTransitionCleanup = cleanup;
        container.addEventListener('transitionend', onTransitionEnd);
        container.classList.remove('hiding');
        container.classList.add('visible');
        void container.offsetHeight;
        requestAnimationFrame(function () {
            container.classList.add('hiding');
            container.classList.remove('visible');
        });
    }
    function updateData(albumInfo) {
        if (!albumInfo || (!albumInfo.title && !albumInfo.artist)) {
            return;
        }
        setText(albumInfo.title, albumInfo.artist);
    }
    window.addEventListener('resize', function () {
        clearTimeout(appWindow.resizeTimer);
        appWindow.resizeTimer = setTimeout(updateLayout, 100);
    });
    appWindow.InfoWidget = {
        show: show,
        hide: hide,
        updateData: updateData,
    };
})();
