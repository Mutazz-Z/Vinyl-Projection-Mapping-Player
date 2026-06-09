(function () {
    let uiLines: Array<{ time: number; text: string; element: HTMLElement }> = [];
    let currentActiveIndex: number | null = null;
    let currentTimeSeconds = 0;
    let fixedStepPx = 120;
    let contextPrevEl: HTMLElement | null = null;
    let contextNextEl: HTMLElement | null = null;
    let interTrackBridgeActive = false;
    let suppressTransitionsUntilNextFrame = false;
    let bridgeSourceIndex = -1;
    let bridgeEntrancePending = false;
    let latestLyricsData: TrackLyrics_t | null = null;
    let renderedLyricsData: TrackLyrics_t | null = null;
    let hasLyricsForCurrentTrack = false;
    let lyricsRevealUnlocked = false;
    let hideTransitionInProgress = false;
    let hideTransitionTimeoutHandle: ReturnType<typeof setTimeout> | null = null;
    let pendingHideCallbacks: Array<() => void> = [];

    const MIN_STEP_PX = 112;
    const STEP_PADDING_PX = 26;
    const contextLines = {
        previousTrackLine: '',
        upcomingTrackLine: '',
    };

    type LyricsContext = {
        previousTrackLine?: string;
        upcomingTrackLine?: string;
    };

    type LyricsShowOptions = LyricsContext & {
        lyricsData?: TrackLyrics_t | null;
        progressSeconds?: number;
        enterInterTrackBridge?: boolean;
        isPlaying?: boolean;
        isPlaybackVisualActive?: boolean;
        awaitingMusicStart?: boolean;
    };

    function getContainer(): HTMLElement | null {
        return document.getElementById('lyrics-scroll');
    }

    function ensureContextElements(): { prev: HTMLElement; next: HTMLElement } | null {
        const container = getContainer();
        if (!container) return null;

        if (!contextPrevEl) {
            contextPrevEl = document.createElement('div');
            contextPrevEl.className = 'lyric-line lyric-context-prev';
            container.appendChild(contextPrevEl);
        }

        if (!contextNextEl) {
            contextNextEl = document.createElement('div');
            contextNextEl.className = 'lyric-line lyric-context-next';
            container.appendChild(contextNextEl);
        }

        return { prev: contextPrevEl, next: contextNextEl };
    }

    function computeLineUnitPx(lineElement: HTMLElement): number {
        const style = window.getComputedStyle(lineElement);
        const fontSize = parseFloat(style.fontSize) || 28;
        const lineHeight = parseFloat(style.lineHeight) || (fontSize * 1.25);
        return Math.ceil(lineHeight);
    }

    function recomputeFixedStep(): void {
        const context = ensureContextElements();
        if (!context) return;

        const anchorEl = uiLines.length > 0 ? uiLines[0].element : context.next;
        const unit = computeLineUnitPx(anchorEl);
        let maxHeight = unit;

        uiLines.forEach(function (line) {
            const renderedHeight = Math.ceil(line.element.getBoundingClientRect().height || 0);
            if (renderedHeight > maxHeight) {
                maxHeight = renderedHeight;
            }
        });

        const contextHeights = [context.prev, context.next].map(function (contextElement) {
            return Math.ceil(contextElement.getBoundingClientRect().height || 0);
        });

        maxHeight = Math.max(maxHeight, contextHeights[0], contextHeights[1]);
        fixedStepPx = Math.max(MIN_STEP_PX, maxHeight + STEP_PADDING_PX);
    }

    function findActiveIndex(timeSeconds: number): number {
        if (uiLines.length === 0) return -1;

        let activeIndex = -1;
        for (let i = 0; i < uiLines.length; i++) {
            if (timeSeconds >= uiLines[i].time) {
                activeIndex = i;
            } else {
                break;
            }
        }

        return activeIndex;
    }

    function applyLineVisuals(lineElement: HTMLElement, text: string, yPx: number, opacity: number, isActive: boolean): void {
        lineElement.textContent = text || '';
        lineElement.style.transform = 'translateY(calc(' + yPx + 'px - 50%))';
        lineElement.style.opacity = text ? String(opacity) : '0';
        lineElement.classList.toggle('active', isActive && Boolean(text));
        lineElement.classList.toggle('no-motion', suppressTransitionsUntilNextFrame);
    }

    function withSuppressedTransitions(work: () => void): void {
        suppressTransitionsUntilNextFrame = true;
        try {
            work();
        } finally {
            requestAnimationFrame(function () {
                suppressTransitionsUntilNextFrame = false;
                uiLines.forEach(function (line) {
                    line.element.classList.remove('no-motion');
                });
                if (contextPrevEl) contextPrevEl.classList.remove('no-motion');
                if (contextNextEl) contextNextEl.classList.remove('no-motion');
            });
        }
    }

    function renderState(): void {
        const context = ensureContextElements();
        if (!context) return;

        const activeIndex = findActiveIndex(currentTimeSeconds);
        const preFirst = uiLines.length > 0 && activeIndex < 0;

        recomputeFixedStep();

        if (interTrackBridgeActive) {
            const hasBridgeSourceElement = bridgeSourceIndex >= 0 && bridgeSourceIndex < uiLines.length;

            uiLines.forEach(function (line, index) {
                if (hasBridgeSourceElement && index === bridgeSourceIndex) {
                    applyLineVisuals(line.element, line.text, -fixedStepPx, 0.36, false);
                    return;
                }

                if (!hasBridgeSourceElement && index === 0) {
                    if (bridgeEntrancePending) {
                        applyLineVisuals(line.element, line.text, 2 * fixedStepPx, 0, false);
                    } else {
                        applyLineVisuals(line.element, line.text, fixedStepPx, 0.34, false);
                    }
                    return;
                }

                const y = (index + 1) * fixedStepPx;
                applyLineVisuals(line.element, line.text, y, 0, false);
            });

            if (hasBridgeSourceElement) {
                applyLineVisuals(context.prev, contextLines.previousTrackLine, -fixedStepPx, 0, false);
            } else {
                applyLineVisuals(context.prev, contextLines.previousTrackLine, -fixedStepPx, 0.36, false);
            }

            if (uiLines.length === 0) {
                if (bridgeEntrancePending) {
                    applyLineVisuals(context.next, contextLines.upcomingTrackLine, 2 * fixedStepPx, 0, false);
                } else {
                    applyLineVisuals(context.next, contextLines.upcomingTrackLine, fixedStepPx, 0.34, false);
                }
            } else {
                applyLineVisuals(context.next, contextLines.upcomingTrackLine, fixedStepPx, 0, false);
            }

            currentActiveIndex = -1;
            return;
        }

        uiLines.forEach(function (line, index) {
            if (preFirst) {
                if (index === 0) {
                    applyLineVisuals(line.element, line.text, fixedStepPx, 0.5, false);
                } else {
                    applyLineVisuals(line.element, line.text, (index + 1) * fixedStepPx, 0, false);
                }
                return;
            }

            const indexDelta = index - activeIndex;
            const y = indexDelta * fixedStepPx;

            if (Math.abs(indexDelta) > 1) {
                applyLineVisuals(line.element, line.text, y, 0, false);
                return;
            }

            if (indexDelta === 0) {
                applyLineVisuals(line.element, line.text, 0, 1, true);
            } else {
                applyLineVisuals(line.element, line.text, y, 0.42, false);
            }
        });

        if (preFirst) {
            applyLineVisuals(context.prev, contextLines.previousTrackLine, -fixedStepPx, 0.36, false);
            applyLineVisuals(context.next, contextLines.upcomingTrackLine, fixedStepPx, 0, false);
            currentActiveIndex = -1;
            return;
        }

        applyLineVisuals(context.prev, contextLines.previousTrackLine, -fixedStepPx, 0, false);
        applyLineVisuals(context.next, contextLines.upcomingTrackLine, fixedStepPx, 0, false);
        currentActiveIndex = activeIndex;
    }

    function sanitizeLines(lyricsData: TrackLyrics_t | null): Array<{ time: number; text: string }> {
        if (!lyricsData || !Array.isArray(lyricsData.lines)) return [];

        const lines: Array<{ time: number; text: string }> = [];
        lyricsData.lines.forEach(function (lineObj) {
            if (!lineObj || !lineObj.text) return;
            lines.push({
                time: Number(lineObj.timeStart) || 0,
                text: lineObj.text,
            });
        });

        return lines;
    }

    function updateLyrics(lyricsData: TrackLyrics_t | null): void {
        const container = getContainer();
        if (!container) return;

        const parsedLines = sanitizeLines(lyricsData);

        withSuppressedTransitions(function () {
            ensureContextElements();
            const insertBeforeNode = contextPrevEl || contextNextEl || null;

            for (let i = 0; i < parsedLines.length; i++) {
                const lineObj = parsedLines[i];

                if (i < uiLines.length) {
                    uiLines[i].time = lineObj.time;
                    uiLines[i].text = lineObj.text;
                    uiLines[i].element.textContent = lineObj.text;
                } else {
                    const lyricLineElement = document.createElement('div');
                    lyricLineElement.className = 'lyric-line no-motion';
                    lyricLineElement.textContent = lineObj.text;
                    container.insertBefore(lyricLineElement, insertBeforeNode);

                    uiLines.push({
                        time: lineObj.time,
                        text: lineObj.text,
                        element: lyricLineElement,
                    });
                }
            }

            while (uiLines.length > parsedLines.length) {
                const removed = uiLines.pop();
                if (removed && removed.element && removed.element.parentNode) {
                    removed.element.parentNode.removeChild(removed.element);
                }
            }

            if (interTrackBridgeActive) {
                bridgeSourceIndex = -1;
                bridgeEntrancePending = uiLines.length > 0;
                if (bridgeEntrancePending) {
                    requestAnimationFrame(function () {
                        requestAnimationFrame(function () {
                            bridgeEntrancePending = false;
                            renderState();
                        });
                    });
                }
            }

            renderState();
        });
    }

    function syncProgress(timeSeconds: number): void {
        currentTimeSeconds = Number(timeSeconds) || 0;

        if (interTrackBridgeActive && uiLines.length > 0) {
            const firstLineTime = Number(uiLines[0].time || 0);
            if (currentTimeSeconds >= firstLineTime) {
                interTrackBridgeActive = false;
                bridgeSourceIndex = -1;
                bridgeEntrancePending = false;
            }
        }

        renderState();
    }

    function setTrackContext(context?: LyricsContext): void {
        contextLines.previousTrackLine = (context && context.previousTrackLine) ? String(context.previousTrackLine) : '';
        contextLines.upcomingTrackLine = (context && context.upcomingTrackLine) ? String(context.upcomingTrackLine) : '';
        renderState();
    }

    function enterInterTrackBridge(context?: LyricsContext): void {
        contextLines.previousTrackLine = (context && context.previousTrackLine) ? String(context.previousTrackLine) : '';
        contextLines.upcomingTrackLine = (context && context.upcomingTrackLine) ? String(context.upcomingTrackLine) : '';
        currentTimeSeconds = 0;
        const resolvedActive = findActiveIndex(currentTimeSeconds);
        bridgeSourceIndex = currentActiveIndex !== null && currentActiveIndex >= 0
            ? currentActiveIndex
            : (resolvedActive >= 0 ? resolvedActive : (uiLines.length > 0 ? uiLines.length - 1 : -1));
        bridgeEntrancePending = true;
        interTrackBridgeActive = true;
        renderState();

        requestAnimationFrame(function () {
            bridgeEntrancePending = false;
            renderState();
        });
    }

    function clear(): void {
        uiLines = [];
        currentActiveIndex = null;
        currentTimeSeconds = 0;
        interTrackBridgeActive = false;
        bridgeSourceIndex = -1;
        bridgeEntrancePending = false;
        contextLines.previousTrackLine = '';
        contextLines.upcomingTrackLine = '';

        const container = getContainer();
        if (container) {
            container.innerHTML = '';
        }

        contextPrevEl = null;
        contextNextEl = null;
    }

    function getLyricsWidgetElement(): HTMLElement | null {
        return document.getElementById('lyrics-widget');
    }

    function flushPendingHideCallbacks(): void {
        while (pendingHideCallbacks.length > 0) {
            const callback = pendingHideCallbacks.shift();
            if (callback) callback();
        }
    }

    function displayWidget(): void {
        const element = getLyricsWidgetElement();
        if (!element) return;

        cancelPendingHide();
        element.style.display = 'block';
        void element.offsetWidth;
        element.classList.add('visible');
    }

    function shouldDisplayWidgetForCurrentState(): boolean {
        return interTrackBridgeActive || Boolean(lyricsRevealUnlocked && hasLyricsForCurrentTrack && latestLyricsData);
    }

    function show(options?: LyricsShowOptions): void {
        if (options) {
            if (Object.prototype.hasOwnProperty.call(options, 'lyricsData')) {
                setLyricsDataForCurrentTrack(options.lyricsData || null);
            }

            if (typeof options.progressSeconds === 'number') {
                syncProgress(options.progressSeconds);
            }

            if (options.previousTrackLine || options.upcomingTrackLine) {
                setTrackContext({
                    previousTrackLine: options.previousTrackLine,
                    upcomingTrackLine: options.upcomingTrackLine,
                });
            }

            if (options.enterInterTrackBridge) {
                enterInterTrackBridge({
                    previousTrackLine: options.previousTrackLine,
                    upcomingTrackLine: options.upcomingTrackLine,
                });
            }

            if (options.isPlaying === true) {
                unlockLyricsReveal();
            }

            if (typeof options.isPlaying === 'boolean' || typeof options.isPlaybackVisualActive === 'boolean') {
                const isPlaying = typeof options.isPlaying === 'boolean' ? options.isPlaying : true;
                const awaitingMusicStart = options.awaitingMusicStart === true;
                syncLyricsVisibilityWithPlaybackState(isPlaying, awaitingMusicStart);
            } else if (shouldDisplayWidgetForCurrentState()) {
                displayWidget();
            }
        } else {
            displayWidget();
        }
    }

    function updateData(options?: LyricsShowOptions): void {
        if (!options) return;

        if (Object.prototype.hasOwnProperty.call(options, 'lyricsData')) {
            setLyricsDataForCurrentTrack(options.lyricsData || null);
        }

        if (typeof options.progressSeconds === 'number') {
            syncProgress(options.progressSeconds);
        }

        if (options.previousTrackLine || options.upcomingTrackLine) {
            setTrackContext({
                previousTrackLine: options.previousTrackLine,
                upcomingTrackLine: options.upcomingTrackLine,
            });
        }

        if (options.enterInterTrackBridge) {
            enterInterTrackBridge({
                previousTrackLine: options.previousTrackLine,
                upcomingTrackLine: options.upcomingTrackLine,
            });
        }

        const element = getLyricsWidgetElement();
        const isVisible = !!(element && element.classList.contains('visible'));
        if (isVisible && latestLyricsData && renderedLyricsData !== latestLyricsData) {
            updateLyrics(latestLyricsData);
            renderedLyricsData = latestLyricsData;
        }
    }

    function hide(onHiddenCallback?: () => void): void {
        const element = getLyricsWidgetElement();

        if (onHiddenCallback) {
            pendingHideCallbacks.push(onHiddenCallback);
        }

        if (!element) {
            flushPendingHideCallbacks();
            return;
        }

        if (element.style.display === 'none') {
            element.ontransitionend = null;
            flushPendingHideCallbacks();
            return;
        }

        if (hideTransitionInProgress) return;
        hideTransitionInProgress = true;
        const hideElement = element;

        function finalizeHide(): void {
            if (hideTransitionTimeoutHandle !== null) {
                clearTimeout(hideTransitionTimeoutHandle);
                hideTransitionTimeoutHandle = null;
            }

            hideElement.style.display = 'none';
            hideElement.ontransitionend = null;
            hideTransitionInProgress = false;
            flushPendingHideCallbacks();
        }

        hideElement.ontransitionend = function (event: TransitionEvent) {
            if (!event || event.target !== hideElement) return;
            if (!event || event.propertyName !== 'transform') return;
            if (hideElement.classList.contains('visible')) return;

            finalizeHide();
        };

        hideTransitionTimeoutHandle = setTimeout(function () {
            if (hideTransitionInProgress && !hideElement.classList.contains('visible')) {
                finalizeHide();
            }
        }, 520);

        hideElement.classList.remove('visible');
    }

    function cancelPendingHide(): void {
        const element = getLyricsWidgetElement();
        hideTransitionInProgress = false;
        if (hideTransitionTimeoutHandle !== null) {
            clearTimeout(hideTransitionTimeoutHandle);
            hideTransitionTimeoutHandle = null;
        }
        pendingHideCallbacks = [];
        if (element) element.ontransitionend = null;
    }

    function setLyricsDataForCurrentTrack(lyricsData: TrackLyrics_t | null): void {
        const hasValidLines = !!(lyricsData && Array.isArray(lyricsData.lines) && lyricsData.lines.length > 0);
        hasLyricsForCurrentTrack = hasValidLines;
        latestLyricsData = hasValidLines ? lyricsData : null;

        if (!hasValidLines) {
            const element = getLyricsWidgetElement();
            const isVisible = !!(element && element.classList.contains('visible') && element.style.display !== 'none');

            if (isVisible) {
                hide(function () {
                    clear();
                    renderedLyricsData = null;
                });
            } else {
                clear();
                renderedLyricsData = null;
            }
        }
    }

    function unlockLyricsReveal(): void {
        lyricsRevealUnlocked = true;
    }

    function hasLyrics(): boolean {
        return hasLyricsForCurrentTrack;
    }

    function syncLyricsVisibilityWithPlaybackState(isPlayingState: boolean, awaitingMusicStart: boolean): void {
        if (awaitingMusicStart || !lyricsRevealUnlocked) {
            hide();
            return;
        }

        if (hasLyricsForCurrentTrack && latestLyricsData) {
            window.VisualizerWidget?.hide?.();

            displayWidget();

            if (renderedLyricsData !== latestLyricsData) {
                updateLyrics(latestLyricsData);
                renderedLyricsData = latestLyricsData;
            }
            return;
        }

        hide(function () {
            clear();
            renderedLyricsData = null;
        });

        window.VisualizerWidget?.play?.();
    }

    window.LyricsWidget = {
        show: show,
        updateData: updateData,
        hide: hide,
        hasLyrics: hasLyrics,
    };
})();
