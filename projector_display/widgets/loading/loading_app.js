(function () {
    var watchdogTimer = null;

    function getOutline() {
        return document.getElementById('loading-outline');
    }

    function waitForTransition(el, propertyName, timeoutMs) {
        timeoutMs = timeoutMs || 700;
        return new Promise(function (resolve) {
            var done = false;

            function finish() {
                if (done) return;
                done = true;
                el.removeEventListener('transitionend', onTransitionEnd);
                resolve();
            }

            function onTransitionEnd(e) {
                if (propertyName && e.propertyName !== propertyName) return;
                finish();
            }

            el.addEventListener('transitionend', onTransitionEnd);
            setTimeout(finish, timeoutMs);
        });
    }

    function clearWatchdog() {
        if (watchdogTimer) {
            clearTimeout(watchdogTimer);
            watchdogTimer = null;
        }
    }

    function showIdle() {
        clearWatchdog();
        var outline = getOutline();
        if (!outline) return;
        outline.classList.remove('hidden', 'pulsing', 'error', 'error-fill');
        outline.style.opacity = '1';
        outline.style.transform = 'translate(-50%, -50%) scale(1.25)';
    }

    function beginScanLoading() {
        var outline = getOutline();
        if (!outline) return Promise.resolve();

        clearWatchdog();
        watchdogTimer = setTimeout(function () {
            console.error("Watchdog: Target device failed to respond in 10s.");
            showError();
        }, 10000);

        outline.classList.remove('hidden', 'pulsing', 'error', 'error-fill');
        outline.style.opacity = '1';
        outline.style.transform = 'translate(-50%, -50%) scale(0.5)';

        return waitForTransition(outline, 'transform', 520).then(function () {
            outline.classList.add('pulsing');
        });
    }

    function expandToOverlay() {
        clearWatchdog();

        var outline = getOutline();
        if (!outline) return Promise.resolve();

        outline.classList.remove('pulsing', 'hidden', 'error', 'error-fill');
        outline.style.opacity = '1';

        void outline.offsetWidth; // DOM Reflow

        outline.style.transform = 'translate(-50%, -50%) scale(1)';

        return waitForTransition(outline, 'transform', 520);
    }

    function fadeOut() {
        var outline = getOutline();
        if (!outline) return Promise.resolve();
        outline.classList.remove('pulsing', 'hidden', 'error', 'error-fill');
        outline.style.opacity = '0';

        return waitForTransition(outline, 'opacity', 420)
            .then(function () {
                outline.classList.add('hidden');
            });
    }

    function completeAndFadeOut() {
        clearWatchdog();
        return expandToOverlay().then(function () {
            return fadeOut();
        });
    }

    function revealIdleFromOverlay() {
        clearWatchdog();
        var outline = getOutline();
        if (!outline) return Promise.resolve();
        outline.classList.remove('pulsing', 'hidden', 'error', 'error-fill');
        outline.style.transform = 'translate(-50%, -50%) scale(1)';
        outline.style.opacity = '0';

        return new Promise(function (resolve) {
            requestAnimationFrame(function () {
                outline.style.transform = 'translate(-50%, -50%) scale(1.25)';
                outline.style.opacity = '1';
                waitForTransition(outline, 'transform', 520).then(resolve);
            });
        });
    }

    function forceHide() {
        clearWatchdog();
        var outline = getOutline();
        if (!outline) return;
        outline.classList.remove('pulsing', 'error', 'error-fill');
        outline.classList.add('hidden');
        outline.style.opacity = '0';
    }

    function showError() {
        clearWatchdog();
        var outline = getOutline();
        if (!outline) return Promise.resolve();
        outline.classList.remove('pulsing');

        void outline.offsetWidth;
        outline.style.transform = 'translate(-50%, -50%) scale(0.5)';

        return new Promise(function (resolve) {
            requestAnimationFrame(function () {
                outline.classList.add('error-fill');
                resolve();
            });
        });
    }

    window.LoadingWidget = {
        showIdle: showIdle,
        beginScanLoading: beginScanLoading,
        expandToOverlay: expandToOverlay,
        fadeOut: fadeOut,
        revealIdleFromOverlay: revealIdleFromOverlay,
        completeAndFadeOut: completeAndFadeOut,
        forceHide: forceHide,
        showError: showError
    };

    showIdle();
})();