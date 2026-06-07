(function () {
    let currentTrackNames: string[] = [];
    let currentActiveTrackIndex = 0;
    let lyricsByNormalisedTrackName: Record<string, TrackLyrics_t> = {};

    function normaliseTrackName(name: string): string {
        return name.trim().toLowerCase();
    }

    function clampToValidTrackIndex(index: number): number {
        if (!currentTrackNames || currentTrackNames.length === 0) return 0;
        const numeric = Number(index);
        if (isNaN(numeric)) return currentActiveTrackIndex;
        if (numeric < 0) return 0;
        if (numeric >= currentTrackNames.length) return currentTrackNames.length - 1;
        return Math.floor(numeric);
    }

    function buildLyricsLookupFromTrackList(trackList: AlbumTrackList_t[]): void {
        lyricsByNormalisedTrackName = {};

        trackList.forEach(function (entry) {
            lyricsByNormalisedTrackName[normaliseTrackName(entry.track)] = entry.lyrics;
        });
    }

    function getLyricsByTrackIndex(trackIndex: number): TrackLyrics_t | null {
        if (!currentTrackNames || currentTrackNames.length === 0) return null;
        const trackName = currentTrackNames[clampToValidTrackIndex(trackIndex)];
        return lyricsByNormalisedTrackName[normaliseTrackName(trackName)] || null;
    }

    function setTrackNames(names: string[]): void {
        currentTrackNames = names;
    }

    function setActiveTrackIndex(index: number): void {
        currentActiveTrackIndex = clampToValidTrackIndex(index);
    }

    function getTrackNames(): string[] {
        return currentTrackNames;
    }

    function clear(): void {
        currentTrackNames = [];
        currentActiveTrackIndex = 0;
        lyricsByNormalisedTrackName = {};
    }

    function clearTrackPositionOnly(): void {
        currentActiveTrackIndex = 0;
    }

    const appWindow = window as Window & typeof globalThis & {
        TrackResolver: {
            buildLyricsLookupFromTrackList: typeof buildLyricsLookupFromTrackList;
            getLyricsByTrackIndex: typeof getLyricsByTrackIndex;
            setTrackNames: typeof setTrackNames;
            setActiveTrackIndex: typeof setActiveTrackIndex;
            getTrackNames: typeof getTrackNames;
            clear: typeof clear;
            clearTrackPositionOnly: typeof clearTrackPositionOnly;
        };
    };

    appWindow.TrackResolver = {
        buildLyricsLookupFromTrackList,
        getLyricsByTrackIndex,
        setTrackNames,
        setActiveTrackIndex,
        getTrackNames,
        clear,
        clearTrackPositionOnly,
    };
})();
