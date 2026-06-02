(function () {
    const TRACKLIST_FADE_MS = 220;
    const RECORD_SLIDE_MS = 700;

    function getTracklistContainerElement() {
        return window.TracklistWidget.getContainer();
    }

    function renderTracklistInLinearLayout(trackNames) {
        window.TracklistWidget.renderTracklist(trackNames);
        window.TracklistWidget.setLinearLayout(trackNames);
    }

    function showAsCarouselWithActiveTrack(trackNames, activeTrackIndex) {
        window.TracklistWidget.updateArcCarousel(trackNames, activeTrackIndex);
    }

    function revealWithCarouselForActiveTrack(trackNames, activeTrackIndex, guardToken, getPlaybackToken) {
        const container = getTracklistContainerElement();
        if (!container) return;

        container.classList.add('visible');
        container.classList.add('carousel');
        showAsCarouselWithActiveTrack(trackNames, activeTrackIndex);

        setTimeout(function () {
            if (guardToken !== getPlaybackToken()) return;
            container.classList.remove('visible');
        }, RECORD_SLIDE_MS);
    }

    function prepareForPlaybackStart(trackNames) {
        const container = getTracklistContainerElement();
        if (!container) return;

        container.classList.remove('carousel');
        container.classList.remove('visible');
        renderTracklistInLinearLayout(trackNames);
    }

    function transitionToCarouselAfterRevealDelay(guardToken, getPlaybackToken, trackNames, activeTrackIndex, onCarouselReady) {
        const container = getTracklistContainerElement();
        if (!container) return;

        container.classList.add('visible');
        container.classList.add('carousel');
        showAsCarouselWithActiveTrack(trackNames, activeTrackIndex);

        if (onCarouselReady) onCarouselReady();
    }

    function updateCarouselForActiveTrack(trackNames, activeTrackIndex) {
        const container = getTracklistContainerElement();
        if (container && container.classList.contains('carousel')) {
            showAsCarouselWithActiveTrack(trackNames, activeTrackIndex);
        } else {
            renderTracklistInLinearLayout(trackNames);
        }
    }

    function hideAndClearAfterStopAnimation(guardToken, getPlaybackToken, currentTrackNames, onCleared) {
        const container = getTracklistContainerElement();

        if (!container) {
            if (window.TracklistWidget) window.TracklistWidget.clear();
            if (onCleared) onCleared();
            return;
        }

        // Switch from carousel to linear layout with tracks still present so
        // the slide-left animation plays before the list fades out and clears.
        container.classList.remove('carousel');
        container.classList.add('visible');
        window.TracklistWidget.setLinearLayout(currentTrackNames);

        const hideTimer = setTimeout(function () {
            if (guardToken !== getPlaybackToken()) return;
            container.classList.remove('visible');
        }, RECORD_SLIDE_MS);

        const clearTimer = setTimeout(function () {
            if (guardToken !== getPlaybackToken()) return;
            window.TracklistWidget.clear();
            if (onCleared) onCleared();
        }, RECORD_SLIDE_MS + TRACKLIST_FADE_MS);

        return { hideTimer, clearTimer };
    }

    function clear() {
        window.TracklistWidget.clear();
    }

    window.TracklistController = {
        prepareForPlaybackStart,
        transitionToCarouselAfterRevealDelay,
        updateCarouselForActiveTrack,
        hideAndClearAfterStopAnimation,
        revealWithCarouselForActiveTrack,
        showAsCarouselWithActiveTrack,
        clear,
        TRACKLIST_FADE_MS,
        RECORD_SLIDE_MS,
    };
})();