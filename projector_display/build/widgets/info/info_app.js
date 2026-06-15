"use strict";
(() => {
  // widgets/info/info_app.ts
  var InfoWidget = class {
    constructor() {
      this._private = {
        pendingTransitionCleanupFunction: null,
        resizeTimerIdentifier: void 0
      };
      window.addEventListener("resize", () => {
        clearTimeout(this._private.resizeTimerIdentifier);
        this._private.resizeTimerIdentifier = setTimeout(() => this.updateLayout(), 100);
      });
    }
    getContainer() {
      return document.querySelector("#info-widget .info-container");
    }
    getTitleElement() {
      return document.getElementById("album-title");
    }
    getArtistElement() {
      return document.getElementById("artist-name");
    }
    getTitleWrapper() {
      return document.getElementById("title-wrap");
    }
    getArtistWrapper() {
      return document.getElementById("artist-wrap");
    }
    resetMarquee(element) {
      element.classList.remove("marquee");
      if (element.dataset.originalText !== void 0) {
        element.textContent = element.dataset.originalText;
        delete element.dataset.originalText;
      }
    }
    applyMarquee(element) {
      const textContent = element.textContent;
      element.dataset.originalText = textContent;
      element.innerHTML = "";
      const firstTextSpan = document.createElement("span");
      firstTextSpan.textContent = textContent;
      const spacerSpan = document.createElement("span");
      spacerSpan.className = "spacer";
      const secondTextSpan = document.createElement("span");
      secondTextSpan.textContent = textContent;
      element.appendChild(firstTextSpan);
      element.appendChild(spacerSpan);
      element.appendChild(secondTextSpan);
      element.classList.add("marquee");
    }
    updateLayout() {
      const container = this.getContainer();
      const titleElement = this.getTitleElement();
      const titleWrapper = this.getTitleWrapper();
      const artistWrapper = this.getArtistWrapper();
      container.style.setProperty("--scale", "1");
      titleWrapper.style.width = "auto";
      titleWrapper.style.flex = "none";
      artistWrapper.style.width = "auto";
      artistWrapper.style.flex = "none";
      this.resetMarquee(titleElement);
      void container.offsetHeight;
      const rawTitleWidth = titleElement.scrollWidth;
      const rawArtistWidth = artistWrapper.scrollWidth;
      const availableWidth = container.clientWidth - 8;
      if (rawTitleWidth === 0 && rawArtistWidth === 0) {
        return;
      }
      const actualGap = rawTitleWidth > 0 && rawArtistWidth > 0 ? 20 : 0;
      const totalContentWidth = rawTitleWidth + rawArtistWidth + actualGap;
      const scaleAmount = Math.max(0.8, Math.min(1.2, availableWidth / totalContentWidth));
      const scaledArtistWidth = Math.ceil(rawArtistWidth * scaleAmount);
      const scaledTitleTextWidth = Math.ceil(rawTitleWidth * scaleAmount);
      const maxTitleBoxWidth = Math.floor(availableWidth - scaledArtistWidth - actualGap);
      container.style.setProperty("--scale", String(scaleAmount));
      artistWrapper.style.width = scaledArtistWidth + "px";
      artistWrapper.style.flex = "0 0 " + scaledArtistWidth + "px";
      titleWrapper.style.width = maxTitleBoxWidth + "px";
      titleWrapper.style.flex = "0 0 " + maxTitleBoxWidth + "px";
      if (scaledTitleTextWidth > maxTitleBoxWidth + 2) {
        this.applyMarquee(titleElement);
      }
    }
    setText(album, artist) {
      const albumTitle = this.getTitleElement();
      const artistName = this.getArtistElement();
      this.resetMarquee(albumTitle);
      albumTitle.textContent = album;
      artistName.textContent = artist;
      this.updateLayout();
    }
    show() {
      const container = this.getContainer();
      if (this._private.pendingTransitionCleanupFunction) {
        this._private.pendingTransitionCleanupFunction();
        this._private.pendingTransitionCleanupFunction = null;
      }
      container.classList.remove("hiding");
      if (!container.classList.contains("visible")) {
        requestAnimationFrame(() => {
          container.classList.add("visible");
        });
      }
    }
    hide() {
      const container = this.getContainer();
      if (container.classList.contains("hiding")) {
        return;
      }
      if (this._private.pendingTransitionCleanupFunction) {
        this._private.pendingTransitionCleanupFunction();
        this._private.pendingTransitionCleanupFunction = null;
      }
      const transitionEndCallback = (event) => {
        const transitionEvent = event;
        if (transitionEvent.target !== container) {
          return;
        }
        if (transitionEvent.propertyName !== "transform") {
          return;
        }
        container.classList.remove("hiding");
        container.removeEventListener("transitionend", transitionEndCallback);
        if (this._private.pendingTransitionCleanupFunction === cleanupFunction) {
          this._private.pendingTransitionCleanupFunction = null;
        }
      };
      const cleanupFunction = () => {
        container.removeEventListener("transitionend", transitionEndCallback);
        container.classList.remove("hiding");
      };
      this._private.pendingTransitionCleanupFunction = cleanupFunction;
      container.addEventListener("transitionend", transitionEndCallback);
      container.classList.remove("hiding");
      container.classList.add("visible");
      void container.offsetHeight;
      requestAnimationFrame(() => {
        container.classList.add("hiding");
        container.classList.remove("visible");
      });
    }
    updateData(albumInfo) {
      if (!albumInfo.title && !albumInfo.artist) {
        return;
      }
      this.setText(albumInfo.title, albumInfo.artist);
    }
  };
  var infoWidget = new InfoWidget();
})();
