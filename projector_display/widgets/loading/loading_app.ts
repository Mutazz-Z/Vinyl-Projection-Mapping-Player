(function () {
    const LOADING_SCALE = 0.33;
    const HIDE_HOLD_MS = 1000;

    let loadingTransitionToken = 0;
    let scheduledFadeOutTimer: ReturnType<typeof setTimeout> | null = null;
    let scheduledIdleRestoreTimer: ReturnType<typeof setTimeout> | null = null;

    type IdleOptions = {
        fromOverlay?: boolean;
        delayMs?: number;
    };

    type HideOptions = {
        immediate?: boolean;
        fadeOutDelayMs?: number;
        onBeforeFadeOut?: () => void;
    };

    function getOutline(): HTMLElement | null {
        return document.getElementById('loading-outline');
    }

    function waitForTransition(el: HTMLElement, propertyName?: string, timeoutMs = 700): Promise<void> {
        return new Promise(function (resolve) {
            let done = false;

            function finish(): void {
                if (done) return;
                done = true;
                el.removeEventListener('transitionend', onTransitionEnd);
                resolve();
            }

            function onTransitionEnd(e: TransitionEvent): void {
                if (propertyName && e.propertyName !== propertyName) return;
                finish();
            }

            el.addEventListener('transitionend', onTransitionEnd);
            setTimeout(finish, timeoutMs);
        });
    }

    function freezeCurrentVisualState(outline: HTMLElement | null): void {
        if (!outline) return;

        const computed = window.getComputedStyle(outline);
        const currentTransform = computed.transform;
        const currentOpacity = computed.opacity;

        outline.style.transition = 'none';
        if (currentTransform && currentTransform !== 'none') {
            outline.style.transform = currentTransform;
        }
        outline.style.opacity = currentOpacity;
        void outline.offsetWidth;
        outline.style.transition = '';
    }

    function show(): void {
        loadingTransitionToken++;
        const outline = getOutline();
        if (!outline) return;
        outline.classList.remove('hidden', 'pulsing', 'error', 'error-fill');
        outline.style.opacity = '1';
        outline.style.transform = 'translate(-50%, -50%) scale(1.25)';
    }

    function beginScanLoading(): Promise<void> {
        const outline = getOutline();
        if (!outline) return Promise.resolve();

        const transitionToken = ++loadingTransitionToken;

        outline.classList.remove('hidden', 'pulsing', 'error', 'error-fill');
        freezeCurrentVisualState(outline);
        outline.style.opacity = '1';

        void outline.offsetWidth;

        requestAnimationFrame(function () {
            outline.style.transform = `translate(-50%, -50%) scale(${LOADING_SCALE})`;
        });

        return waitForTransition(outline, 'transform', 560).then(function () {
            if (transitionToken !== loadingTransitionToken) return;
            outline.classList.add('pulsing');
        });
    }

    function fadeOut(): Promise<void> {
        const outline = getOutline();
        if (!outline) return Promise.resolve();
        loadingTransitionToken++;
        outline.classList.remove('pulsing', 'hidden', 'error', 'error-fill');
        outline.style.opacity = '0';

        return waitForTransition(outline, 'opacity', 420)
            .then(function () {
                outline.classList.add('hidden');
            });
    }

    function waitMs(ms: number): Promise<void> {
        return new Promise(function (resolve) {
            scheduledFadeOutTimer = setTimeout(function () {
                scheduledFadeOutTimer = null;
                resolve();
            }, ms);
        });
    }

    function expandToOverlay(): Promise<void> {
        const outline = getOutline();
        if (!outline) return Promise.resolve();

        const transitionToken = ++loadingTransitionToken;

        outline.classList.remove('pulsing', 'hidden', 'error', 'error-fill');
        freezeCurrentVisualState(outline);
        outline.style.opacity = '1';

        void outline.offsetWidth;

        requestAnimationFrame(function () {
            outline.style.transform = 'translate(-50%, -50%) scale(1)';
        });

        return waitForTransition(outline, 'transform', 560).then(function () {
            if (transitionToken !== loadingTransitionToken) return;
        });
    }

    function revealIdleFromOverlay(): Promise<void> {
        loadingTransitionToken++;
        const outline = getOutline();
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

    function cancelScheduledTransitions(): void {
        if (scheduledFadeOutTimer) {
            clearTimeout(scheduledFadeOutTimer);
            scheduledFadeOutTimer = null;
        }

        if (scheduledIdleRestoreTimer) {
            clearTimeout(scheduledIdleRestoreTimer);
            scheduledIdleRestoreTimer = null;
        }
    }

    function forceHide(): void {
        loadingTransitionToken++;
        const outline = getOutline();
        if (!outline) return;
        outline.classList.remove('pulsing', 'error', 'error-fill');
        outline.classList.add('hidden');
        outline.style.opacity = '0';
    }

    function showError(): Promise<void> {
        loadingTransitionToken++;
        const outline = getOutline();
        if (!outline) return Promise.resolve();
        outline.classList.remove('pulsing', 'hidden');
        outline.style.opacity = '1';

        void outline.offsetWidth;
        outline.style.transform = `translate(-50%, -50%) scale(${LOADING_SCALE})`;

        return new Promise(function (resolve) {
            requestAnimationFrame(function () {
                outline.classList.add('error-fill');
                resolve();
            });
        });
    }

    function idle(options?: IdleOptions): void {
        const config = options || {};
        const fromOverlay = !!config.fromOverlay;
        const delayMs = typeof config.delayMs === 'number' ? config.delayMs : 0;

        cancelScheduledTransitions();

        if (delayMs > 0) {
            scheduledIdleRestoreTimer = setTimeout(function () {
                scheduledIdleRestoreTimer = null;
                if (fromOverlay) {
                    void revealIdleFromOverlay();
                } else {
                    show();
                }
            }, delayMs);
            return;
        }

        if (fromOverlay) {
            void revealIdleFromOverlay();
            return;
        }

        show();
    }

    function loading(): Promise<void> {
        cancelScheduledTransitions();
        return beginScanLoading();
    }

    function hide(options?: HideOptions): Promise<void> {
        const config = options || {};
        const delayMs = typeof config.fadeOutDelayMs === 'number' ? config.fadeOutDelayMs : 0;
        const onBeforeFadeOut = config.onBeforeFadeOut;

        cancelScheduledTransitions();

        if (config.immediate) {
            forceHide();
            return Promise.resolve();
        }

        if (delayMs > 0) {
            scheduledFadeOutTimer = setTimeout(function () {
                scheduledFadeOutTimer = null;
                void expandToOverlay()
                    .then(function () {
                        return waitMs(HIDE_HOLD_MS);
                    })
                    .then(function () {
                        if (onBeforeFadeOut) onBeforeFadeOut();
                        return fadeOut();
                    });
            }, delayMs);
            return Promise.resolve();
        }

        return expandToOverlay()
            .then(function () {
                return waitMs(HIDE_HOLD_MS);
            })
            .then(function () {
                if (onBeforeFadeOut) onBeforeFadeOut();
                return fadeOut();
            });
    }

    function error(): Promise<void> {
        cancelScheduledTransitions();
        return showError();
    }

    window.LoadingWidget = {
        idle: idle,
        loading: loading,
        hide: hide,
        error: error,
    };

    idle();
})();
