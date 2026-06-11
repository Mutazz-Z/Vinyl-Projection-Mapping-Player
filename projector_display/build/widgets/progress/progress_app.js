"use strict";
(() => {
  // widgets/progress/progress_app.ts
  (function() {
    function getContainer() {
      return document.querySelector("#progress-widget .progress-container");
    }
    function show(options) {
      const config = options && typeof options === "object" ? options : {};
      const containerElement = getContainer();
      if (config.visible !== false && containerElement) {
        containerElement.classList.add("visible");
      }
      if (config.reset === true) {
        reset();
      }
      renderFromValues(lastProgressSeconds, lastDurationSeconds);
    }
    function hide(options) {
      const config = options && typeof options === "object" ? options : {};
      const containerElement = getContainer();
      if (config.visible !== false && containerElement) {
        containerElement.classList.remove("visible");
      }
      if (config.reset === true) {
        reset();
      }
    }
    function formatTimeInMinutesAndSeconds(seconds) {
      if (isNaN(seconds)) return "0:00";
      const minutes = Math.floor(seconds / 60);
      const secondsPart = Math.floor(seconds % 60).toString().padStart(2, "0");
      return minutes + ":" + secondsPart;
    }
    function reset() {
      lastProgressSeconds = 0;
      lastDurationSeconds = 0;
      renderFromValues(0, 0);
    }
    function renderFromValues(progressSeconds, durationSeconds) {
      const boundedDuration = Number(durationSeconds || 0);
      const boundedProgress = Number(progressSeconds || 0);
      if (!durationSeconds || durationSeconds <= 0) return;
      const progressPercentage = boundedProgress / boundedDuration * 100;
      const progressBarElement = document.getElementById("progress-bar");
      if (progressBarElement) progressBarElement.style.width = progressPercentage + "%";
      const currentTimeElement = document.getElementById("current-time");
      const totalTimeElement = document.getElementById("total-time");
      if (currentTimeElement) currentTimeElement.textContent = formatTimeInMinutesAndSeconds(boundedProgress);
      if (totalTimeElement) totalTimeElement.textContent = formatTimeInMinutesAndSeconds(boundedDuration);
    }
    let lastProgressSeconds = 0;
    let lastDurationSeconds = 0;
    function updateData(progressData) {
      if (!progressData || typeof progressData !== "object") return;
      lastProgressSeconds = Number(progressData.currentDurationInTrack || 0);
      lastDurationSeconds = Number(progressData.totalDurationInTrack || 0);
      renderFromValues(lastProgressSeconds, lastDurationSeconds);
    }
    window.ProgressWidget = {
      show,
      hide,
      updateData
    };
  })();
})();
