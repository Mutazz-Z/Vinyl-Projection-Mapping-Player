"use strict";
(function () {
    const PROGRESS_RENDER_EPSILON_SECONDS = 0.03;
    const PROGRESS_SEEK_RESET_THRESHOLD_SECONDS = 1.5;
    let sampledProgressSeconds = 0;
    let sampledDurationSeconds = 0;
    let sampledAtMilliseconds = 0;
    let lastRenderedProgressSeconds = null;
    let isClockRunning = false;
    let animationFrameHandle = null;
    function getContainer() {
        return document.querySelector('#progress-widget .progress-container');
    }
    function show(options) {
        const config = (options && typeof options === 'object') ? options : {};
        const containerElement = getContainer();
        if (config.visible !== false && containerElement) {
            containerElement.classList.add('visible');
        }
        if (config.reset === true) {
            reset();
        }
        if (Object.prototype.hasOwnProperty.call(config, 'playbackState')) {
            const playbackState = Number(config.playbackState);
            if (playbackState === MediaPlaybackState.Playing) {
                play();
            }
            else {
                pause();
            }
        }
        if (config.snapshot) {
            consumePlaybackSnapshot(config.snapshot);
        }
        if (config.sample) {
            const sample = config.sample;
            applyProgressSample(sample.positionSeconds, sample.durationSeconds, sample.options);
        }
        if (config.update) {
            update(config.update.progressSeconds, config.update.durationSeconds);
        }
    }
    function hide(options) {
        const config = (options && typeof options === 'object') ? options : {};
        const containerElement = getContainer();
        if (config.visible !== false && containerElement) {
            containerElement.classList.remove('visible');
        }
        if (config.pauseClock === true) {
            pause();
        }
        if (config.reset === true) {
            reset();
        }
    }
    function formatTimeInMinutesAndSeconds(seconds) {
        if (isNaN(seconds))
            return '0:00';
        const minutes = Math.floor(seconds / 60);
        const secondsPart = Math.floor(seconds % 60).toString().padStart(2, '0');
        return minutes + ':' + secondsPart;
    }
    function reset() {
        const progressBarElement = document.getElementById('progress-bar');
        if (progressBarElement)
            progressBarElement.style.width = '0%';
        const currentTimeElement = document.getElementById('current-time');
        const totalTimeElement = document.getElementById('total-time');
        if (currentTimeElement)
            currentTimeElement.textContent = '0:00';
        if (totalTimeElement)
            totalTimeElement.textContent = '0:00';
        cancelScheduledAnimationFrame();
        isClockRunning = false;
        sampledProgressSeconds = 0;
        sampledDurationSeconds = 0;
        sampledAtMilliseconds = 0;
        lastRenderedProgressSeconds = null;
    }
    function update(progressSeconds, durationSeconds) {
        if (!durationSeconds || durationSeconds <= 0)
            return;
        const progressPercentage = (progressSeconds / durationSeconds) * 100;
        const progressBarElement = document.getElementById('progress-bar');
        if (progressBarElement)
            progressBarElement.style.width = progressPercentage + '%';
        const currentTimeElement = document.getElementById('current-time');
        const totalTimeElement = document.getElementById('total-time');
        if (currentTimeElement)
            currentTimeElement.textContent = formatTimeInMinutesAndSeconds(progressSeconds);
        if (totalTimeElement)
            totalTimeElement.textContent = formatTimeInMinutesAndSeconds(durationSeconds);
    }
    function getCurrentHighResolutionTimeMilliseconds() {
        if (typeof performance !== 'undefined' && performance.now) {
            return performance.now();
        }
        return Date.now();
    }
    function getProjectedProgressSeconds(nowMilliseconds) {
        let projectedProgressSeconds = Number(sampledProgressSeconds || 0);
        const durationSeconds = Number(sampledDurationSeconds || 0);
        if (isClockRunning && sampledAtMilliseconds > 0) {
            projectedProgressSeconds += Math.max(0, (((nowMilliseconds || getCurrentHighResolutionTimeMilliseconds()) - sampledAtMilliseconds) / 1000));
        }
        if (durationSeconds > 0) {
            return Math.min(Math.max(projectedProgressSeconds, 0), durationSeconds);
        }
        return Math.max(projectedProgressSeconds, 0);
    }
    function hasMeaningfulProgressChange(projectedProgressSeconds) {
        return lastRenderedProgressSeconds === null
            || Math.abs(projectedProgressSeconds - lastRenderedProgressSeconds) >= PROGRESS_RENDER_EPSILON_SECONDS;
    }
    function renderCurrentProgress(forceRender) {
        if (!sampledDurationSeconds || sampledDurationSeconds <= 0)
            return;
        const projectedProgressSeconds = getProjectedProgressSeconds();
        if (!forceRender && !hasMeaningfulProgressChange(projectedProgressSeconds))
            return;
        lastRenderedProgressSeconds = projectedProgressSeconds;
        update(projectedProgressSeconds, sampledDurationSeconds);
        if (window.LyricsWidget) {
            window.LyricsWidget.show?.({ progressSeconds: projectedProgressSeconds });
        }
    }
    function scheduleNextAnimationFrame() {
        if (animationFrameHandle !== null || !isClockRunning)
            return;
        animationFrameHandle = requestAnimationFrame(function tick() {
            animationFrameHandle = null;
            if (!isClockRunning)
                return;
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
    function incomingSampleRequiresSnapToPosition(samplePositionSeconds, projectedBeforeSampleSeconds, shouldPauseClock) {
        const driftFromProjectedSeconds = samplePositionSeconds - projectedBeforeSampleSeconds;
        return !isClockRunning
            || shouldPauseClock
            || lastRenderedProgressSeconds === null
            || Math.abs(driftFromProjectedSeconds) > PROGRESS_SEEK_RESET_THRESHOLD_SECONDS;
    }
    function applyProgressSample(progressPositionSeconds, progressDurationSeconds, options) {
        const nextDurationSeconds = Number(progressDurationSeconds || 0);
        const samplePositionSeconds = Number(progressPositionSeconds || 0);
        const nowMilliseconds = getCurrentHighResolutionTimeMilliseconds();
        const projectedBeforeSampleSeconds = getProjectedProgressSeconds(nowMilliseconds);
        const shouldRunClock = options && options.running === true;
        const shouldPauseClock = options && options.running === false;
        sampledDurationSeconds = nextDurationSeconds > 0 ? nextDurationSeconds : sampledDurationSeconds;
        if (incomingSampleRequiresSnapToPosition(samplePositionSeconds, projectedBeforeSampleSeconds, !!shouldPauseClock)) {
            sampledProgressSeconds = Math.max(0, samplePositionSeconds);
        }
        else {
            sampledProgressSeconds = Math.max(0, Math.max(projectedBeforeSampleSeconds, samplePositionSeconds));
        }
        sampledAtMilliseconds = nowMilliseconds;
        if (shouldPauseClock) {
            isClockRunning = false;
            cancelScheduledAnimationFrame();
        }
        else if (shouldRunClock) {
            isClockRunning = true;
        }
        renderCurrentProgress(true);
        if (isClockRunning) {
            scheduleNextAnimationFrame();
        }
    }
    function pause() {
        if (!isClockRunning)
            return;
        applyProgressSample(getProjectedProgressSeconds(), sampledDurationSeconds, { running: false });
    }
    function play() {
        if (isClockRunning || !sampledDurationSeconds || sampledDurationSeconds <= 0)
            return;
        applyProgressSample(getProjectedProgressSeconds(), sampledDurationSeconds, { running: true });
    }
    function consumePlaybackSnapshot(snapshot) {
        if (!snapshot)
            return;
        const durationSeconds = Number(snapshot.duration || 0);
        const positionSeconds = Number(snapshot.position || 0);
        const isPlaying = Number(snapshot.state) === MediaPlaybackState.Playing;
        if (!durationSeconds || durationSeconds <= 0)
            return;
        applyProgressSample(positionSeconds, durationSeconds, {
            running: isPlaying,
        });
    }
    function updateData(progressData) {
        if (!progressData || typeof progressData !== 'object')
            return;
        applyProgressSample(Number(progressData.currentDurationInTrack || 0), Number(progressData.totalDurationInTrack || 0), { running: false });
    }
    window.ProgressWidget = {
        show: show,
        hide: hide,
        updateData: updateData,
    };
})();
