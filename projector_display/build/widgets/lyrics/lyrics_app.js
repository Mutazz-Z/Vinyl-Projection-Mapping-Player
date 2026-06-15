"use strict";
(() => {
  // widgets/lyrics/lyrics_app.ts
  var LyricsWidget_t = class {
    constructor() {
      this.uiLines = [];
      this.currentTimeSeconds = 0;
      this.fixedStepPx = 120;
      this.contextPrevEl = null;
      this.contextNextEl = null;
      this.interTrackBridgeActive = false;
      this.suppressTransitionsUntilNextFrame = false;
      this.bridgeSourceIndex = -1;
      this.bridgeEntrancePending = false;
      this.latestLyricsData = null;
      this.renderedLyricsData = null;
      this.MIN_STEP_PX = 112;
      this.STEP_PADDING_PX = 26;
      this.contextLines = {
        previousTrackLine: "",
        upcomingTrackLine: ""
      };
    }
    getContainer() {
      return document.getElementById("lyrics-scroll");
    }
    ensureContextElements() {
      const container = this.getContainer();
      if (!container) return null;
      if (!this.contextPrevEl) {
        this.contextPrevEl = document.createElement("div");
        this.contextPrevEl.className = "lyric-line lyric-context-prev";
        container.appendChild(this.contextPrevEl);
      }
      if (!this.contextNextEl) {
        this.contextNextEl = document.createElement("div");
        this.contextNextEl.className = "lyric-line lyric-context-next";
        container.appendChild(this.contextNextEl);
      }
      return { prev: this.contextPrevEl, next: this.contextNextEl };
    }
    computeLineUnitPx(lineElement) {
      const style = window.getComputedStyle(lineElement);
      const fontSize = parseFloat(style.fontSize) || 28;
      const lineHeight = parseFloat(style.lineHeight) || fontSize * 1.25;
      return Math.ceil(lineHeight);
    }
    recomputeFixedStep() {
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
    findActiveIndex(timeSeconds) {
      if (this.uiLines.length === 0) return -1;
      let activeIndex = -1;
      for (let i = 0; i < this.uiLines.length; i++) {
        if (timeSeconds >= this.uiLines[i].time) activeIndex = i;
        else break;
      }
      return activeIndex;
    }
    applyLineVisuals(lineElement, text, yPx, opacity, isActive) {
      lineElement.textContent = text || "";
      lineElement.style.transform = "translateY(calc(" + yPx + "px - 50%))";
      lineElement.style.opacity = text ? String(opacity) : "0";
      lineElement.classList.toggle("active", isActive && Boolean(text));
      lineElement.classList.toggle("no-motion", this.suppressTransitionsUntilNextFrame);
    }
    withSuppressedTransitions(work) {
      this.suppressTransitionsUntilNextFrame = true;
      try {
        work();
      } finally {
        requestAnimationFrame(() => {
          this.suppressTransitionsUntilNextFrame = false;
          this.uiLines.forEach((line) => {
            line.element.classList.remove("no-motion");
          });
          if (this.contextPrevEl) this.contextPrevEl.classList.remove("no-motion");
          if (this.contextNextEl) this.contextNextEl.classList.remove("no-motion");
        });
      }
    }
    renderBridgeState(context) {
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
    renderNormalState(context, activeIndex, preFirst) {
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
    renderState() {
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
    updateLyrics(lyricsData) {
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
            const lyricLineElement = document.createElement("div");
            lyricLineElement.className = "lyric-line no-motion";
            lyricLineElement.textContent = lineObj.text;
            container.insertBefore(lyricLineElement, insertBeforeNode);
            this.uiLines.push({
              time: lineObj.timeStart,
              text: lineObj.text,
              element: lyricLineElement
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
    syncProgress(timeSeconds) {
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
    clear() {
      this.uiLines = [];
      this.currentTimeSeconds = 0;
      this.interTrackBridgeActive = false;
      this.bridgeSourceIndex = -1;
      this.bridgeEntrancePending = false;
      this.contextLines.previousTrackLine = "";
      this.contextLines.upcomingTrackLine = "";
      this.latestLyricsData = null;
      this.renderedLyricsData = null;
      const container = this.getContainer();
      if (container) container.innerHTML = "";
      this.contextPrevEl = null;
      this.contextNextEl = null;
    }
    getLyricsWidgetElement() {
      return document.getElementById("lyrics-widget");
    }
    show() {
      const element = this.getLyricsWidgetElement();
      if (!element) return;
      element.style.display = "block";
      void element.offsetWidth;
      element.classList.add("visible");
      if (this.latestLyricsData && this.renderedLyricsData !== this.latestLyricsData) {
        this.updateLyrics(this.latestLyricsData);
        this.renderedLyricsData = this.latestLyricsData;
      }
    }
    updateData(lyricData) {
      this.setLyricsDataForCurrentTrack(lyricData.readyForDisplay ? lyricData.trackLyrics : null);
      const element = this.getLyricsWidgetElement();
      const isVisible = !!(element && element.classList.contains("visible"));
      if (isVisible && this.latestLyricsData && this.renderedLyricsData !== this.latestLyricsData) {
        this.updateLyrics(this.latestLyricsData);
        this.renderedLyricsData = this.latestLyricsData;
      }
    }
    updateProgress(progressSeconds) {
      this.syncProgress(progressSeconds);
    }
    hide() {
      const element = this.getLyricsWidgetElement();
      if (!element) return;
      element.classList.remove("visible");
    }
    setLyricsDataForCurrentTrack(lyricsData) {
      if (lyricsData && lyricsData.lines && lyricsData.lines.length > 0) {
        this.latestLyricsData = lyricsData;
      } else {
        this.latestLyricsData = null;
      }
    }
  };
  var LyricsWidget = new LyricsWidget_t();
})();
