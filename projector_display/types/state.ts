

export enum WidgetState {
    Hide = 0,
    Show = 1,
    Pause = 2,
    Resume = 3,
    Loading = 4,
    Idle = 5,
    EjectRecord = 6,
}



export enum MediaPlaybackState {
    Playing = 0,
    Paused = 1,
    Idle = 2,
    Buffering = 3,
    Unknown = 4,
    Stopped = 5,
    Error = 6,
    Offline = 7,
}



export const ShelfStatus = {
    Empty: false,
    Occupied: true,
} as const;



export const ReaderStatus = {
    Offline: false,
    Online: true,
} as const;


export class MonitoredElapsedTimeInTrack_t {
    currentDurationInTrack: number;
    totalDurationInTrack: number;

    constructor(parameters: {
        currentDurationInTrack?: number,
        totalDurationInTrack?: number,
    }) {
        this.currentDurationInTrack = parameters.currentDurationInTrack ?? 0;
        this.totalDurationInTrack = parameters.totalDurationInTrack ?? 0;
    }

    static fromJson(json: any): MonitoredElapsedTimeInTrack_t {
        if (!json || typeof json !== 'object') return new MonitoredElapsedTimeInTrack_t({});
        return new MonitoredElapsedTimeInTrack_t({
            currentDurationInTrack: Number(json['currentDurationInTrack'] ?? 0),
            totalDurationInTrack: Number(json['totalDurationInTrack'] ?? 0),
        });
    }

    toJson(): any {
        return {
            'currentDurationInTrack': this.currentDurationInTrack,
            'totalDurationInTrack': this.totalDurationInTrack,
        };
    }
}

export class LyricLine_t {
    timeStart: number;
    text: string;

    constructor(parameters: {
        timeStart?: number,
        text?: string,
    }) {
        this.timeStart = parameters.timeStart ?? 0;
        this.text = parameters.text ?? '';
    }

    static fromJson(json: any): LyricLine_t {
        if (!json || typeof json !== 'object') return new LyricLine_t({});
        return new LyricLine_t({
            timeStart: Number(json['time_start'] ?? 0),
            text: typeof json['text'] === 'string' ? json['text'] : '',
        });
    }

    toJson(): any {
        return {
            'time_start': this.timeStart,
            'text': this.text,
        };
    }
}

export class TrackLyrics_t {
    trackSupportsLyrics: boolean;
    lines: LyricLine_t[];

    constructor(parameters: {
        trackSupportsLyrics?: boolean,
        lines?: LyricLine_t[],
    }) {
        this.trackSupportsLyrics = parameters.trackSupportsLyrics ?? false;
        this.lines = parameters.lines ?? [];
    }

    static fromJson(json: any): TrackLyrics_t {
        if (!json || typeof json !== 'object') return new TrackLyrics_t({});
        return new TrackLyrics_t({
            trackSupportsLyrics: json['track_supports_lyrics'] === true,
            lines: Array.isArray(json['lines']) ? json['lines'].map((element: any) => LyricLine_t.fromJson(element)) : [],
        });
    }

    toJson(): any {
        return {
            'track_supports_lyrics': this.trackSupportsLyrics,
            'lines': this.lines.map(function(element: LyricLine_t) { return element.toJson(); }),
        };
    }
}

export class UidScanned_t {
    uid: string;
    signal: number;

    constructor(parameters: {
        uid?: string,
        signal?: number,
    }) {
        this.uid = parameters.uid ?? '';
        this.signal = parameters.signal ?? 0;
    }

    static fromJson(json: any): UidScanned_t {
        if (!json || typeof json !== 'object') return new UidScanned_t({});
        return new UidScanned_t({
            uid: typeof json['uid'] === 'string' ? json['uid'] : '',
            signal: Number(json['signal'] ?? 0),
        });
    }

    toJson(): any {
        return {
            'uid': this.uid,
            'signal': this.signal,
        };
    }
}

export class AlbumTrackList_t {
    track: string;
    duration: number;
    coverImage: string;
    lyrics: TrackLyrics_t;

    constructor(parameters: {
        track?: string,
        duration?: number,
        coverImage?: string,
        lyrics?: TrackLyrics_t,
    }) {
        this.track = parameters.track ?? '';
        this.duration = parameters.duration ?? 0;
        this.coverImage = parameters.coverImage ?? '';
        this.lyrics = parameters.lyrics ?? new TrackLyrics_t({});
    }

    static fromJson(json: any): AlbumTrackList_t {
        if (!json || typeof json !== 'object') return new AlbumTrackList_t({});
        return new AlbumTrackList_t({
            track: typeof json['track'] === 'string' ? json['track'] : '',
            duration: Number(json['duration'] ?? 0),
            coverImage: typeof json['cover_image'] === 'string' ? json['cover_image'] : '',
            lyrics: TrackLyrics_t.fromJson(json['lyrics'] ?? {}),
        });
    }

    toJson(): any {
        return {
            'track': this.track,
            'duration': this.duration,
            'cover_image': this.coverImage,
            'lyrics': this.lyrics,
        };
    }
}

export class TitleAndArtist_t {
    title: string;
    artist: string;
    readyForDisplay: boolean;

    constructor(parameters: {
        title?: string,
        artist?: string,
        readyForDisplay?: boolean,
    }) {
        this.title = parameters.title ?? '';
        this.artist = parameters.artist ?? '';
        this.readyForDisplay = parameters.readyForDisplay ?? false;
    }

    static fromJson(json: any): TitleAndArtist_t {
        if (!json || typeof json !== 'object') return new TitleAndArtist_t({});
        return new TitleAndArtist_t({
            title: typeof json['title'] === 'string' ? json['title'] : '',
            artist: typeof json['artist'] === 'string' ? json['artist'] : '',
            readyForDisplay: json['readyForDisplay'] === true,
        });
    }

    toJson(): any {
        return {
            'title': this.title,
            'artist': this.artist,
            'readyForDisplay': this.readyForDisplay,
        };
    }
}

export class TrackListItem_t {
    trackIndex: number;
    track: string;

    constructor(parameters: {
        trackIndex?: number,
        track?: string,
    }) {
        this.trackIndex = parameters.trackIndex ?? 0;
        this.track = parameters.track ?? '';
    }

    static fromJson(json: any): TrackListItem_t {
        if (!json || typeof json !== 'object') return new TrackListItem_t({});
        return new TrackListItem_t({
            trackIndex: Number(json['trackIndex'] ?? 0),
            track: typeof json['track'] === 'string' ? json['track'] : '',
        });
    }

    toJson(): any {
        return {
            'trackIndex': this.trackIndex,
            'track': this.track,
        };
    }
}

export class LyricData_t {
    trackLyrics: TrackLyrics_t;
    readyForDisplay: boolean;

    constructor(parameters: {
        trackLyrics?: TrackLyrics_t,
        readyForDisplay?: boolean,
    }) {
        this.trackLyrics = parameters.trackLyrics ?? new TrackLyrics_t({});
        this.readyForDisplay = parameters.readyForDisplay ?? false;
    }

    static fromJson(json: any): LyricData_t {
        if (!json || typeof json !== 'object') return new LyricData_t({});
        return new LyricData_t({
            trackLyrics: TrackLyrics_t.fromJson(json['track_lyrics'] ?? {}),
            readyForDisplay: json['readyForDisplay'] === true,
        });
    }

    toJson(): any {
        return {
            'track_lyrics': this.trackLyrics,
            'readyForDisplay': this.readyForDisplay,
        };
    }
}

export class LabelDesignData_t {
    usesImage: boolean;
    labelColor: string;
    labelImage: string;

    constructor(parameters: {
        usesImage?: boolean,
        labelColor?: string,
        labelImage?: string,
    }) {
        this.usesImage = parameters.usesImage ?? false;
        this.labelColor = parameters.labelColor ?? '';
        this.labelImage = parameters.labelImage ?? '';
    }

    static fromJson(json: any): LabelDesignData_t {
        if (!json || typeof json !== 'object') return new LabelDesignData_t({});
        return new LabelDesignData_t({
            usesImage: json['usesImage'] === true,
            labelColor: typeof json['labelColor'] === 'string' ? json['labelColor'] : '',
            labelImage: typeof json['labelImage'] === 'string' ? json['labelImage'] : '',
        });
    }

    toJson(): any {
        return {
            'usesImage': this.usesImage,
            'labelColor': this.labelColor,
            'labelImage': this.labelImage,
        };
    }
}

export class AvailableMediaPlayers_t {
    playerID: string;
    displayName: string;

    constructor(parameters: {
        playerID?: string,
        displayName?: string,
    }) {
        this.playerID = parameters.playerID ?? '';
        this.displayName = parameters.displayName ?? '';
    }

    static fromJson(json: any): AvailableMediaPlayers_t {
        if (!json || typeof json !== 'object') return new AvailableMediaPlayers_t({});
        return new AvailableMediaPlayers_t({
            playerID: typeof json['player_id'] === 'string' ? json['player_id'] : '',
            displayName: typeof json['display_name'] === 'string' ? json['display_name'] : '',
        });
    }

    toJson(): any {
        return {
            'player_id': this.playerID,
            'display_name': this.displayName,
        };
    }
}

export class QrCodeData_t {
    registrationUrl: string;
    readyForDisplay: boolean;

    constructor(parameters: {
        registrationUrl?: string,
        readyForDisplay?: boolean,
    }) {
        this.registrationUrl = parameters.registrationUrl ?? '';
        this.readyForDisplay = parameters.readyForDisplay ?? false;
    }

    static fromJson(json: any): QrCodeData_t {
        if (!json || typeof json !== 'object') return new QrCodeData_t({});
        return new QrCodeData_t({
            registrationUrl: typeof json['registration_url'] === 'string' ? json['registration_url'] : '',
            readyForDisplay: json['readyForDisplay'] === true,
        });
    }

    toJson(): any {
        return {
            'registration_url': this.registrationUrl,
            'readyForDisplay': this.readyForDisplay,
        };
    }
}

export class QueueList_t {
    tracks: TrackListItem_t[];
    currentPlayingIndex: number;

    constructor(parameters: {
        tracks?: TrackListItem_t[],
        currentPlayingIndex?: number,
    }) {
        this.tracks = parameters.tracks ?? [];
        this.currentPlayingIndex = parameters.currentPlayingIndex ?? 0;
    }

    static fromJson(json: any): QueueList_t {
        if (!json || typeof json !== 'object') return new QueueList_t({});
        return new QueueList_t({
            tracks: Array.isArray(json['tracks']) ? json['tracks'].map((element: any) => TrackListItem_t.fromJson(element)) : [],
            currentPlayingIndex: Number(json['currentPlayingIndex'] ?? 0),
        });
    }

    toJson(): any {
        return {
            'tracks': this.tracks.map(function(element: TrackListItem_t) { return element.toJson(); }),
            'currentPlayingIndex': this.currentPlayingIndex,
        };
    }
}

export class VinylRecordTagData_t {
    tagUid: string;
    itemId: string;
    provider: string;
    mediaTitle: string;
    artist: string;
    trackList: AlbumTrackList_t[];
    coverImage: string;
    labelColor: string;
    labelImage: string;
    outerRingColor: string;
    outerRingImage: string;
    projectionOverlay: string;

    constructor(parameters: {
        tagUid?: string,
        itemId?: string,
        provider?: string,
        mediaTitle?: string,
        artist?: string,
        trackList?: AlbumTrackList_t[],
        coverImage?: string,
        labelColor?: string,
        labelImage?: string,
        outerRingColor?: string,
        outerRingImage?: string,
        projectionOverlay?: string,
    }) {
        this.tagUid = parameters.tagUid ?? '';
        this.itemId = parameters.itemId ?? '';
        this.provider = parameters.provider ?? '';
        this.mediaTitle = parameters.mediaTitle ?? '';
        this.artist = parameters.artist ?? '';
        this.trackList = parameters.trackList ?? [];
        this.coverImage = parameters.coverImage ?? '';
        this.labelColor = parameters.labelColor ?? '';
        this.labelImage = parameters.labelImage ?? '';
        this.outerRingColor = parameters.outerRingColor ?? '';
        this.outerRingImage = parameters.outerRingImage ?? '';
        this.projectionOverlay = parameters.projectionOverlay ?? '';
    }

    static fromJson(json: any): VinylRecordTagData_t {
        if (!json || typeof json !== 'object') return new VinylRecordTagData_t({});
        return new VinylRecordTagData_t({
            tagUid: typeof json['tag_uid'] === 'string' ? json['tag_uid'] : '',
            itemId: typeof json['item_id'] === 'string' ? json['item_id'] : '',
            provider: typeof json['provider'] === 'string' ? json['provider'] : '',
            mediaTitle: typeof json['media_title'] === 'string' ? json['media_title'] : '',
            artist: typeof json['artist'] === 'string' ? json['artist'] : '',
            trackList: Array.isArray(json['track_list']) ? json['track_list'].map((element: any) => AlbumTrackList_t.fromJson(element)) : [],
            coverImage: typeof json['cover_image'] === 'string' ? json['cover_image'] : '',
            labelColor: typeof json['label_color'] === 'string' ? json['label_color'] : '',
            labelImage: typeof json['label_image'] === 'string' ? json['label_image'] : '',
            outerRingColor: typeof json['outer_ring_color'] === 'string' ? json['outer_ring_color'] : '',
            outerRingImage: typeof json['outer_ring_image'] === 'string' ? json['outer_ring_image'] : '',
            projectionOverlay: typeof json['projection_overlay'] === 'string' ? json['projection_overlay'] : '',
        });
    }

    toJson(): any {
        return {
            'tag_uid': this.tagUid,
            'item_id': this.itemId,
            'provider': this.provider,
            'media_title': this.mediaTitle,
            'artist': this.artist,
            'track_list': this.trackList.map(function(element: AlbumTrackList_t) { return element.toJson(); }),
            'cover_image': this.coverImage,
            'label_color': this.labelColor,
            'label_image': this.labelImage,
            'outer_ring_color': this.outerRingColor,
            'outer_ring_image': this.outerRingImage,
            'projection_overlay': this.projectionOverlay,
        };
    }
}

export class MonitoredQueueList_t {
    tracks: TrackListItem_t[];
    currentPlayingIndex: number;

    constructor(parameters: {
        tracks?: TrackListItem_t[],
        currentPlayingIndex?: number,
    }) {
        this.tracks = parameters.tracks ?? [];
        this.currentPlayingIndex = parameters.currentPlayingIndex ?? 0;
    }

    static fromJson(json: any): MonitoredQueueList_t {
        if (!json || typeof json !== 'object') return new MonitoredQueueList_t({});
        return new MonitoredQueueList_t({
            tracks: Array.isArray(json['tracks']) ? json['tracks'].map((element: any) => TrackListItem_t.fromJson(element)) : [],
            currentPlayingIndex: Number(json['currentPlayingIndex'] ?? 0),
        });
    }

    toJson(): any {
        return {
            'tracks': this.tracks.map(function(element: TrackListItem_t) { return element.toJson(); }),
            'currentPlayingIndex': this.currentPlayingIndex,
        };
    }
}

export class TrackListWidgetData_t {
    tracks: TrackListItem_t[];
    currentPlayingIndex: number;
    readyForDisplay: boolean;

    constructor(parameters: {
        tracks?: TrackListItem_t[],
        currentPlayingIndex?: number,
        readyForDisplay?: boolean,
    }) {
        this.tracks = parameters.tracks ?? [];
        this.currentPlayingIndex = parameters.currentPlayingIndex ?? 0;
        this.readyForDisplay = parameters.readyForDisplay ?? false;
    }

    static fromJson(json: any): TrackListWidgetData_t {
        if (!json || typeof json !== 'object') return new TrackListWidgetData_t({});
        return new TrackListWidgetData_t({
            tracks: Array.isArray(json['tracks']) ? json['tracks'].map((element: any) => TrackListItem_t.fromJson(element)) : [],
            currentPlayingIndex: Number(json['currentPlayingIndex'] ?? 0),
            readyForDisplay: json['readyForDisplay'] === true,
        });
    }

    toJson(): any {
        return {
            'tracks': this.tracks.map(function(element: TrackListItem_t) { return element.toJson(); }),
            'currentPlayingIndex': this.currentPlayingIndex,
            'readyForDisplay': this.readyForDisplay,
        };
    }
}

export class ProgressData_t {
    currentDurationInTrack: number;
    totalDurationInTrack: number;
    readyForDisplay: boolean;

    constructor(parameters: {
        currentDurationInTrack?: number,
        totalDurationInTrack?: number,
        readyForDisplay?: boolean,
    }) {
        this.currentDurationInTrack = parameters.currentDurationInTrack ?? 0;
        this.totalDurationInTrack = parameters.totalDurationInTrack ?? 0;
        this.readyForDisplay = parameters.readyForDisplay ?? false;
    }

    static fromJson(json: any): ProgressData_t {
        if (!json || typeof json !== 'object') return new ProgressData_t({});
        return new ProgressData_t({
            currentDurationInTrack: Number(json['currentDurationInTrack'] ?? 0),
            totalDurationInTrack: Number(json['totalDurationInTrack'] ?? 0),
            readyForDisplay: json['readyForDisplay'] === true,
        });
    }

    toJson(): any {
        return {
            'currentDurationInTrack': this.currentDurationInTrack,
            'totalDurationInTrack': this.totalDurationInTrack,
            'readyForDisplay': this.readyForDisplay,
        };
    }
}

export class RecordDesignData_t {
    labelDesign: LabelDesignData_t;
    ringDesign: RingDesignData_t;
    readyForDisplay: boolean;

    constructor(parameters: {
        labelDesign?: LabelDesignData_t,
        ringDesign?: RingDesignData_t,
        readyForDisplay?: boolean,
    }) {
        this.labelDesign = parameters.labelDesign ?? new LabelDesignData_t({});
        this.ringDesign = parameters.ringDesign ?? new RingDesignData_t({});
        this.readyForDisplay = parameters.readyForDisplay ?? false;
    }

    static fromJson(json: any): RecordDesignData_t {
        if (!json || typeof json !== 'object') return new RecordDesignData_t({});
        return new RecordDesignData_t({
            labelDesign: LabelDesignData_t.fromJson(json['labelDesign'] ?? {}),
            ringDesign: RingDesignData_t.fromJson(json['ringDesign'] ?? {}),
            readyForDisplay: json['readyForDisplay'] === true,
        });
    }

    toJson(): any {
        return {
            'labelDesign': this.labelDesign,
            'ringDesign': this.ringDesign,
            'readyForDisplay': this.readyForDisplay,
        };
    }
}

export class RingDesignData_t {
    usesImage: boolean;
    ringColor: string;
    ringImage: string;

    constructor(parameters: {
        usesImage?: boolean,
        ringColor?: string,
        ringImage?: string,
    }) {
        this.usesImage = parameters.usesImage ?? false;
        this.ringColor = parameters.ringColor ?? '';
        this.ringImage = parameters.ringImage ?? '';
    }

    static fromJson(json: any): RingDesignData_t {
        if (!json || typeof json !== 'object') return new RingDesignData_t({});
        return new RingDesignData_t({
            usesImage: json['usesImage'] === true,
            ringColor: typeof json['ringColor'] === 'string' ? json['ringColor'] : '',
            ringImage: typeof json['ringImage'] === 'string' ? json['ringImage'] : '',
        });
    }

    toJson(): any {
        return {
            'usesImage': this.usesImage,
            'ringColor': this.ringColor,
            'ringImage': this.ringImage,
        };
    }
}

export class OverlayData_t {
    overlayImage: string;
    readyForDisplay: boolean;

    constructor(parameters: {
        overlayImage?: string,
        readyForDisplay?: boolean,
    }) {
        this.overlayImage = parameters.overlayImage ?? '';
        this.readyForDisplay = parameters.readyForDisplay ?? false;
    }

    static fromJson(json: any): OverlayData_t {
        if (!json || typeof json !== 'object') return new OverlayData_t({});
        return new OverlayData_t({
            overlayImage: typeof json['overlayImage'] === 'string' ? json['overlayImage'] : '',
            readyForDisplay: json['readyForDisplay'] === true,
        });
    }

    toJson(): any {
        return {
            'overlayImage': this.overlayImage,
            'readyForDisplay': this.readyForDisplay,
        };
    }
}

export class ActiveTrack_t {
    trackName: string;
    trackIndex: number;
    provider: string;
    trackItemId: string;
    albumItemId: string;

    constructor(parameters: {
        trackName?: string,
        trackIndex?: number,
        provider?: string,
        trackItemId?: string,
        albumItemId?: string,
    }) {
        this.trackName = parameters.trackName ?? '';
        this.trackIndex = parameters.trackIndex ?? 0;
        this.provider = parameters.provider ?? '';
        this.trackItemId = parameters.trackItemId ?? '';
        this.albumItemId = parameters.albumItemId ?? '';
    }

    static fromJson(json: any): ActiveTrack_t {
        if (!json || typeof json !== 'object') return new ActiveTrack_t({});
        return new ActiveTrack_t({
            trackName: typeof json['track_name'] === 'string' ? json['track_name'] : '',
            trackIndex: Number(json['track_index'] ?? 0),
            provider: typeof json['provider'] === 'string' ? json['provider'] : '',
            trackItemId: typeof json['track_item_id'] === 'string' ? json['track_item_id'] : '',
            albumItemId: typeof json['album_item_id'] === 'string' ? json['album_item_id'] : '',
        });
    }

    toJson(): any {
        return {
            'track_name': this.trackName,
            'track_index': this.trackIndex,
            'provider': this.provider,
            'track_item_id': this.trackItemId,
            'album_item_id': this.albumItemId,
        };
    }
}

export class AlbumsInLibrary_t {
    itemId: string;
    provider: string;
    mediaTitle: string;
    artist: string;
    coverImage: string;

    constructor(parameters: {
        itemId?: string,
        provider?: string,
        mediaTitle?: string,
        artist?: string,
        coverImage?: string,
    }) {
        this.itemId = parameters.itemId ?? '';
        this.provider = parameters.provider ?? '';
        this.mediaTitle = parameters.mediaTitle ?? '';
        this.artist = parameters.artist ?? '';
        this.coverImage = parameters.coverImage ?? '';
    }

    static fromJson(json: any): AlbumsInLibrary_t {
        if (!json || typeof json !== 'object') return new AlbumsInLibrary_t({});
        return new AlbumsInLibrary_t({
            itemId: typeof json['item_id'] === 'string' ? json['item_id'] : '',
            provider: typeof json['provider'] === 'string' ? json['provider'] : '',
            mediaTitle: typeof json['media_title'] === 'string' ? json['media_title'] : '',
            artist: typeof json['artist'] === 'string' ? json['artist'] : '',
            coverImage: typeof json['cover_image'] === 'string' ? json['cover_image'] : '',
        });
    }

    toJson(): any {
        return {
            'item_id': this.itemId,
            'provider': this.provider,
            'media_title': this.mediaTitle,
            'artist': this.artist,
            'cover_image': this.coverImage,
        };
    }
}

export const Global_MusicAssistantUrl = 'Global_MusicAssistantUrl';
export const Global_MusicAssistantToken = 'Global_MusicAssistantToken';
export const Global_MusicAssistantTargetPlayerId = 'Global_MusicAssistantTargetPlayerId';
export const Global_FlutterWebUrl = 'Global_FlutterWebUrl';
export const Global_FlutterWebPort = 'Global_FlutterWebPort';
export const Global_MqttBrokerHostAddress = 'Global_MqttBrokerHostAddress';
export const Global_MqttWebSocketPort = 'Global_MqttWebSocketPort';
export const Global_MqttTcpPort = 'Global_MqttTcpPort';
export const Global_LastKnownUidScanned = { key: 'Global_LastKnownUidScanned', fromJson: UidScanned_t.fromJson };
export const Global_LastUnknownUidScanned = { key: 'Global_LastUnknownUidScanned', fromJson: UidScanned_t.fromJson };
export const Global_CurrentShelfStatus = 'Global_CurrentShelfStatus';
export const Global_ReaderConnectionStatus = 'Global_ReaderConnectionStatus';
export const Global_ProjectorHeartbeatSignal = 'Global_ProjectorHeartbeatSignal';
export const Global_DefinedProjectorErrorMessage = 'Global_DefinedProjectorErrorMessage';
export const Global_ProjectorHeartbeat = 'Global_ProjectorHeartbeat';
export const Global_TargetDisplayWidthInPixels = 'Global_TargetDisplayWidthInPixels';
export const Global_TargetDisplayHeightInPixels = 'Global_TargetDisplayHeightInPixels';
export const Global_CurrentMaptasticProjectorPositions = 'Global_CurrentMaptasticProjectorPositions';
export const Global_SavedMaptasticProjectorPositions = 'Global_SavedMaptasticProjectorPositions';
export const Global_LoadingWidgetState = 'Global_LoadingWidgetState';
export const Global_InfoWidgetData = { key: 'Global_InfoWidgetData', fromJson: TitleAndArtist_t.fromJson };
export const Global_InfoWidgetState = 'Global_InfoWidgetState';
export const Global_OverlayWidgetData = { key: 'Global_OverlayWidgetData', fromJson: OverlayData_t.fromJson };
export const Global_OverlayWidgetState = 'Global_OverlayWidgetState';
export const Global_RecordWidgetData = { key: 'Global_RecordWidgetData', fromJson: RecordDesignData_t.fromJson };
export const Global_RecordWidgetState = 'Global_RecordWidgetState';
export const Global_TrackListWidgetData = { key: 'Global_TrackListWidgetData', fromJson: TrackListWidgetData_t.fromJson };
export const Global_TrackListWidgetState = 'Global_TrackListWidgetState';
export const Global_ProgressWidgetData = { key: 'Global_ProgressWidgetData', fromJson: ProgressData_t.fromJson };
export const Global_ProgressWidgetState = 'Global_ProgressWidgetState';
export const Global_LyricsWidgetData = { key: 'Global_LyricsWidgetData', fromJson: LyricData_t.fromJson };
export const Global_LyricsWidgetState = 'Global_LyricsWidgetState';
export const Global_VisualizerWidgetState = 'Global_VisualizerWidgetState';
export const Global_QrCodeWidgetData = { key: 'Global_QrCodeWidgetData', fromJson: QrCodeData_t.fromJson };
export const Global_QrCodeWidgetState = 'Global_QrCodeWidgetState';
export const Global_PlaybackErrorMessageState = 'Global_PlaybackErrorMessageState';
export const Global_ActiveTrackProgressInSeconds = 'Global_ActiveTrackProgressInSeconds';
export const Global_ActiveTrackTotalDurationInSeconds = 'Global_ActiveTrackTotalDurationInSeconds';
export const Global_MediaPlaybackState = 'Global_MediaPlaybackState';
export const Global_ActiveTrack = { key: 'Global_ActiveTrack', fromJson: ActiveTrack_t.fromJson };

