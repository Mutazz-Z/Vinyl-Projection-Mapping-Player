class ProjectorPayload {
    constructor(raw) {
        if (!raw || typeof raw !== 'object') {
            throw new TypeError('ProjectorPayload: raw payload must be a non-null object.');
        }

        const rawTag = raw.tagData ?? raw.tag_data ?? raw.TagData ?? {};
        const tag = (typeof rawTag === 'object' && rawTag !== null) ? rawTag : {};

        this.visualDataState = ProjectorPayload._normaliseVisualDataState(raw.visualDataState ?? raw.visual_data_state ?? raw.VisualDataState);
        this.registerTagUrl = ProjectorPayload._str(raw.registerTagUrl ?? raw.register_tag_url ?? raw.RegisterTagUrl);

        const rawError = raw.errorMessage ?? raw.error_message ?? raw.ErrorMessage;
        this.errorMessage = (this.visualDataState === VisualDataState.DisplayErrorMessage)
            ? (ProjectorPayload._str(rawError) || window.AppProjectorErrorMessage || 'An unknown playback error occurred.')
            : '';

        this.tagData = {
            tagUid: ProjectorPayload._str(tag.tagUid ?? tag.tag_uid ?? tag.TagUid),
            mediaTitle: ProjectorPayload._str(tag.mediaTitle ?? tag.media_title ?? tag.MediaTitle),
            artist: ProjectorPayload._str(tag.artist ?? tag.Artist),

            trackList: ProjectorPayload._parseTracksAsObjects(tag.trackList ?? tag.track_list ?? tag.TrackList),

            labelColor: ProjectorPayload._str(tag.labelColor ?? tag.label_color ?? tag.LabelColor),
            labelImage: ProjectorPayload._str(tag.labelImage ?? tag.label_image ?? tag.LabelImage),
            outerRingColor: ProjectorPayload._str(tag.outerRingColor ?? tag.outer_ring_color ?? tag.OuterRingColor),
            outerRingImage: ProjectorPayload._str(tag.outerRingImage ?? tag.outer_ring_image ?? tag.OuterRingImage),
            projectionOverlay: ProjectorPayload._str(tag.projectionOverlay ?? tag.projection_overlay ?? tag.ProjectionOverlay),
            coverImage: ProjectorPayload._str(tag.coverImage ?? tag.cover_image ?? tag.CoverImage)
        };
    }

    hasDesignData() {
        if (!this.tagData) return false;
        return Boolean(
            this.tagData.labelColor ||
            this.tagData.labelImage ||
            this.tagData.outerRingColor ||
            this.tagData.outerRingImage ||
            this.tagData.projectionOverlay ||
            this.tagData.coverImage
        );
    }

    toJson() {
        return {
            visual_data_state: this.visualDataState,
            register_tag_url: this.registerTagUrl,
            error_message: this.errorMessage,
            tag_data: {
                tag_uid: this.tagData.tagUid,
                media_title: this.tagData.mediaTitle,
                artist: this.tagData.artist,
                track_list: this.tagData.trackList,
                label_color: this.tagData.labelColor,
                label_image: this.tagData.labelImage,
                outer_ring_color: this.tagData.outerRingColor,
                outer_ring_image: this.tagData.outerRingImage,
                projection_overlay: this.tagData.projectionOverlay,
                cover_image: this.tagData.coverImage
            }
        };
    }

    static _normaliseVisualDataState(raw) {
        const value = Number(raw);
        if (Object.values(VisualDataState).includes(value)) return value;
        return VisualDataState.DisplayIdle;
    }

    static _parseTracksAsObjects(rawList) {
        if (!Array.isArray(rawList)) return [];
        return rawList.map(function (entry) {
            const rawLyrics = entry.lyrics ?? entry.Lyrics ?? {};
            const rawLines = Array.isArray(rawLyrics.lines) ? rawLyrics.lines : [];
            return {
                track: ProjectorPayload._str(entry.track ?? entry.Track ?? entry.title ?? entry.Title),
                duration: Number(entry.duration ?? entry.Duration ?? 0),
                coverImage: ProjectorPayload._str(entry.coverImage ?? entry.cover_image ?? entry.CoverImage),
                lyrics: {
                    lines: rawLines.map(function (line) {
                        return {
                            timeStart: Number(line.timeStart ?? line.time_start ?? 0),
                            text: ProjectorPayload._str(line.text ?? line.Text),
                        };
                    }).filter(function (line) {
                        return line.text !== '';
                    })
                }
            };
        });
    }

    static _str(val) {
        return (typeof val === 'string') ? val.trim() : '';
    }
}