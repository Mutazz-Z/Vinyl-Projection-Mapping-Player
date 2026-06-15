"use strict";
(() => {
  // widgets/loading/loading_app.ts
  var LOADING_SCALE = 0.33;
  var HIDE_HOLD_MILLISECONDS = 1e3;
  var LoadingWidget_t = class {
    constructor() {
      this._private = {
        loadingTransitionToken: 0,
        scheduledWaitTimer: null
      };
      this.idle();
    }
    getOutline() {
      return document.getElementById("loading-outline");
    }
    waitForTransition(element, propertyName, timeoutInMilliseconds = 700) {
      return new Promise((resolve) => {
        let isComplete = false;
        const finishTransition = () => {
          if (isComplete) return;
          isComplete = true;
          element.removeEventListener("transitionend", onTransitionEnd);
          resolve();
        };
        const onTransitionEnd = (event) => {
          if (propertyName && event.propertyName !== propertyName) return;
          finishTransition();
        };
        element.addEventListener("transitionend", onTransitionEnd);
        setTimeout(finishTransition, timeoutInMilliseconds);
      });
    }
    freezeCurrentVisualState(outline) {
      const computedStyles = window.getComputedStyle(outline);
      const currentTransform = computedStyles.transform;
      const currentOpacity = computedStyles.opacity;
      const currentBackgroundColor = computedStyles.backgroundColor;
      const currentBorderColor = computedStyles.borderColor;
      outline.style.transition = "none";
      if (currentTransform && currentTransform !== "none") {
        outline.style.transform = currentTransform;
      }
      outline.style.opacity = currentOpacity;
      outline.style.backgroundColor = currentBackgroundColor;
      outline.style.borderColor = currentBorderColor;
      void outline.offsetWidth;
      outline.style.transition = "";
    }
    clearInlineOverrides(outline) {
      outline.style.backgroundColor = "";
      outline.style.borderColor = "";
    }
    show() {
      const outline = this.getOutline();
      this.freezeCurrentVisualState(outline);
      outline.classList.remove("hidden", "pulsing", "error", "error-fill");
      void outline.offsetWidth;
      requestAnimationFrame(() => {
        outline.style.opacity = "1";
        outline.style.transform = "translate(-50%, -50%) scale(1.25)";
        this.clearInlineOverrides(outline);
      });
    }
    beginScanLoading(sequenceToken) {
      const outline = this.getOutline();
      this.freezeCurrentVisualState(outline);
      outline.classList.remove("hidden", "pulsing", "error", "error-fill");
      void outline.offsetWidth;
      requestAnimationFrame(() => {
        outline.style.opacity = "1";
        outline.style.transform = `translate(-50%, -50%) scale(${LOADING_SCALE})`;
        this.clearInlineOverrides(outline);
      });
      return this.waitForTransition(outline, "transform", 560).then(() => {
        if (sequenceToken !== this._private.loadingTransitionToken) return;
        outline.classList.add("pulsing");
      });
    }
    fadeOut(sequenceToken) {
      const outline = this.getOutline();
      this.freezeCurrentVisualState(outline);
      outline.classList.remove("pulsing", "hidden", "error", "error-fill");
      void outline.offsetWidth;
      requestAnimationFrame(() => {
        outline.style.opacity = "0";
        this.clearInlineOverrides(outline);
      });
      return this.waitForTransition(outline, "opacity", 420).then(() => {
        if (sequenceToken !== this._private.loadingTransitionToken) return;
        outline.classList.add("hidden");
      });
    }
    waitDuration(durationInMilliseconds) {
      return new Promise((resolve) => {
        this._private.scheduledWaitTimer = setTimeout(() => {
          this._private.scheduledWaitTimer = null;
          resolve();
        }, durationInMilliseconds);
      });
    }
    expandToOverlay(sequenceToken) {
      const outline = this.getOutline();
      this.freezeCurrentVisualState(outline);
      outline.classList.remove("pulsing", "hidden", "error", "error-fill");
      void outline.offsetWidth;
      requestAnimationFrame(() => {
        outline.style.opacity = "1";
        outline.style.transform = "translate(-50%, -50%) scale(1)";
        this.clearInlineOverrides(outline);
      });
      return this.waitForTransition(outline, "transform", 560).then(() => {
        if (sequenceToken !== this._private.loadingTransitionToken) return;
      });
    }
    cancelScheduledTransitions() {
      if (this._private.scheduledWaitTimer) {
        clearTimeout(this._private.scheduledWaitTimer);
        this._private.scheduledWaitTimer = null;
      }
    }
    showError(sequenceToken) {
      const outline = this.getOutline();
      this.freezeCurrentVisualState(outline);
      outline.classList.remove("pulsing", "hidden", "error", "error-fill");
      void outline.offsetWidth;
      requestAnimationFrame(() => {
        outline.style.opacity = "1";
        outline.classList.add("error-fill");
        this.clearInlineOverrides(outline);
      });
      return this.waitForTransition(outline, "transform", 420).then(() => {
        if (sequenceToken !== this._private.loadingTransitionToken) return;
      });
    }
    idle() {
      this.cancelScheduledTransitions();
      this._private.loadingTransitionToken++;
      this.show();
    }
    loading() {
      this.cancelScheduledTransitions();
      this._private.loadingTransitionToken++;
      return this.beginScanLoading(this._private.loadingTransitionToken);
    }
    hide() {
      this.cancelScheduledTransitions();
      this._private.loadingTransitionToken++;
      const sequenceToken = this._private.loadingTransitionToken;
      return this.expandToOverlay(sequenceToken).then(() => {
        if (sequenceToken !== this._private.loadingTransitionToken) return;
        return this.waitDuration(HIDE_HOLD_MILLISECONDS);
      }).then(() => {
        if (sequenceToken !== this._private.loadingTransitionToken) return;
        return this.fadeOut(sequenceToken);
      });
    }
    error() {
      this.cancelScheduledTransitions();
      this._private.loadingTransitionToken++;
      return this.showError(this._private.loadingTransitionToken);
    }
  };
  var LoadingWidget = new LoadingWidget_t();
})();
