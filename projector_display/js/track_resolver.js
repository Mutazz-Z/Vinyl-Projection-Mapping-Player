(function () {
    let currentTrackNames = [];
    let currentActiveTrackIndex = 0;
    let lyricsByNormalisedTrackName = {};

    function normaliseTrackName(name) {
        return typeof name === 'string' ? name.trim().toLowerCase() : '';
    }

    function clampToValidTrackIndex(index) {
        if (!currentTrackNames || currentTrackNames.length === 0) return 0;
        const numeric = Number(index);
        if (isNaN(numeric)) return currentActiveTrackIndex;
        if (numeric < 0) return 0;
        if (numeric >= currentTrackNames.length) return currentTrackNames.length - 1;
        return Math.floor(numeric);
    }

    function findTrackIndexByExactName(normalisedName) {
        for (let i = 0; i < currentTrackNames.length; i++) {
            if (normaliseTrackName(currentTrackNames[i]) === normalisedName) return i;
        }
        return undefined;
    }

    function findTrackIndexByPartialName(normalisedName) {
        for (let i = 0; i < currentTrackNames.length; i++) {
            const candidate = normaliseTrackName(currentTrackNames[i]);
            if (!candidate) continue;
            if (candidate.indexOf(normalisedName) !== -1 || normalisedName.indexOf(candidate) !== -1) return i;
        }
        return undefined;
    }

    function resolveTrackIndexFromPayload(payload) {
        if (!payload) return undefined;

        const rawIndex = payload.track_idx !== undefined ? payload.track_idx : payload.track_index;
        if (rawIndex !== undefined && rawIndex !== null && !isNaN(Number(rawIndex))) {
            const numericIndex = Number(rawIndex);
            if (numericIndex >= 0) return numericIndex;
        }

        const normalisedPayloadTrackName = normaliseTrackName(payload.track_name);
        if (!normalisedPayloadTrackName || !currentTrackNames || !currentTrackNames.length) {
            return undefined;
        }

        return findTrackIndexByExactName(normalisedPayloadTrackName)
            ?? findTrackIndexByPartialName(normalisedPayloadTrackName);
    }

    function resolveTrackIndexFromSkipEvent(payload) {
        if (!payload || !payload.event) return undefined;
        const eventName = String(payload.event).toLowerCase();
        if (!currentTrackNames || currentTrackNames.length === 0) return undefined;

        if (eventName === 'skip_forward' || eventName === 'track_changed') {
            return clampToValidTrackIndex(currentActiveTrackIndex + 1);
        }
        if (eventName === 'skip_backward') {
            return clampToValidTrackIndex(currentActiveTrackIndex - 1);
        }
        return undefined;
    }

    function resolveTrackIndex(payload) {
        return resolveTrackIndexFromPayload(payload) ?? resolveTrackIndexFromSkipEvent(payload);
    }

    function isIncomingTrackDifferentFromCurrent(payload, resolvedIncomingIndex) {
        if (!payload) return false;

        if (resolvedIncomingIndex !== undefined && resolvedIncomingIndex !== currentActiveTrackIndex) {
            return true;
        }

        if (payload.track_name && currentTrackNames && currentTrackNames.length > 0) {
            const currentName = currentTrackNames[currentActiveTrackIndex] || '';
            return normaliseTrackName(payload.track_name) !== normaliseTrackName(currentName);
        }

        return false;
    }

    function parseTrackNamesFromTrackList(trackList) {
        if (!Array.isArray(trackList)) return [];
        return trackList.map(entry => entry.track || '').filter(Boolean);
    }

    function buildLyricsLookupFromTrackList(trackList) {
        lyricsByNormalisedTrackName = {};
        if (!Array.isArray(trackList)) return;

        trackList.forEach(function (entry) {
            const key = normaliseTrackName(entry && entry.track);
            if (!key) return;

            const lyrics = entry && entry.lyrics;
            if (!lyrics || !Array.isArray(lyrics.lines) || lyrics.lines.length === 0) return;

            lyricsByNormalisedTrackName[key] = lyrics;
        });
    }

    function getLyricsByTrackName(trackName) {
        const key = normaliseTrackName(trackName);
        if (!key) return null;

        const lyrics = lyricsByNormalisedTrackName[key];
        if (!lyrics || !Array.isArray(lyrics.lines) || lyrics.lines.length === 0) return null;
        return lyrics;
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
        currentTrackNames = Array.isArray(names) ? names : [];
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
        currentTrackNames = [];
        currentActiveTrackIndex = 0;
    }

    window.TrackResolver = {
        resolveTrackIndex,
        resolveTrackIndexFromPayload,
        isIncomingTrackDifferentFromCurrent,
        parseTrackNamesFromTrackList,
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