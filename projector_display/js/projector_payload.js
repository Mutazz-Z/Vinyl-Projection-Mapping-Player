class ProjectorPayload {
    constructor(raw) {
        const tag = raw.tag_data;

        this.visualDataState = raw.visual_data_state;
        this.registerTagUrl = raw.register_tag_url;
        this.errorMessage = raw.error_message;

        this.tagData = {
            tagUid: tag.tag_uid,
            mediaTitle: tag.media_title,
            artist: tag.artist,
            trackList: tag.track_list.map(function (entry) {
                return {
                    track: entry.track,
                    duration: entry.duration,
                    coverImage: entry.cover_image,
                    lyrics: {
                        lines: entry.lyrics.lines.map(function (line) {
                            return {
                                timeStart: line.time_start,
                                text: line.text,
                            };
                        })
                    }
                };
            }),
            labelColor: tag.label_color,
            labelImage: tag.label_image,
            outerRingColor: tag.outer_ring_color,
            outerRingImage: tag.outer_ring_image,
            projectionOverlay: tag.projection_overlay,
            coverImage: tag.cover_image
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
                track_list: this.tagData.trackList.map(function (entry) {
                    return {
                        track: entry.track,
                        duration: entry.duration,
                        cover_image: entry.coverImage,
                        lyrics: {
                            lines: entry.lyrics.lines.map(function (line) {
                                return {
                                    time_start: line.timeStart,
                                    text: line.text,
                                };
                            })
                        }
                    };
                }),
                label_color: this.tagData.labelColor,
                label_image: this.tagData.labelImage,
                outer_ring_color: this.tagData.outerRingColor,
                outer_ring_image: this.tagData.outerRingImage,
                projection_overlay: this.tagData.projectionOverlay,
                cover_image: this.tagData.coverImage
            }
        };
    }

}