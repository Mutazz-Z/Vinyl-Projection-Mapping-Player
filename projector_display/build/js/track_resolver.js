"use strict";
(() => {
  // js/track_resolver.ts
  var TrackResolver_t = class {
    constructor() {
      this.trackNames = [];
      this.activeTrackIndex = 0;
      this.lyricsByNormalizedTrackName = {};
    }
    normalizeTrackName(trackName) {
      return trackName.trim().toLowerCase();
    }
    clampTrackIndex(trackIndex) {
      if (this.trackNames.length === 0) return 0;
      const numericTrackIndex = Number(trackIndex);
      if (Number.isNaN(numericTrackIndex)) return this.activeTrackIndex;
      if (numericTrackIndex < 0) return 0;
      if (numericTrackIndex >= this.trackNames.length) return this.trackNames.length - 1;
      return Math.floor(numericTrackIndex);
    }
    buildLyricsLookupFromTrackList(trackList) {
      this.lyricsByNormalizedTrackName = {};
      trackList.forEach((trackListEntry) => {
        this.lyricsByNormalizedTrackName[this.normalizeTrackName(trackListEntry.track)] = trackListEntry.lyrics;
      });
    }
    getLyricsByTrackIndex(trackIndex) {
      if (this.trackNames.length === 0) return null;
      const resolvedTrackName = this.trackNames[this.clampTrackIndex(trackIndex)];
      return this.lyricsByNormalizedTrackName[this.normalizeTrackName(resolvedTrackName)] || null;
    }
    setTrackNames(trackNames) {
      this.trackNames = trackNames;
    }
    setActiveTrackIndex(trackIndex) {
      this.activeTrackIndex = this.clampTrackIndex(trackIndex);
    }
    getTrackNames() {
      return this.trackNames;
    }
    clear() {
      this.trackNames = [];
      this.activeTrackIndex = 0;
      this.lyricsByNormalizedTrackName = {};
    }
    clearTrackPositionOnly() {
      this.activeTrackIndex = 0;
    }
  };
  var TrackResolver = new TrackResolver_t();
})();
