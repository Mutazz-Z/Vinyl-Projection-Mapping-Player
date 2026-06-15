import { TrackLyrics_t, AlbumTrackList_t } from "../types/state";

type TrackResolverApi = {
    buildLyricsLookupFromTrackList: (trackList: AlbumTrackList_t[]) => void;
    getTrackNames: () => string[];
    setActiveTrackIndex: (index: number) => void;
    getLyricsByTrackIndex: (trackIndex: number) => TrackLyrics_t | null;
    setTrackNames: (names: string[]) => void;
    clear: () => void;
    clearTrackPositionOnly: () => void;
};

export class TrackResolver_t implements TrackResolverApi {
    private trackNames: string[] = [];
    private activeTrackIndex = 0;
    private lyricsByNormalizedTrackName: Record<string, TrackLyrics_t> = {};

    private normalizeTrackName(trackName: string): string {
        return trackName.trim().toLowerCase();
    }

    private clampTrackIndex(trackIndex: number): number {
        if (this.trackNames.length === 0) return 0;

        const numericTrackIndex = Number(trackIndex);
        if (Number.isNaN(numericTrackIndex)) return this.activeTrackIndex;
        if (numericTrackIndex < 0) return 0;
        if (numericTrackIndex >= this.trackNames.length) return this.trackNames.length - 1;
        return Math.floor(numericTrackIndex);
    }

    public buildLyricsLookupFromTrackList(trackList: AlbumTrackList_t[]): void {
        this.lyricsByNormalizedTrackName = {};

        trackList.forEach((trackListEntry) => {
            this.lyricsByNormalizedTrackName[this.normalizeTrackName(trackListEntry.track)] = trackListEntry.lyrics;
        });
    }

    public getLyricsByTrackIndex(trackIndex: number): TrackLyrics_t | null {
        if (this.trackNames.length === 0) return null;

        const resolvedTrackName = this.trackNames[this.clampTrackIndex(trackIndex)];
        return this.lyricsByNormalizedTrackName[this.normalizeTrackName(resolvedTrackName)] || null;
    }

    public setTrackNames(trackNames: string[]): void {
        this.trackNames = trackNames;
    }

    public setActiveTrackIndex(trackIndex: number): void {
        this.activeTrackIndex = this.clampTrackIndex(trackIndex);
    }

    public getTrackNames(): string[] {
        return this.trackNames;
    }

    public clear(): void {
        this.trackNames = [];
        this.activeTrackIndex = 0;
        this.lyricsByNormalizedTrackName = {};
    }

    public clearTrackPositionOnly(): void {
        this.activeTrackIndex = 0;
    }
}

export const TrackResolver = new TrackResolver_t();
