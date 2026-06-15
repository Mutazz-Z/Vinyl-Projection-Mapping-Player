import { LyricData_t, TrackLyrics_t } from "../../types/state";

export class LyricsWidget_t {
    private uiLines: Array<{ time: number; text: string; element: HTMLElement }> = [];
    private currentTimeSeconds = 0;
    private fixedStepPx = 120;
    private contextPrevEl: HTMLElement | null = null;
    private contextNextEl: HTMLElement | null = null;
    private interTrackBridgeActive = false;
    private suppressTransitionsUntilNextFrame = false;
    private bridgeSourceIndex = -1;
    private bridgeEntrancePending = false;
    private latestLyricsData: TrackLyrics_t | null = null;
    private renderedLyricsData: TrackLyrics_t | null = null;

    private readonly MIN_STEP_PX = 112;
    private readonly STEP_PADDING_PX = 26;
    private readonly contextLines = {
        previousTrackLine: '',
        upcomingTrackLine: '',
    };

    private getContainer(): HTMLElement | null {
        return document.getElementById('lyrics-scroll');
    }

    private ensureContextElements(): { prev: HTMLElement; next: HTMLElement } | null {
        const container = this.getContainer();
        if (!container) return null;

        if (!this.contextPrevEl) {
            this.contextPrevEl = document.createElement('div');
            this.contextPrevEl.className = 'lyric-line lyric-context-prev';
            container.appendChild(this.contextPrevEl);
        }

        if (!this.contextNextEl) {
            this.contextNextEl = document.createElement('div');
            this.contextNextEl.className = 'lyric-line lyric-context-next';
            container.appendChild(this.contextNextEl);
        }

        return { prev: this.contextPrevEl, next: this.contextNextEl };
    }

    private computeLineUnitPx(lineElement: HTMLElement): number {
        const style = window.getComputedStyle(lineElement);
        const fontSize = parseFloat(style.fontSize) || 28;
        const lineHeight = parseFloat(style.lineHeight) || (fontSize * 1.25);
        return Math.ceil(lineHeight);
    }

    private recomputeFixedStep(): void {
        const context = this.ensureContextElements();
        if (!context) return;

        const anchorEl = this.uiLines.length > 0 ? this.uiLines[0].element : context.next;
        const unit = this.computeLineUnitPx(anchorEl);
        let maxHeight = unit;

        this.uiLines.forEach((line) => {
            const renderedHeight = Math.ceil(line.element.getBoundingClientRect().height || 0);
            if (renderedHeight > maxHeight) maxHeight = renderedHeight;
        });

        const contextHeights = [context.prev, context.next].map((contextElement) => {
            return Math.ceil(contextElement.getBoundingClientRect().height || 0);
        });

        maxHeight = Math.max(maxHeight, contextHeights[0], contextHeights[1]);
        this.fixedStepPx = Math.max(this.MIN_STEP_PX, maxHeight + this.STEP_PADDING_PX);
    }

    private findActiveIndex(timeSeconds: number): number {
        if (this.uiLines.length === 0) return -1;

        let activeIndex = -1;
        for (let i = 0; i < this.uiLines.length; i++) {
            if (timeSeconds >= this.uiLines[i].time) activeIndex = i;
            else break;
        }

        return activeIndex;
    }

    private applyLineVisuals(lineElement: HTMLElement, text: string, yPx: number, opacity: number, isActive: boolean): void {
        lineElement.textContent = text || '';
        lineElement.style.transform = 'translateY(calc(' + yPx + 'px - 50%))';
        lineElement.style.opacity = text ? String(opacity) : '0';
        lineElement.classList.toggle('active', isActive && Boolean(text));
        lineElement.classList.toggle('no-motion', this.suppressTransitionsUntilNextFrame);
    }

    private withSuppressedTransitions(work: () => void): void {
        this.suppressTransitionsUntilNextFrame = true;
        try {
            work();
        } finally {
            requestAnimationFrame(() => {
                this.suppressTransitionsUntilNextFrame = false;
                this.uiLines.forEach((line) => {
                    line.element.classList.remove('no-motion');
                });
                if (this.contextPrevEl) this.contextPrevEl.classList.remove('no-motion');
                if (this.contextNextEl) this.contextNextEl.classList.remove('no-motion');
            });
        }
    }

    private renderBridgeState(context: { prev: HTMLElement; next: HTMLElement }): void {
        const hasBridgeSourceElement = this.bridgeSourceIndex >= 0 && this.bridgeSourceIndex < this.uiLines.length;

        this.uiLines.forEach((line, index) => {
            if (hasBridgeSourceElement && index === this.bridgeSourceIndex) {
                this.applyLineVisuals(line.element, line.text, -this.fixedStepPx, 0.36, false);
                return;
            }

            if (!hasBridgeSourceElement && index === 0) {
                if (this.bridgeEntrancePending) {
                    this.applyLineVisuals(line.element, line.text, 2 * this.fixedStepPx, 0, false);
                } else {
                    this.applyLineVisuals(line.element, line.text, this.fixedStepPx, 0.34, false);
                }
                return;
            }

            const y = (index + 1) * this.fixedStepPx;
            this.applyLineVisuals(line.element, line.text, y, 0, false);
        });

        if (hasBridgeSourceElement) {
            this.applyLineVisuals(context.prev, this.contextLines.previousTrackLine, -this.fixedStepPx, 0, false);
        } else {
            this.applyLineVisuals(context.prev, this.contextLines.previousTrackLine, -this.fixedStepPx, 0.36, false);
        }

        if (this.uiLines.length === 0) {
            if (this.bridgeEntrancePending) {
                this.applyLineVisuals(context.next, this.contextLines.upcomingTrackLine, 2 * this.fixedStepPx, 0, false);
            } else {
                this.applyLineVisuals(context.next, this.contextLines.upcomingTrackLine, this.fixedStepPx, 0.34, false);
            }
        } else {
            this.applyLineVisuals(context.next, this.contextLines.upcomingTrackLine, this.fixedStepPx, 0, false);
        }
    }

    private renderNormalState(context: { prev: HTMLElement; next: HTMLElement }, activeIndex: number, preFirst: boolean): void {
        this.uiLines.forEach((line, index) => {
            if (preFirst) {
                if (index === 0) {
                    this.applyLineVisuals(line.element, line.text, this.fixedStepPx, 0.5, false);
                } else {
                    this.applyLineVisuals(line.element, line.text, (index + 1) * this.fixedStepPx, 0, false);
                }
                return;
            }

            const indexDelta = index - activeIndex;
            const y = indexDelta * this.fixedStepPx;

            if (Math.abs(indexDelta) > 1) {
                this.applyLineVisuals(line.element, line.text, y, 0, false);
                return;
            }

            if (indexDelta === 0) {
                this.applyLineVisuals(line.element, line.text, 0, 1, true);
            } else {
                this.applyLineVisuals(line.element, line.text, y, 0.42, false);
            }
        });

        if (preFirst) {
            this.applyLineVisuals(context.prev, this.contextLines.previousTrackLine, -this.fixedStepPx, 0.36, false);
            this.applyLineVisuals(context.next, this.contextLines.upcomingTrackLine, this.fixedStepPx, 0, false);
            return;
        }

        this.applyLineVisuals(context.prev, this.contextLines.previousTrackLine, -this.fixedStepPx, 0, false);
        this.applyLineVisuals(context.next, this.contextLines.upcomingTrackLine, this.fixedStepPx, 0, false);
    }

    private renderState(): void {
        const context = this.ensureContextElements();
        if (!context) return;

        const activeIndex = this.findActiveIndex(this.currentTimeSeconds);
        const preFirst = this.uiLines.length > 0 && activeIndex < 0;

        this.recomputeFixedStep();

        if (this.interTrackBridgeActive) {
            this.renderBridgeState(context);
            return;
        }

        this.renderNormalState(context, activeIndex, preFirst);
    }

    private updateLyrics(lyricsData: TrackLyrics_t | null): void {
        const container = this.getContainer();
        if (!container) return;

        const incomingLines = lyricsData ? lyricsData.lines : [];

        this.withSuppressedTransitions(() => {
            this.ensureContextElements();
            const insertBeforeNode = this.contextPrevEl || this.contextNextEl || null;

            for (let i = 0; i < incomingLines.length; i++) {
                const lineObj = incomingLines[i];

                if (i < this.uiLines.length) {
                    this.uiLines[i].time = lineObj.timeStart;
                    this.uiLines[i].text = lineObj.text;
                    this.uiLines[i].element.textContent = lineObj.text;
                } else {
                    const lyricLineElement = document.createElement('div');
                    lyricLineElement.className = 'lyric-line no-motion';
                    lyricLineElement.textContent = lineObj.text;
                    container.insertBefore(lyricLineElement, insertBeforeNode);

                    this.uiLines.push({
                        time: lineObj.timeStart,
                        text: lineObj.text,
                        element: lyricLineElement,
                    });
                }
            }

            while (this.uiLines.length > incomingLines.length) {
                const removed = this.uiLines.pop();
                if (removed && removed.element && removed.element.parentNode) {
                    removed.element.parentNode.removeChild(removed.element);
                }
            }

            if (this.interTrackBridgeActive) {
                this.bridgeSourceIndex = -1;
                this.bridgeEntrancePending = this.uiLines.length > 0;
                if (this.bridgeEntrancePending) {
                    requestAnimationFrame(() => {
                        requestAnimationFrame(() => {
                            this.bridgeEntrancePending = false;
                            this.renderState();
                        });
                    });
                }
            }

            this.renderState();
        });
    }

    private syncProgress(timeSeconds: number): void {
        this.currentTimeSeconds = Number(timeSeconds) || 0;

        if (this.interTrackBridgeActive && this.uiLines.length > 0) {
            const firstLineTime = Number(this.uiLines[0].time || 0);
            if (this.currentTimeSeconds >= firstLineTime) {
                this.interTrackBridgeActive = false;
                this.bridgeSourceIndex = -1;
                this.bridgeEntrancePending = false;
            }
        }

        this.renderState();
    }

    private clear(): void {
        this.uiLines = [];
        this.currentTimeSeconds = 0;
        this.interTrackBridgeActive = false;
        this.bridgeSourceIndex = -1;
        this.bridgeEntrancePending = false;
        this.contextLines.previousTrackLine = '';
        this.contextLines.upcomingTrackLine = '';
        this.latestLyricsData = null;
        this.renderedLyricsData = null;

        const container = this.getContainer();
        if (container) container.innerHTML = '';

        this.contextPrevEl = null;
        this.contextNextEl = null;
    }

    private getLyricsWidgetElement(): HTMLElement | null {
        return document.getElementById('lyrics-widget');
    }

    public show(): void {
        const element = this.getLyricsWidgetElement();
        if (!element) return;

        element.style.display = 'block';
        void element.offsetWidth;
        element.classList.add('visible');

        if (this.latestLyricsData && this.renderedLyricsData !== this.latestLyricsData) {
            this.updateLyrics(this.latestLyricsData);
            this.renderedLyricsData = this.latestLyricsData;
        }
    }

    public updateData(lyricData: LyricData_t): void {
        this.setLyricsDataForCurrentTrack(lyricData.readyForDisplay ? lyricData.trackLyrics : null);

        const element = this.getLyricsWidgetElement();
        const isVisible = !!(element && element.classList.contains('visible'));
        if (isVisible && this.latestLyricsData && this.renderedLyricsData !== this.latestLyricsData) {
            this.updateLyrics(this.latestLyricsData);
            this.renderedLyricsData = this.latestLyricsData;
        }
    }

    public updateProgress(progressSeconds: number): void {
        this.syncProgress(progressSeconds);
    }

    public hide(): void {
        const element = this.getLyricsWidgetElement();
        if (!element) return;

        element.classList.remove('visible');
    }

    private setLyricsDataForCurrentTrack(lyricsData: TrackLyrics_t | null): void {
        if (lyricsData && lyricsData.lines && lyricsData.lines.length > 0) {
            this.latestLyricsData = lyricsData;
        } else {
            this.latestLyricsData = null;
        }
    }
}

export const LyricsWidget = new LyricsWidget_t();
