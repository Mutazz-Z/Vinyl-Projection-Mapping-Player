class ProjectorPayload {
    constructor(raw) {
        if (!raw || typeof raw !== 'object') {
            throw new TypeError('ProjectorPayload: raw payload must be a non-null object.');
        }

        const tagData = (raw.tag_data && typeof raw.tag_data === 'object') ? raw.tag_data : {};

        this.visualDataState = ProjectorPayload._normaliseVisualDataState(raw.visual_data_state);

        this.album = ProjectorPayload._str(tagData.media_title);
        this.artist = ProjectorPayload._str(tagData.artist);
        this.tagUid = ProjectorPayload._str(tagData.tag_uid);

        this.tracks = ProjectorPayload._parseTracks(tagData.track_list);

        this.inner_record_color = ProjectorPayload._str(tagData.label_color);
        this.inner_record_image = ProjectorPayload._str(tagData.label_image);
        this.outer_design_color = ProjectorPayload._str(tagData.outer_ring_color);
        this.outer_design_image = ProjectorPayload._str(tagData.outer_ring_image);
        this.overlay_art = ProjectorPayload._str(tagData.projection_overlay);
        this.album_cover_art = ProjectorPayload._str(tagData.cover_image);

        this.registration_url = ProjectorPayload._str(raw.register_tag_url);

        this.errorMessage = (this.visualDataState === VisualDataState.DisplayErrorMessage)
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

    static _normaliseVisualDataState(raw) {
        const value = Number(raw);
        if (Object.values(VisualDataState).includes(value)) return value;

        console.warn(`ProjectorPayload: unrecognised visual_data_state "${raw}" — defaulting to DisplayIdle.`);
        return VisualDataState.DisplayIdle;
    }

    static _parseTracks(rawList) {
        if (!Array.isArray(rawList)) return '';
        return rawList
            .map(function (entry) {
                return (entry && typeof entry.track === 'string') ? entry.track.trim() : '';
            })
            .filter(Boolean)
            .join('\n');
    }

    static _str(val) {
        return (typeof val === 'string') ? val.trim() : '';
    }
}