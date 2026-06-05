(function () {
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

    function resolveTrackIndexFromPayload(payload) {
        if (payload.track_index !== undefined && payload.track_index !== null) {
            const numeric = Number(payload.track_index);
            if (!Number.isNaN(numeric)) return numeric;
        }

        if (payload.track_name !== undefined && payload.track_name !== null) {
            const incomingName = normaliseTrackName(payload.track_name);
            for (let i = 0; i < currentTrackNames.length; i++) {
                if (normaliseTrackName(currentTrackNames[i]) === incomingName) {
                    return i;
                }
            }
        }

        return undefined;
    }

    function resolveTrackIndex(payload) {
        return resolveTrackIndexFromPayload(payload);
    }

    function isIncomingTrackDifferentFromCurrent(payload, resolvedIncomingIndex) {
        if (resolvedIncomingIndex === undefined) return false;
        return resolvedIncomingIndex !== currentActiveTrackIndex;
    }

    function buildLyricsLookupFromTrackList(trackList) {
        lyricsByNormalisedTrackName = {};

        trackList.forEach(function (entry) {
            lyricsByNormalisedTrackName[normaliseTrackName(entry.track)] = entry.lyrics;
        });
    }

    function getLyricsByTrackName(trackName) {
        return lyricsByNormalisedTrackName[normaliseTrackName(trackName)] || null;
    }

    function getLyricsByTrackIndex(trackIndex) {
        if (!currentTrackNames || currentTrackNames.length === 0) return null;
        return getLyricsByTrackName(currentTrackNames[clampToValidTrackIndex(trackIndex)]);
    }

    function getFirstNonEmptyLyricLine(lyricsData) {
        if (!lyricsData || !Array.isArray(lyricsData.lines)) return '';
        for (let i = 0; i < lyricsData.lines.length; i++) {
            const line = lyricsData.lines[i];
            if (line && typeof line.text === 'string' && line.text.trim() !== '') return line.text;
        }
        return '';
    }

    function getLastNonEmptyLyricLine(lyricsData) {
        if (!lyricsData || !Array.isArray(lyricsData.lines)) return '';
        for (let i = lyricsData.lines.length - 1; i >= 0; i--) {
            const line = lyricsData.lines[i];
            if (line && typeof line.text === 'string' && line.text.trim() !== '') return line.text;
        }
        return '';
    }

    function setTrackNames(names) {
        currentTrackNames = names;
    }

    function setActiveTrackIndex(index) {
        currentActiveTrackIndex = clampToValidTrackIndex(index);
    }

    function getActiveTrackIndex() {
        return currentActiveTrackIndex;
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

    window.TrackResolver = {
        resolveTrackIndex,
        resolveTrackIndexFromPayload,
        isIncomingTrackDifferentFromCurrent,
        buildLyricsLookupFromTrackList,
        getLyricsByTrackName,
        getLyricsByTrackIndex,
        getFirstNonEmptyLyricLine,
        getLastNonEmptyLyricLine,
        clampToValidTrackIndex,
        setTrackNames,
        setActiveTrackIndex,
        getActiveTrackIndex,
        getTrackNames,
        clear,
        clearTrackPositionOnly,
    };
})();