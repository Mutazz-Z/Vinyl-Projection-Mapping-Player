"use strict";
(() => {
  // widgets/overlay/overlay_app.ts
  var OverlayWidget_t = class {
    constructor() {
      this._private = {
        statusTimer: null
      };
    }
    getOverlayContainer() {
      return document.getElementById("fx-video-container");
    }
    setActive(active) {
      const overlayContainer = this.getOverlayContainer();
      overlayContainer.classList.toggle("active", Boolean(active));
    }
    setOverlayArt(url) {
      const overlayContainer = this.getOverlayContainer();
      if (url) {
        const safeOverlayUrl = String(url).replace(/"/g, '\\"');
        overlayContainer.style.backgroundImage = 'url("' + safeOverlayUrl + '")';
        overlayContainer.style.backgroundSize = "cover";
        overlayContainer.style.backgroundPosition = "center center";
        overlayContainer.style.backgroundRepeat = "no-repeat";
      } else {
        overlayContainer.style.backgroundImage = "none";
      }
    }
    showStatusIcon(type) {
      const iconElement = document.getElementById("status-icon-overlay");
      const overlayContainer = this.getOverlayContainer();
      if (overlayContainer) {
        overlayContainer.classList.toggle("paused", type === "pause");
      }
      if (this._private.statusTimer) {
        clearTimeout(this._private.statusTimer);
        this._private.statusTimer = null;
      }
      let imgPath = "";
      if (type === "play") imgPath = "widgets/assets/play_overlay.png";
      else if (type === "pause") imgPath = "widgets/assets/pause_overlay.png";
      if (!imgPath) {
        iconElement.classList.remove("visible");
        return;
      }
      iconElement.style.backgroundImage = 'url("' + imgPath + '")';
      void iconElement.offsetWidth;
      iconElement.classList.add("visible");
      if (type !== "pause") {
        this._private.statusTimer = setTimeout(function() {
          iconElement.classList.remove("visible");
        }, 2e3);
      }
    }
    updateData(overlayData) {
      this.setOverlayArt(overlayData.overlayImage);
    }
    show() {
      this.setActive(true);
    }
    hide() {
      this.setActive(false);
    }
    play() {
      this.show();
      this.showStatusIcon("play");
    }
    pause() {
      this.show();
      this.showStatusIcon("pause");
    }
  };
  var OverlayWidget = new OverlayWidget_t();
})();
