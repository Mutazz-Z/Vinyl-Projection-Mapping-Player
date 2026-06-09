// ==========================================
// GENERATED CODE - DO NOT EDIT
// ==========================================

// ── Enum value maps ───────────────────────────────────────────────────────────

const WidgetState = Object.freeze({
    Hide: 0,
    Show: 1,
    Pause: 2,
    Resume: 3,
    Loading: 4,
    Idle: 5,
});

const MediaPlaybackState = Object.freeze({
    Playing: 0,
    Paused: 1,
    Idle: 2,
    Buffering: 3,
    Unknown: 4,
    Stopped: 5,
    Error: 6,
    Offline: 7,
});

const VisualDataState = Object.freeze({
    DisplayAlbumVisuals: 0,
    DisplayErrorMessage: 1,
    DisplayTagRegistration: 2,
    DisplayIdle: 3,
});

const ShelfStatus = Object.freeze({
    Empty: false,
    Occupied: true,
});

const ReaderStatus = Object.freeze({
    Offline: false,
    Online: true,
});

// ── Struct classes ──────────────────────────────────────────────────────────

class RecordDesignData_t {
    constructor({
        labelDesign,
        ringDesign,
        readyForDisplay,
    }) {
        this.labelDesign = labelDesign;
        this.ringDesign = ringDesign;
        this.readyForDisplay = readyForDisplay;
    }

    static fromJson(json) {
        if (!json || typeof json !== 'object') return new RecordDesignData_t({});
        return new RecordDesignData_t({
            labelDesign: LabelDesignData_t.fromJson(json['labelDesign'] ?? {}),
            ringDesign: RingDesignData_t.fromJson(json['ringDesign'] ?? {}),
            readyForDisplay: json['readyForDisplay'] === true,
        });
    }

    toJson() {
        return {
            'labelDesign': this.labelDesign,
            'ringDesign': this.ringDesign,
            'readyForDisplay': this.readyForDisplay,
        };
    }
}

class AlbumTrackList_t {
    constructor({
        track,
        duration,
        coverImage,
        lyrics,
    }) {
        this.track = track;
        this.duration = duration;
        this.coverImage = coverImage;
        this.lyrics = lyrics;
    }

    static fromJson(json) {
        if (!json || typeof json !== 'object') return new AlbumTrackList_t({});
        return new AlbumTrackList_t({
            track: typeof json['track'] === 'string' ? json['track'] : '',
            duration: Number(json['duration'] ?? 0),
            coverImage: typeof json['cover_image'] === 'string' ? json['cover_image'] : '',
            lyrics: TrackLyrics_t.fromJson(json['lyrics'] ?? {}),
        });
    }

    toJson() {
        return {
            'track': this.track,
            'duration': this.duration,
            'cover_image': this.coverImage,
            'lyrics': this.lyrics,
        };
    }
}

class ProgressData_t {
    constructor({
        currentDurationInTrack,
        totalDurationInTrack,
        readyForDisplay,
    }) {
        this.currentDurationInTrack = currentDurationInTrack;
        this.totalDurationInTrack = totalDurationInTrack;
        this.readyForDisplay = readyForDisplay;
    }

    static fromJson(json) {
        if (!json || typeof json !== 'object') return new ProgressData_t({});
        return new ProgressData_t({
            currentDurationInTrack: Number(json['currentDurationInTrack'] ?? 0),
            totalDurationInTrack: Number(json['totalDurationInTrack'] ?? 0),
            readyForDisplay: json['readyForDisplay'] === true,
        });
    }

    toJson() {
        return {
            'currentDurationInTrack': this.currentDurationInTrack,
            'totalDurationInTrack': this.totalDurationInTrack,
            'readyForDisplay': this.readyForDisplay,
        };
    }
}

class AlbumsInLibrary_t {
    constructor({
        itemId,
        provider,
        mediaTitle,
        artist,
        coverImage,
    }) {
        this.itemId = itemId;
        this.provider = provider;
        this.mediaTitle = mediaTitle;
        this.artist = artist;
        this.coverImage = coverImage;
    }

    static fromJson(json) {
        if (!json || typeof json !== 'object') return new AlbumsInLibrary_t({});
        return new AlbumsInLibrary_t({
            itemId: typeof json['item_id'] === 'string' ? json['item_id'] : '',
            provider: typeof json['provider'] === 'string' ? json['provider'] : '',
            mediaTitle: typeof json['media_title'] === 'string' ? json['media_title'] : '',
            artist: typeof json['artist'] === 'string' ? json['artist'] : '',
            coverImage: typeof json['cover_image'] === 'string' ? json['cover_image'] : '',
        });
    }

    toJson() {
        return {
            'item_id': this.itemId,
            'provider': this.provider,
            'media_title': this.mediaTitle,
            'artist': this.artist,
            'cover_image': this.coverImage,
        };
    }
}

class LabelDesignData_t {
    constructor({
        usesImage,
        labelColor,
        labelImage,
    }) {
        this.usesImage = usesImage;
        this.labelColor = labelColor;
        this.labelImage = labelImage;
    }

    static fromJson(json) {
        if (!json || typeof json !== 'object') return new LabelDesignData_t({});
        return new LabelDesignData_t({
            usesImage: json['usesImage'] === true,
            labelColor: typeof json['labelColor'] === 'string' ? json['labelColor'] : '',
            labelImage: typeof json['labelImage'] === 'string' ? json['labelImage'] : '',
        });
    }

    toJson() {
        return {
            'usesImage': this.usesImage,
            'labelColor': this.labelColor,
            'labelImage': this.labelImage,
        };
    }
}

class ProjectorData_t {
    constructor({
        tagData,
        visualDataState,
        registerTagUrl,
        errorMessage,
    }) {
        this.tagData = tagData;
        this.visualDataState = visualDataState;
        this.registerTagUrl = registerTagUrl;
        this.errorMessage = errorMessage;
    }

    static fromJson(json) {
        if (!json || typeof json !== 'object') return new ProjectorData_t({});
        return new ProjectorData_t({
            tagData: VinylRecordTagData_t.fromJson(json['tag_data'] ?? {}),
            visualDataState: Number(json['visual_data_state'] ?? 0),
            registerTagUrl: typeof json['register_tag_url'] === 'string' ? json['register_tag_url'] : '',
            errorMessage: typeof json['error_message'] === 'string' ? json['error_message'] : '',
        });
    }

    toJson() {
        return {
            'tag_data': this.tagData,
            'visual_data_state': this.visualDataState,
            'register_tag_url': this.registerTagUrl,
            'error_message': this.errorMessage,
        };
    }
}

class RingDesignData_t {
    constructor({
        usesImage,
        ringColor,
        ringImage,
    }) {
        this.usesImage = usesImage;
        this.ringColor = ringColor;
        this.ringImage = ringImage;
    }

    static fromJson(json) {
        if (!json || typeof json !== 'object') return new RingDesignData_t({});
        return new RingDesignData_t({
            usesImage: json['usesImage'] === true,
            ringColor: typeof json['ringColor'] === 'string' ? json['ringColor'] : '',
            ringImage: typeof json['ringImage'] === 'string' ? json['ringImage'] : '',
        });
    }

    toJson() {
        return {
            'usesImage': this.usesImage,
            'ringColor': this.ringColor,
            'ringImage': this.ringImage,
        };
    }
}

class TrackListItem_t {
    constructor({
        trackIndex,
        track,
    }) {
        this.trackIndex = trackIndex;
        this.track = track;
    }

    static fromJson(json) {
        if (!json || typeof json !== 'object') return new TrackListItem_t({});
        return new TrackListItem_t({
            trackIndex: Number(json['trackIndex'] ?? 0),
            track: typeof json['track'] === 'string' ? json['track'] : '',
        });
    }

    toJson() {
        return {
            'trackIndex': this.trackIndex,
            'track': this.track,
        };
    }
}

class VinylRecordTagData_t {
    constructor({
        tagUid,
        itemId,
        provider,
        mediaTitle,
        artist,
        trackList,
        coverImage,
        labelColor,
        labelImage,
        outerRingColor,
        outerRingImage,
        projectionOverlay,
    }) {
        this.tagUid = tagUid;
        this.itemId = itemId;
        this.provider = provider;
        this.mediaTitle = mediaTitle;
        this.artist = artist;
        this.trackList = trackList;
        this.coverImage = coverImage;
        this.labelColor = labelColor;
        this.labelImage = labelImage;
        this.outerRingColor = outerRingColor;
        this.outerRingImage = outerRingImage;
        this.projectionOverlay = projectionOverlay;
    }

    static fromJson(json) {
        if (!json || typeof json !== 'object') return new VinylRecordTagData_t({});
        return new VinylRecordTagData_t({
            tagUid: typeof json['tag_uid'] === 'string' ? json['tag_uid'] : '',
            itemId: typeof json['item_id'] === 'string' ? json['item_id'] : '',
            provider: typeof json['provider'] === 'string' ? json['provider'] : '',
            mediaTitle: typeof json['media_title'] === 'string' ? json['media_title'] : '',
            artist: typeof json['artist'] === 'string' ? json['artist'] : '',
            trackList: Array.isArray(json['track_list']) ? json['track_list'].map(AlbumTrackList_t.fromJson) : [],
            coverImage: typeof json['cover_image'] === 'string' ? json['cover_image'] : '',
            labelColor: typeof json['label_color'] === 'string' ? json['label_color'] : '',
            labelImage: typeof json['label_image'] === 'string' ? json['label_image'] : '',
            outerRingColor: typeof json['outer_ring_color'] === 'string' ? json['outer_ring_color'] : '',
            outerRingImage: typeof json['outer_ring_image'] === 'string' ? json['outer_ring_image'] : '',
            projectionOverlay: typeof json['projection_overlay'] === 'string' ? json['projection_overlay'] : '',
        });
    }

    toJson() {
        return {
            'tag_uid': this.tagUid,
            'item_id': this.itemId,
            'provider': this.provider,
            'media_title': this.mediaTitle,
            'artist': this.artist,
            'track_list': this.trackList.map(function(e) { return e.toJson(); }),
            'cover_image': this.coverImage,
            'label_color': this.labelColor,
            'label_image': this.labelImage,
            'outer_ring_color': this.outerRingColor,
            'outer_ring_image': this.outerRingImage,
            'projection_overlay': this.projectionOverlay,
        };
    }
}

class TitleAndArtist_t {
    constructor({
        title,
        artist,
        readyForDisplay,
    }) {
        this.title = title;
        this.artist = artist;
        this.readyForDisplay = readyForDisplay;
    }

    static fromJson(json) {
        if (!json || typeof json !== 'object') return new TitleAndArtist_t({});
        return new TitleAndArtist_t({
            title: typeof json['title'] === 'string' ? json['title'] : '',
            artist: typeof json['artist'] === 'string' ? json['artist'] : '',
            readyForDisplay: json['readyForDisplay'] === true,
        });
    }

    toJson() {
        return {
            'title': this.title,
            'artist': this.artist,
            'readyForDisplay': this.readyForDisplay,
        };
    }
}

class LyricLine_t {
    constructor({
        timeStart,
        text,
    }) {
        this.timeStart = timeStart;
        this.text = text;
    }

    static fromJson(json) {
        if (!json || typeof json !== 'object') return new LyricLine_t({});
        return new LyricLine_t({
            timeStart: Number(json['time_start'] ?? 0),
            text: typeof json['text'] === 'string' ? json['text'] : '',
        });
    }

    toJson() {
        return {
            'time_start': this.timeStart,
            'text': this.text,
        };
    }
}

class QueueList_t {
    constructor({
        tracks,
        currentPlayingIndex,
    }) {
        this.tracks = tracks;
        this.currentPlayingIndex = currentPlayingIndex;
    }

    static fromJson(json) {
        if (!json || typeof json !== 'object') return new QueueList_t({});
        return new QueueList_t({
            tracks: Array.isArray(json['tracks']) ? json['tracks'].map(TrackListItem_t.fromJson) : [],
            currentPlayingIndex: Number(json['currentPlayingIndex'] ?? 0),
        });
    }

    toJson() {
        return {
            'tracks': this.tracks.map(function(e) { return e.toJson(); }),
            'currentPlayingIndex': this.currentPlayingIndex,
        };
    }
}

class AvailableMediaPlayers_t {
    constructor({
        playerID,
        displayName,
    }) {
        this.playerID = playerID;
        this.displayName = displayName;
    }

    static fromJson(json) {
        if (!json || typeof json !== 'object') return new AvailableMediaPlayers_t({});
        return new AvailableMediaPlayers_t({
            playerID: typeof json['player_id'] === 'string' ? json['player_id'] : '',
            displayName: typeof json['display_name'] === 'string' ? json['display_name'] : '',
        });
    }

    toJson() {
        return {
            'player_id': this.playerID,
            'display_name': this.displayName,
        };
    }
}

class TrackListWidgetData_t {
    constructor({
        tracks,
        currentPlayingIndex,
        readyForDisplay,
    }) {
        this.tracks = tracks;
        this.currentPlayingIndex = currentPlayingIndex;
        this.readyForDisplay = readyForDisplay;
    }

    static fromJson(json) {
        if (!json || typeof json !== 'object') return new TrackListWidgetData_t({});
        return new TrackListWidgetData_t({
            tracks: Array.isArray(json['tracks']) ? json['tracks'].map(TrackListItem_t.fromJson) : [],
            currentPlayingIndex: Number(json['currentPlayingIndex'] ?? 0),
            readyForDisplay: json['readyForDisplay'] === true,
        });
    }

    toJson() {
        return {
            'tracks': this.tracks.map(function(e) { return e.toJson(); }),
            'currentPlayingIndex': this.currentPlayingIndex,
            'readyForDisplay': this.readyForDisplay,
        };
    }
}

class UidScanned_t {
    constructor({
        uid,
        signal,
    }) {
        this.uid = uid;
        this.signal = signal;
    }

    static fromJson(json) {
        if (!json || typeof json !== 'object') return new UidScanned_t({});
        return new UidScanned_t({
            uid: typeof json['uid'] === 'string' ? json['uid'] : '',
            signal: Number(json['signal'] ?? 0),
        });
    }

    toJson() {
        return {
            'uid': this.uid,
            'signal': this.signal,
        };
    }
}

class ActiveTrack_t {
    constructor({
        trackName,
        trackIndex,
        provider,
        trackItemId,
        albumItemId,
    }) {
        this.trackName = trackName;
        this.trackIndex = trackIndex;
        this.provider = provider;
        this.trackItemId = trackItemId;
        this.albumItemId = albumItemId;
    }

    static fromJson(json) {
        if (!json || typeof json !== 'object') return new ActiveTrack_t({});
        return new ActiveTrack_t({
            trackName: typeof json['track_name'] === 'string' ? json['track_name'] : '',
            trackIndex: Number(json['track_index'] ?? 0),
            provider: typeof json['provider'] === 'string' ? json['provider'] : '',
            trackItemId: typeof json['track_item_id'] === 'string' ? json['track_item_id'] : '',
            albumItemId: typeof json['album_item_id'] === 'string' ? json['album_item_id'] : '',
        });
    }

    toJson() {
        return {
            'track_name': this.trackName,
            'track_index': this.trackIndex,
            'provider': this.provider,
            'track_item_id': this.trackItemId,
            'album_item_id': this.albumItemId,
        };
    }
}

class TrackLyrics_t {
    constructor({
        trackSupportsLyrics,
        lines,
    }) {
        this.trackSupportsLyrics = trackSupportsLyrics;
        this.lines = lines;
    }

    static fromJson(json) {
        if (!json || typeof json !== 'object') return new TrackLyrics_t({});
        return new TrackLyrics_t({
            trackSupportsLyrics: json['track_supports_lyrics'] === true,
            lines: Array.isArray(json['lines']) ? json['lines'].map(LyricLine_t.fromJson) : [],
        });
    }

    toJson() {
        return {
            'track_supports_lyrics': this.trackSupportsLyrics,
            'lines': this.lines.map(function(e) { return e.toJson(); }),
        };
    }
}

class LyricData_t {
    constructor({
        trackLyrics,
        readyForDisplay,
    }) {
        this.trackLyrics = trackLyrics;
        this.readyForDisplay = readyForDisplay;
    }

    static fromJson(json) {
        if (!json || typeof json !== 'object') return new LyricData_t({});
        return new LyricData_t({
            trackLyrics: TrackLyrics_t.fromJson(json['track_lyrics'] ?? {}),
            readyForDisplay: json['readyForDisplay'] === true,
        });
    }

    toJson() {
        return {
            'track_lyrics': this.trackLyrics,
            'readyForDisplay': this.readyForDisplay,
        };
    }
}

class OverlayData_t {
    constructor({
        overlayImage,
        readyForDisplay,
    }) {
        this.overlayImage = overlayImage;
        this.readyForDisplay = readyForDisplay;
    }

    static fromJson(json) {
        if (!json || typeof json !== 'object') return new OverlayData_t({});
        return new OverlayData_t({
            overlayImage: typeof json['overlayImage'] === 'string' ? json['overlayImage'] : '',
            readyForDisplay: json['readyForDisplay'] === true,
        });
    }

    toJson() {
        return {
            'overlayImage': this.overlayImage,
            'readyForDisplay': this.readyForDisplay,
        };
    }
}

// ── State key constants ─────────────────────────────────────────────────────

const Global_MusicAssistantUrl = 'Global_MusicAssistantUrl';
const Global_MusicAssistantToken = 'Global_MusicAssistantToken';
const Global_MusicAssistantTargetPlayerId = 'Global_MusicAssistantTargetPlayerId';
const Global_FlutterWebUrl = 'Global_FlutterWebUrl';
const Global_FlutterWebPort = 'Global_FlutterWebPort';
const Global_MqttBrokerHostAddress = 'Global_MqttBrokerHostAddress';
const Global_MqttWebSocketPort = 'Global_MqttWebSocketPort';
const Global_MqttTcpPort = 'Global_MqttTcpPort';
const Global_LastKnownUidScanned = { key: 'Global_LastKnownUidScanned', fromJson: UidScanned_t.fromJson };
const Global_LastUnknownUidScanned = { key: 'Global_LastUnknownUidScanned', fromJson: UidScanned_t.fromJson };
const Global_CurrentShelfStatus = 'Global_CurrentShelfStatus';
const Global_ReaderConnectionStatus = 'Global_ReaderConnectionStatus';
const Global_CurrentProjectorData = { key: 'Global_CurrentProjectorData', fromJson: ProjectorData_t.fromJson };
const Global_ProjectorHeartbeatSignal = 'Global_ProjectorHeartbeatSignal';
const Global_DefinedProjectorErrorMessage = 'Global_DefinedProjectorErrorMessage';
const Global_ProjectorHeartbeat = 'Global_ProjectorHeartbeat';
const Global_TargetDisplayWidthInPixels = 'Global_TargetDisplayWidthInPixels';
const Global_TargetDisplayHeightInPixels = 'Global_TargetDisplayHeightInPixels';
const Global_CurrentMaptasticProjectorPositions = 'Global_CurrentMaptasticProjectorPositions';
const Global_SavedMaptasticProjectorPositions = 'Global_SavedMaptasticProjectorPositions';
const Global_LoadingWidgetState = 'Global_LoadingWidgetState';
const Global_InfoWidgetData = { key: 'Global_InfoWidgetData', fromJson: TitleAndArtist_t.fromJson };
const Global_InfoWidgetState = 'Global_InfoWidgetState';
const Global_OverlayWidgetData = { key: 'Global_OverlayWidgetData', fromJson: OverlayData_t.fromJson };
const Global_OverlayWidgetState = 'Global_OverlayWidgetState';
const Global_RecordWidgetData = { key: 'Global_RecordWidgetData', fromJson: RecordDesignData_t.fromJson };
const Global_RecordWidgetState = 'Global_RecordWidgetState';
const Global_TrackListWidgetData = { key: 'Global_TrackListWidgetData', fromJson: TrackListWidgetData_t.fromJson };
const Global_TrackListWidgetState = 'Global_TrackListWidgetState';
const Global_ProgressWidgetData = { key: 'Global_ProgressWidgetData', fromJson: ProgressData_t.fromJson };
const Global_ProgressWidgetState = 'Global_ProgressWidgetState';
const Global_LyricsWidgetData = { key: 'Global_LyricsWidgetData', fromJson: LyricData_t.fromJson };
const Global_LyricsWidgetState = 'Global_LyricsWidgetState';
const Global_VisualizerWidgetState = 'Global_VisualizerWidgetState';
const Global_ActiveTrackProgressInSeconds = 'Global_ActiveTrackProgressInSeconds';
const Global_ActiveTrackTotalDurationInSeconds = 'Global_ActiveTrackTotalDurationInSeconds';
const Global_MediaPlaybackState = 'Global_MediaPlaybackState';
const Global_ActiveTrack = { key: 'Global_ActiveTrack', fromJson: ActiveTrack_t.fromJson };

