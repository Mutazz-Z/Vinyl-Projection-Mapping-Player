"use strict";
(() => {
  // widgets/tracklist/tracklist_app.ts
  var TracklistWidget_t = class {
    constructor() {
      this.transitionToken = 0;
      this.currentActiveIndex = 0;
      this.uiTracks = [];
      this.renderedTrackSignature = "";
      this.pendingTransitionCleanup = null;
    }
    getContainer() {
      return document.querySelector("#tracklist-widget .tracklist-container");
    }
    renderTracklist(tracks) {
      const container = document.getElementById("tracklist-arc");
      if (!container) return;
      container.innerHTML = "";
      this.currentActiveIndex = 0;
      this.uiTracks = [];
      for (const trackItem of tracks) {
        const trackName = trackItem.track || "";
        if (!trackName) continue;
        const trackElement = document.createElement("div");
        trackElement.className = "track-item";
        trackElement.textContent = trackName;
        container.appendChild(trackElement);
        this.uiTracks.push({ name: trackName, element: trackElement });
      }
      this.renderedTrackSignature = tracks.map((t) => `${t.trackIndex}:${t.track}`).join("|");
    }
    setLinearLayout() {
      if (this.uiTracks.length === 0) return;
      const anchorIndex = this.currentActiveIndex || 0;
      const yStep = 58;
      this.uiTracks.forEach((track, index) => {
        const trackElement = track.element;
        if (!trackElement) return;
        const offset = index - anchorIndex;
        const y = offset * yStep;
        trackElement.classList.toggle("active", offset === 0);
        let opacity = 0;
        if (Math.abs(offset) === 0) opacity = 1;
        else if (Math.abs(offset) === 1) opacity = 0.45;
        else if (Math.abs(offset) === 2) opacity = 0.1;
        trackElement.style.opacity = String(opacity);
        trackElement.style.transform = `translate(0px, calc(${y}px - 50%)) scale(${offset === 0 ? 1.12 : 1})`;
      });
    }
    updateArcCarousel(activeIndex) {
      if (this.uiTracks.length === 0) return;
      const container = this.getContainer();
      if (container && !container.classList.contains("carousel")) {
        const newIndex = Number(activeIndex);
        if (!Number.isNaN(newIndex)) this.currentActiveIndex = newIndex;
        this.setLinearLayout();
        return;
      }
      const safeIndex = Number(activeIndex);
      if (!Number.isNaN(safeIndex)) this.currentActiveIndex = safeIndex;
      const TEXT_GAP = 40;
      const ARC_RADIUS = 250;
      const ANGLE_STEP = 0.35;
      this.uiTracks.forEach((track, index) => {
        const trackElement = track.element;
        if (!trackElement) return;
        const offset = index - this.currentActiveIndex;
        if (Math.abs(offset) > 2) {
          trackElement.style.opacity = "0";
          const yDir = offset > 0 ? 300 : -300;
          trackElement.style.transform = `translate(${TEXT_GAP}px, ${yDir}px) scale(0.5)`;
          trackElement.classList.remove("active");
          return;
        }
        const angle = offset * ANGLE_STEP;
        const x = Math.cos(angle) * ARC_RADIUS - ARC_RADIUS + TEXT_GAP;
        const y = Math.sin(angle) * ARC_RADIUS;
        const scale = offset === 0 ? 1.3 : 1 - Math.abs(offset) * 0.15;
        const opacity = offset === 0 ? 1 : 0.6 - Math.abs(offset) * 0.25;
        trackElement.classList.toggle("active", offset === 0);
        trackElement.style.opacity = String(opacity);
        trackElement.style.transform = `translate(${x}px, calc(${y}px - 50%)) scale(${scale})`;
      });
    }
    cancelPendingTransitions() {
      if (this.pendingTransitionCleanup) {
        this.pendingTransitionCleanup();
        this.pendingTransitionCleanup = null;
      }
    }
    clear() {
      const container = document.getElementById("tracklist-arc");
      if (container) container.innerHTML = "";
      this.uiTracks = [];
      this.renderedTrackSignature = "";
      this.cancelPendingTransitions();
    }
    show() {
      ++this.transitionToken;
      this.cancelPendingTransitions();
      const container = this.getContainer();
      if (!container) return;
      container.classList.remove("hiding");
      container.classList.add("visible");
      container.classList.add("carousel");
      this.updateArcCarousel(this.currentActiveIndex);
    }
    hide() {
      const guardToken = ++this.transitionToken;
      this.cancelPendingTransitions();
      const container = this.getContainer();
      if (!container) {
        this.clear();
        TrackResolver.clear();
        return;
      }
      container.classList.remove("carousel");
      container.classList.add("visible");
      this.setLinearLayout();
      const onTransitionEnd = (event) => {
        const transitionEvent = event;
        if (transitionEvent.target !== container) return;
        if (transitionEvent.propertyName !== "opacity") return;
        if (guardToken !== this.transitionToken) return;
        container.classList.remove("hiding");
        container.removeEventListener("transitionend", onTransitionEnd);
        if (this.pendingTransitionCleanup === cleanup) {
          this.pendingTransitionCleanup = null;
        }
        this.clear();
        TrackResolver.clear();
      };
      const cleanup = () => {
        container.removeEventListener("transitionend", onTransitionEnd);
        container.classList.remove("hiding");
      };
      this.pendingTransitionCleanup = cleanup;
      container.addEventListener("transitionend", onTransitionEnd);
      container.classList.remove("carousel");
      container.classList.add("visible");
      void container.offsetHeight;
      requestAnimationFrame(() => {
        container.classList.add("hiding");
        container.classList.remove("visible");
        container.classList.remove("carousel");
      });
    }
    updateData(data) {
      const tracks = data.tracks || [];
      if (tracks.length === 0) return;
      this.cancelPendingTransitions();
      const nextSignature = tracks.map((t) => `${t.trackIndex}:${t.track}`).join("|");
      if (nextSignature !== this.renderedTrackSignature) {
        this.renderTracklist(tracks);
      }
      TrackResolver.setTrackNames(tracks.map((t) => t.track));
      const incomingIndex = Number(data.currentPlayingIndex ?? 0);
      const safeIndex = Number.isNaN(incomingIndex) ? 0 : Math.floor(incomingIndex);
      this.currentActiveIndex = Math.max(0, Math.min(tracks.length - 1, safeIndex));
      this.updateArcCarousel(this.currentActiveIndex);
    }
  };
  var TracklistWidget = new TracklistWidget_t();
})();
