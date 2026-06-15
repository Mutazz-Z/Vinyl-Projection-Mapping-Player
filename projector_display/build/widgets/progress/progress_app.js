"use strict";
(() => {
  // widgets/progress/progress_app.ts
  var ProgressWidget_t = class {
    constructor() {
      this._private = {
        lastProgressSeconds: 0,
        lastDurationSeconds: 0
      };
    }
    getContainer() {
      return document.querySelector("#progress-widget .progress-container");
    }
    show() {
      const containerElement = this.getContainer();
      containerElement.classList.add("visible");
      this.renderFromValues(this._private.lastProgressSeconds, this._private.lastDurationSeconds);
    }
    hide() {
      const containerElement = this.getContainer();
      containerElement.classList.remove("visible");
      this.reset();
    }
    formatTimeInMinutesAndSeconds(seconds) {
      if (isNaN(seconds)) return "0:00";
      const minutes = Math.floor(seconds / 60);
      const secondsPart = Math.floor(seconds % 60).toString().padStart(2, "0");
      return minutes + ":" + secondsPart;
    }
    reset() {
      this._private.lastProgressSeconds = 0;
      this._private.lastDurationSeconds = 0;
      this.renderFromValues(0, 0);
    }
    renderFromValues(progressSeconds, durationSeconds) {
      const boundedDuration = Number(durationSeconds || 0);
      const boundedProgress = Number(progressSeconds || 0);
      if (!durationSeconds || durationSeconds <= 0) return;
      const progressPercentage = boundedProgress / boundedDuration * 100;
      const progressBarElement = document.getElementById("progress-bar");
      if (progressBarElement) progressBarElement.style.width = progressPercentage + "%";
      const currentTimeElement = document.getElementById("current-time");
      const totalTimeElement = document.getElementById("total-time");
      if (currentTimeElement) currentTimeElement.textContent = this.formatTimeInMinutesAndSeconds(boundedProgress);
      if (totalTimeElement) totalTimeElement.textContent = this.formatTimeInMinutesAndSeconds(boundedDuration);
    }
    updateData(progressData) {
      this._private.lastProgressSeconds = Number(progressData.currentDurationInTrack || 0);
      this._private.lastDurationSeconds = Number(progressData.totalDurationInTrack || 0);
      this.renderFromValues(this._private.lastProgressSeconds, this._private.lastDurationSeconds);
    }
  };
  var ProgressWidget = new ProgressWidget_t();
})();
