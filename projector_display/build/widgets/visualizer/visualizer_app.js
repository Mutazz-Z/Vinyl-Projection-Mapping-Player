"use strict";
(() => {
  // widgets/visualizer/visualizer_app.ts
  var VisualizerWidget_t = class {
    constructor() {
      this.visualizerInterval = null;
    }
    getElement() {
      return document.getElementById("visualizer");
    }
    show() {
      this.play();
    }
    hide() {
      const el = this.getElement();
      if (!el) return;
      el.classList.remove("paused");
      el.classList.add("hidden");
      el.querySelectorAll(".bar").forEach((bar) => {
        bar.style.height = "0%";
      });
      if (this.visualizerInterval) {
        clearInterval(this.visualizerInterval);
        this.visualizerInterval = null;
      }
    }
    play() {
      const el = this.getElement();
      if (!el) return;
      el.classList.remove("paused", "hidden");
      if (this.visualizerInterval) clearInterval(this.visualizerInterval);
      const bars = el.querySelectorAll(".bar");
      this.visualizerInterval = setInterval(() => {
        bars.forEach((bar) => {
          bar.style.height = Math.random() * 80 + 20 + "%";
        });
      }, 140);
    }
    pause() {
      const el = this.getElement();
      if (!el || el.classList.contains("hidden")) return;
      el.classList.add("paused");
      el.querySelectorAll(".bar").forEach((bar) => {
        bar.style.height = "2%";
      });
      if (this.visualizerInterval) {
        clearInterval(this.visualizerInterval);
        this.visualizerInterval = null;
      }
    }
  };
  var VisualizerWidget = new VisualizerWidget_t();
})();
