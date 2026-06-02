(function () {
    const PROGRESS_RENDER_EPSILON_SECONDS = 0.03;
    const PROGRESS_SEEK_RESET_THRESHOLD_SECONDS = 1.5;

    let sampledProgressSeconds = 0;
    let sampledDurationSeconds = 0;
    let sampledAtMs = 0;
    let lastRenderedProgressSeconds = null;
    let clockRunning = false;
    let animationFrameHandle = null;

    let onTickCallback = null;

    function getCurrentHighResolutionTimeMs() {
        if (typeof performance !== 'undefined' && performance.now) {
            return performance.now();
        }
        return Date.now();
    }

    function getProjectedProgressSeconds(nowMs) {
        let projected = Number(sampledProgressSeconds || 0);
        const duration = Number(sampledDurationSeconds || 0);

        if (clockRunning && sampledAtMs > 0) {
            projected += Math.max(0, ((nowMs || getCurrentHighResolutionTimeMs()) - sampledAtMs) / 1000);
        }

        if (duration > 0) {
            return Math.min(Math.max(projected, 0), duration);
        }

        return Math.max(projected, 0);
    }

    function hasMeaningfulProgressChange(projected) {
        return lastRenderedProgressSeconds === null ||
            Math.abs(projected - lastRenderedProgressSeconds) >= PROGRESS_RENDER_EPSILON_SECONDS;
    }

    function renderCurrentProgress(forceRender) {
        if (!sampledDurationSeconds || sampledDurationSeconds <= 0) return;

        const projected = getProjectedProgressSeconds();
        if (!forceRender && !hasMeaningfulProgressChange(projected)) return;

        lastRenderedProgressSeconds = projected;

        window.ProgressWidget.update(projected, sampledDurationSeconds);

        if (window.LyricsWidget) {
            window.LyricsWidget.syncProgress(projected);
        }

        if (onTickCallback) {
            onTickCallback(projected, sampledDurationSeconds);
        }
    }

    function scheduleNextAnimationFrame() {
        if (animationFrameHandle !== null || !clockRunning) return;

        animationFrameHandle = requestAnimationFrame(function tick() {
            animationFrameHandle = null;

            if (!clockRunning) return;

            renderCurrentProgress(false);
            scheduleNextAnimationFrame();
        });
    }

    function cancelScheduledAnimationFrame() {
        if (animationFrameHandle !== null) {
            cancelAnimationFrame(animationFrameHandle);
            animationFrameHandle = null;
        }
    }

    function incomingSampleRequiresSnapToPosition(samplePosition, projectedBeforeSample, shouldPauseClock) {
        const driftFromProjected = samplePosition - projectedBeforeSample;
        return !clockRunning ||
            shouldPauseClock ||
            lastRenderedProgressSeconds === null ||
            Math.abs(driftFromProjected) > PROGRESS_SEEK_RESET_THRESHOLD_SECONDS;
    }

    function applyProgressSample(position, duration, options) {
        const nextDuration = Number(duration || 0);
        const samplePosition = Number(position || 0);
        const nowMs = getCurrentHighResolutionTimeMs();
        const projectedBeforeSample = getProjectedProgressSeconds(nowMs);
        const shouldRunClock = options && options.running === true;
        const shouldPauseClock = options && options.running === false;

        sampledDurationSeconds = nextDuration > 0 ? nextDuration : sampledDurationSeconds;

        if (incomingSampleRequiresSnapToPosition(samplePosition, projectedBeforeSample, shouldPauseClock)) {
            sampledProgressSeconds = Math.max(0, samplePosition);
        } else {
            sampledProgressSeconds = Math.max(0, Math.max(projectedBeforeSample, samplePosition));
        }

        sampledAtMs = nowMs;

        if (shouldPauseClock) {
            clockRunning = false;
            cancelScheduledAnimationFrame();
        } else if (shouldRunClock) {
            clockRunning = true;
        }

        renderCurrentProgress(true);

        if (clockRunning) {
            scheduleNextAnimationFrame();
        }
    }

    function pause() {
        if (!clockRunning) return;
        applyProgressSample(getProjectedProgressSeconds(), sampledDurationSeconds, { running: false });
    }

    function resume() {
        if (clockRunning || !sampledDurationSeconds || sampledDurationSeconds <= 0) return;
        applyProgressSample(getProjectedProgressSeconds(), sampledDurationSeconds, { running: true });
    }

    function reset() {
        cancelScheduledAnimationFrame();
        clockRunning = false;
        sampledProgressSeconds = 0;
        sampledDurationSeconds = 0;
        sampledAtMs = 0;
        lastRenderedProgressSeconds = null;
    }

    function resetForTrackChange() {
        cancelScheduledAnimationFrame();
        sampledProgressSeconds = 0;
        sampledDurationSeconds = 0;
        sampledAtMs = getCurrentHighResolutionTimeMs();
        lastRenderedProgressSeconds = null;

        window.ProgressWidget.update(0, 0);

        if (window.LyricsWidget) {
            window.LyricsWidget.syncProgress(0);
        }

        if (clockRunning) {
            scheduleNextAnimationFrame();
        }
    }

    function isRunning() {
        return clockRunning;
    }

    function setOnTickCallback(callback) {
        onTickCallback = typeof callback === 'function' ? callback : null;
    }

    window.ProgressController = {
        applyProgressSample,
        pause,
        resume,
        reset,
        resetForTrackChange,
        isRunning,
        setOnTickCallback,
    };
})();