const PlayerState = Object.freeze({
    PLAYING: 'playing',
    STOPPED: 'stopped',
    UNKNOWN: 'unknown',
    ERROR: 'error',
});

class ProjectorPayload {
    constructor(raw) {
        if (!raw || typeof raw !== 'object') {
            throw new TypeError('ProjectorPayload: raw payload must be a non-null object.');
        }

        const tag = (raw.tag_data && typeof raw.tag_data === 'object') ? raw.tag_data : {};

        this.playerState = ProjectorPayload._normalisePlayerState(raw.player_state);

        this.album = ProjectorPayload._str(tag.media_title);
        this.artist = ProjectorPayload._str(tag.artist);
        this.tagUid = ProjectorPayload._str(tag.tag_uid);

        this.tracks = ProjectorPayload._parseTracks(tag.track_list);

        this.inner_record_color = ProjectorPayload._str(tag.label_color);
        this.inner_record_image = ProjectorPayload._str(tag.label_image);

        this.outer_design_color = ProjectorPayload._str(tag.outer_ring_color);
        this.outer_design_image = ProjectorPayload._str(tag.outer_ring_image);

        this.overlay_art = ProjectorPayload._str(tag.projection_overlay);
        this.album_cover_art = ProjectorPayload._str(tag.cover_image);

        this.registration_url = ProjectorPayload._str(raw.register_tag_url);

        this.errorMessage = (this.playerState === PlayerState.ERROR)
            ? (ProjectorPayload._str(raw.error_message) || 'An unknown playback error occurred.')
            : '';
    }

    hasDesignData() {
        return Boolean(
            this.inner_record_color ||
            this.inner_record_image ||
            this.outer_design_color ||
            this.outer_design_image ||
            this.overlay_art ||
            this.album_cover_art
        );
    }


    static _parseTracks(rawList) {
        if (!Array.isArray(rawList)) return '';
        return rawList
            .map(entry => (entry && typeof entry.track === 'string') ? entry.track.trim() : '')
            .filter(Boolean)
            .join('\n');
    }

    static _str(val) {
        return (typeof val === 'string') ? val.trim() : '';
    }

    static _normalisePlayerState(raw) {
        const normalised = (typeof raw === 'string') ? raw.trim().toLowerCase() : '';
        if (Object.values(PlayerState).includes(normalised)) return normalised;

        console.warn(`ProjectorPayload: unrecognised player_state "${raw}" — treating as error.`);
        return PlayerState.ERROR;
    }
}