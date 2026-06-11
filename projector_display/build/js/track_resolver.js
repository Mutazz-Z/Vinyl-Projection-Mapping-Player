"use strict";
(() => {
  // js/track_resolver.ts
  (function() {
    let currentTrackNames = [];
    let currentActiveTrackIndex = 0;
    let lyricsByNormalisedTrackName = {};
    function normaliseTrackName(name) {
      return name.trim().toLowerCase();
    }
    function clampToValidTrackIndex(index) {
      if (!currentTrackNames || currentTrackNames.length === 0) return 0;
      const numeric = Number(index);
      if (isNaN(numeric)) return currentActiveTrackIndex;
      if (numeric < 0) return 0;
      if (numeric >= currentTrackNames.length) return currentTrackNames.length - 1;
      return Math.floor(numeric);
    }
    function buildLyricsLookupFromTrackList(trackList) {
      lyricsByNormalisedTrackName = {};
      trackList.forEach(function(entry) {
        lyricsByNormalisedTrackName[normaliseTrackName(entry.track)] = entry.lyrics;
      });
    }
    function getLyricsByTrackIndex(trackIndex) {
      if (!currentTrackNames || currentTrackNames.length === 0) return null;
      const trackName = currentTrackNames[clampToValidTrackIndex(trackIndex)];
      return lyricsByNormalisedTrackName[normaliseTrackName(trackName)] || null;
    }
    function setTrackNames(names) {
      currentTrackNames = names;
    }
    function setActiveTrackIndex(index) {
      currentActiveTrackIndex = clampToValidTrackIndex(index);
    }
    function getTrackNames() {
      return currentTrackNames;
    }
    function clear() {
      currentTrackNames = [];
      currentActiveTrackIndex = 0;
      lyricsByNormalisedTrackName = {};
    }
    function clearTrackPositionOnly() {
      currentActiveTrackIndex = 0;
    }
    const appWindow = window;
    appWindow.TrackResolver = {
      buildLyricsLookupFromTrackList,
      getLyricsByTrackIndex,
      setTrackNames,
      setActiveTrackIndex,
      getTrackNames,
      clear,
      clearTrackPositionOnly
    };
  })();
})();
