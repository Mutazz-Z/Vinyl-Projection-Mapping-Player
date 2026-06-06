// ==========================================
// GENERATED CODE - DO NOT EDIT
// ==========================================

// ── Enum value maps ───────────────────────────────────────────────────────────

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

const ReaderStatus = Object.freeze({
    Offline: false,
    Online: true,
});

const ShelfStatus = Object.freeze({
    Empty: false,
    Occupied: true,
});

// ── Struct classes ──────────────────────────────────────────────────────────

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

class QueueList_t {
    constructor({
        tracks,
    }) {
        this.tracks = tracks;
    }

    static fromJson(json) {
        if (!json || typeof json !== 'object') return new QueueList_t({});
        return new QueueList_t({
            tracks: Array.isArray(json['tracks']) ? json['tracks'] : [],
        });
    }

    toJson() {
        return {
            'tracks': this.tracks,
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

class TitleAndArtist_t {
    constructor({
        title,
        artist,
    }) {
        this.title = title;
        this.artist = artist;
    }

    static fromJson(json) {
        if (!json || typeof json !== 'object') return new TitleAndArtist_t({});
        return new TitleAndArtist_t({
            title: typeof json['title'] === 'string' ? json['title'] : '',
            artist: typeof json['artist'] === 'string' ? json['artist'] : '',
        });
    }

    toJson() {
        return {
            'title': this.title,
            'artist': this.artist,
        };
    }
}

class TrackLyrics_t {
    constructor({
        lines,
    }) {
        this.lines = lines;
    }

    static fromJson(json) {
        if (!json || typeof json !== 'object') return new TrackLyrics_t({});
        return new TrackLyrics_t({
            lines: Array.isArray(json['lines']) ? json['lines'].map(LyricLine_t.fromJson) : [],
        });
    }

    toJson() {
        return {
            'lines': this.lines.map(function(e) { return e.toJson(); }),
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

// ── State key constants ─────────────────────────────────────────────────────

const Global_MusicAssistantUrl = 'Global_MusicAssistantUrl';
const Global_MusicAssistantToken = 'Global_MusicAssistantToken';
const Global_MusicAssistantTargetPlayerId = 'Global_MusicAssistantTargetPlayerId';
const Global_FlutterWebUrl = 'Global_FlutterWebUrl';
const Global_FlutterWebPort = 'Global_FlutterWebPort';
const Global_MqttBrokerHostAddress = 'Global_MqttBrokerHostAddress';
const Global_MqttWebSocketPort = 'Global_MqttWebSocketPort';
const Global_MqttTcpPort = 'Global_MqttTcpPort';
const Global_LastKnownUidScanned = 'Global_LastKnownUidScanned';
const Global_LastUnknownUidScanned = 'Global_LastUnknownUidScanned';
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
const Global_CurrentPlayingAlbumTitleAndArtist = { key: 'Global_CurrentPlayingAlbumTitleAndArtist', fromJson: TitleAndArtist_t.fromJson };
const Global_MediaPlaybackState = 'Global_MediaPlaybackState';
const Global_CurrentMediaPlaybackQueue = { key: 'Global_CurrentMediaPlaybackQueue', fromJson: QueueList_t.fromJson };
const Global_ActiveTrack = { key: 'Global_ActiveTrack', fromJson: ActiveTrack_t.fromJson };
const Global_ActiveTrackProgressInSeconds = 'Global_ActiveTrackProgressInSeconds';
const Global_ActiveTrackTotalDurationInSeconds = 'Global_ActiveTrackTotalDurationInSeconds';

