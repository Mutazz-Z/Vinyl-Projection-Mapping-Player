(function () {
    var loadingTransitionToken = 0;
    var scheduledFadeOutTimer = null;
    var scheduledIdleRestoreTimer = null;

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

    function freezeCurrentVisualState(outline) {
        if (!outline) return;

        var computed = window.getComputedStyle(outline);
        var currentTransform = computed.transform;
        var currentOpacity = computed.opacity;

        outline.style.transition = 'none';
        if (currentTransform && currentTransform !== 'none') {
            outline.style.transform = currentTransform;
        }
        outline.style.opacity = currentOpacity;
        void outline.offsetWidth;
        outline.style.transition = '';
    }

    function show() {
        loadingTransitionToken++;
        var outline = getOutline();
        if (!outline) return;
        outline.classList.remove('hidden', 'pulsing', 'error', 'error-fill');
        outline.style.opacity = '1';
        outline.style.transform = 'translate(-50%, -50%) scale(1.25)';
    }

    function beginScanLoading() {
        var outline = getOutline();
        if (!outline) return Promise.resolve();

        var transitionToken = ++loadingTransitionToken;

        outline.classList.remove('hidden', 'pulsing', 'error', 'error-fill');
        outline.style.opacity = '1';
        outline.style.transform = 'translate(-50%, -50%) scale(0.5)';

        return waitForTransition(outline, 'transform', 520).then(function () {
            if (transitionToken !== loadingTransitionToken) return;
            outline.classList.add('pulsing');
        });
    }

    function expandToOverlay() {
        var outline = getOutline();
        if (!outline) return Promise.resolve();

        loadingTransitionToken++;

        outline.classList.remove('pulsing', 'hidden', 'error', 'error-fill');
        freezeCurrentVisualState(outline);
        outline.style.opacity = '1';

        void outline.offsetWidth;

        requestAnimationFrame(function () {
            outline.style.transform = 'translate(-50%, -50%) scale(1)';
        });

        return waitForTransition(outline, 'transform', 520);
    }

    function fadeOut() {
        var outline = getOutline();
        if (!outline) return Promise.resolve();
        loadingTransitionToken++;
        outline.classList.remove('pulsing', 'hidden', 'error', 'error-fill');
        outline.style.opacity = '0';

        return waitForTransition(outline, 'opacity', 420)
            .then(function () {
                outline.classList.add('hidden');
            });
    }

    function revealIdleFromOverlay() {
        loadingTransitionToken++;
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

    function cancelScheduledTransitions() {
        if (scheduledFadeOutTimer) {
            clearTimeout(scheduledFadeOutTimer);
            scheduledFadeOutTimer = null;
        }

        if (scheduledIdleRestoreTimer) {
            clearTimeout(scheduledIdleRestoreTimer);
            scheduledIdleRestoreTimer = null;
        }
    }

    function forceHide() {
        loadingTransitionToken++;
        var outline = getOutline();
        if (!outline) return;
        outline.classList.remove('pulsing', 'error', 'error-fill');
        outline.classList.add('hidden');
        outline.style.opacity = '0';
    }

    function showError() {
        loadingTransitionToken++;
        var outline = getOutline();
        if (!outline) return Promise.resolve();
        outline.classList.remove('pulsing', 'hidden');
        outline.style.opacity = '1';

        void outline.offsetWidth;
        outline.style.transform = 'translate(-50%, -50%) scale(0.5)';

        return new Promise(function (resolve) {
            requestAnimationFrame(function () {
                outline.classList.add('error-fill');
                resolve();
            });
        });
    }

    function idle(options) {
        var config = options || {};
        var fromOverlay = !!config.fromOverlay;
        var delayMs = typeof config.delayMs === 'number' ? config.delayMs : 0;

        cancelScheduledTransitions();

        if (delayMs > 0) {
            scheduledIdleRestoreTimer = setTimeout(function () {
                scheduledIdleRestoreTimer = null;
                if (fromOverlay) {
                    revealIdleFromOverlay();
                } else {
                    show();
                }
            }, delayMs);
            return;
        }

        if (fromOverlay) {
            revealIdleFromOverlay();
            return;
        }

        show();
    }

    function loading() {
        cancelScheduledTransitions();
        return beginScanLoading().then(function () {
            return expandToOverlay();
        });
    }

    function play(options) {
        var config = options || {};
        var delayMs = typeof config.fadeOutDelayMs === 'number' ? config.fadeOutDelayMs : 0;
        var onBeforeFadeOut = config.onBeforeFadeOut;

        cancelScheduledTransitions();

        if (config.immediate) {
            forceHide();
            return Promise.resolve();
        }

        if (delayMs > 0) {
            scheduledFadeOutTimer = setTimeout(function () {
                scheduledFadeOutTimer = null;
                if (onBeforeFadeOut) onBeforeFadeOut();
                fadeOut();
            }, delayMs);
            return Promise.resolve();
        }

        if (onBeforeFadeOut) onBeforeFadeOut();
        return fadeOut();
    }

    function error() {
        cancelScheduledTransitions();
        return showError();
    }

    window.LoadingWidget = {
        idle: idle,
        loading: loading,
        play: play,
        error: error,
    };

    idle();
})();