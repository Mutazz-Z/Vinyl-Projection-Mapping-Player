"use strict";
(() => {
  // types/state.ts
  var QrCodeData_t = class _QrCodeData_t {
    constructor(parameters) {
      this.registrationUrl = parameters.registrationUrl ?? "";
      this.uid = parameters.uid ?? "";
      this.readyForDisplay = parameters.readyForDisplay ?? false;
    }
    static fromJson(json) {
      if (!json || typeof json !== "object") return new _QrCodeData_t({});
      return new _QrCodeData_t({
        registrationUrl: typeof json["registration_url"] === "string" ? json["registration_url"] : "",
        uid: typeof json["uid"] === "string" ? json["uid"] : "",
        readyForDisplay: json["readyForDisplay"] === true
      });
    }
    toJson() {
      return {
        "registration_url": this.registrationUrl,
        "uid": this.uid,
        "readyForDisplay": this.readyForDisplay
      };
    }
  };
  var UidScanned_t = class _UidScanned_t {
    constructor(parameters) {
      this.uid = parameters.uid ?? "";
      this.signal = parameters.signal ?? 0;
    }
    static fromJson(json) {
      if (!json || typeof json !== "object") return new _UidScanned_t({});
      return new _UidScanned_t({
        uid: typeof json["uid"] === "string" ? json["uid"] : "",
        signal: Number(json["signal"] ?? 0)
      });
    }
    toJson() {
      return {
        "uid": this.uid,
        "signal": this.signal
      };
    }
  };
  var TitleAndArtist_t = class _TitleAndArtist_t {
    constructor(parameters) {
      this.title = parameters.title ?? "";
      this.artist = parameters.artist ?? "";
      this.readyForDisplay = parameters.readyForDisplay ?? false;
    }
    static fromJson(json) {
      if (!json || typeof json !== "object") return new _TitleAndArtist_t({});
      return new _TitleAndArtist_t({
        title: typeof json["title"] === "string" ? json["title"] : "",
        artist: typeof json["artist"] === "string" ? json["artist"] : "",
        readyForDisplay: json["readyForDisplay"] === true
      });
    }
    toJson() {
      return {
        "title": this.title,
        "artist": this.artist,
        "readyForDisplay": this.readyForDisplay
      };
    }
  };
  var TrackLyrics_t = class _TrackLyrics_t {
    constructor(parameters) {
      this.trackSupportsLyrics = parameters.trackSupportsLyrics ?? false;
      this.lines = parameters.lines ?? [];
    }
    static fromJson(json) {
      if (!json || typeof json !== "object") return new _TrackLyrics_t({});
      return new _TrackLyrics_t({
        trackSupportsLyrics: json["track_supports_lyrics"] === true,
        lines: Array.isArray(json["lines"]) ? json["lines"].map((element) => LyricLine_t.fromJson(element)) : []
      });
    }
    toJson() {
      return {
        "track_supports_lyrics": this.trackSupportsLyrics,
        "lines": this.lines.map(function(element) {
          return element.toJson();
        })
      };
    }
  };
  var MaptasticProjectorPositions_t = class _MaptasticProjectorPositions_t {
    constructor(parameters) {
      this.layoutJson = parameters.layoutJson ?? "";
    }
    static fromJson(json) {
      if (!json || typeof json !== "object") return new _MaptasticProjectorPositions_t({});
      return new _MaptasticProjectorPositions_t({
        layoutJson: typeof json["layoutJson"] === "string" ? json["layoutJson"] : ""
      });
    }
    toJson() {
      return {
        "layoutJson": this.layoutJson
      };
    }
  };
  var LabelDesignData_t = class _LabelDesignData_t {
    constructor(parameters) {
      this.usesImage = parameters.usesImage ?? false;
      this.labelColor = parameters.labelColor ?? "";
      this.labelImage = parameters.labelImage ?? "";
    }
    static fromJson(json) {
      if (!json || typeof json !== "object") return new _LabelDesignData_t({});
      return new _LabelDesignData_t({
        usesImage: json["usesImage"] === true,
        labelColor: typeof json["labelColor"] === "string" ? json["labelColor"] : "",
        labelImage: typeof json["labelImage"] === "string" ? json["labelImage"] : ""
      });
    }
    toJson() {
      return {
        "usesImage": this.usesImage,
        "labelColor": this.labelColor,
        "labelImage": this.labelImage
      };
    }
  };
  var OverlayData_t = class _OverlayData_t {
    constructor(parameters) {
      this.overlayImage = parameters.overlayImage ?? "";
      this.readyForDisplay = parameters.readyForDisplay ?? false;
    }
    static fromJson(json) {
      if (!json || typeof json !== "object") return new _OverlayData_t({});
      return new _OverlayData_t({
        overlayImage: typeof json["overlayImage"] === "string" ? json["overlayImage"] : "",
        readyForDisplay: json["readyForDisplay"] === true
      });
    }
    toJson() {
      return {
        "overlayImage": this.overlayImage,
        "readyForDisplay": this.readyForDisplay
      };
    }
  };
  var TrackListItem_t = class _TrackListItem_t {
    constructor(parameters) {
      this.trackIndex = parameters.trackIndex ?? 0;
      this.track = parameters.track ?? "";
    }
    static fromJson(json) {
      if (!json || typeof json !== "object") return new _TrackListItem_t({});
      return new _TrackListItem_t({
        trackIndex: Number(json["trackIndex"] ?? 0),
        track: typeof json["track"] === "string" ? json["track"] : ""
      });
    }
    toJson() {
      return {
        "trackIndex": this.trackIndex,
        "track": this.track
      };
    }
  };
  var ActiveTrack_t = class _ActiveTrack_t {
    constructor(parameters) {
      this.trackName = parameters.trackName ?? "";
      this.trackIndex = parameters.trackIndex ?? 0;
      this.provider = parameters.provider ?? "";
      this.trackItemId = parameters.trackItemId ?? "";
      this.albumItemId = parameters.albumItemId ?? "";
    }
    static fromJson(json) {
      if (!json || typeof json !== "object") return new _ActiveTrack_t({});
      return new _ActiveTrack_t({
        trackName: typeof json["track_name"] === "string" ? json["track_name"] : "",
        trackIndex: Number(json["track_index"] ?? 0),
        provider: typeof json["provider"] === "string" ? json["provider"] : "",
        trackItemId: typeof json["track_item_id"] === "string" ? json["track_item_id"] : "",
        albumItemId: typeof json["album_item_id"] === "string" ? json["album_item_id"] : ""
      });
    }
    toJson() {
      return {
        "track_name": this.trackName,
        "track_index": this.trackIndex,
        "provider": this.provider,
        "track_item_id": this.trackItemId,
        "album_item_id": this.albumItemId
      };
    }
  };
  var ProjectorHeartbeatSignal_t = class _ProjectorHeartbeatSignal_t {
    constructor(parameters) {
      this.action = parameters.action ?? "";
      this.targetId = parameters.targetId ?? "";
      this.data = parameters.data ?? "";
      this.timestamp = parameters.timestamp ?? 0;
    }
    static fromJson(json) {
      if (!json || typeof json !== "object") return new _ProjectorHeartbeatSignal_t({});
      return new _ProjectorHeartbeatSignal_t({
        action: typeof json["action"] === "string" ? json["action"] : "",
        targetId: typeof json["targetId"] === "string" ? json["targetId"] : "",
        data: typeof json["data"] === "string" ? json["data"] : "",
        timestamp: Number(json["timestamp"] ?? 0)
      });
    }
    toJson() {
      return {
        "action": this.action,
        "targetId": this.targetId,
        "data": this.data,
        "timestamp": this.timestamp
      };
    }
  };
  var RecordDesignData_t = class _RecordDesignData_t {
    constructor(parameters) {
      this.labelDesign = parameters.labelDesign ?? new LabelDesignData_t({});
      this.ringDesign = parameters.ringDesign ?? new RingDesignData_t({});
      this.readyForDisplay = parameters.readyForDisplay ?? false;
    }
    static fromJson(json) {
      if (!json || typeof json !== "object") return new _RecordDesignData_t({});
      return new _RecordDesignData_t({
        labelDesign: LabelDesignData_t.fromJson(json["labelDesign"] ?? {}),
        ringDesign: RingDesignData_t.fromJson(json["ringDesign"] ?? {}),
        readyForDisplay: json["readyForDisplay"] === true
      });
    }
    toJson() {
      return {
        "labelDesign": this.labelDesign,
        "ringDesign": this.ringDesign,
        "readyForDisplay": this.readyForDisplay
      };
    }
  };
  var RingDesignData_t = class _RingDesignData_t {
    constructor(parameters) {
      this.usesImage = parameters.usesImage ?? false;
      this.ringColor = parameters.ringColor ?? "";
      this.ringImage = parameters.ringImage ?? "";
    }
    static fromJson(json) {
      if (!json || typeof json !== "object") return new _RingDesignData_t({});
      return new _RingDesignData_t({
        usesImage: json["usesImage"] === true,
        ringColor: typeof json["ringColor"] === "string" ? json["ringColor"] : "",
        ringImage: typeof json["ringImage"] === "string" ? json["ringImage"] : ""
      });
    }
    toJson() {
      return {
        "usesImage": this.usesImage,
        "ringColor": this.ringColor,
        "ringImage": this.ringImage
      };
    }
  };
  var LyricLine_t = class _LyricLine_t {
    constructor(parameters) {
      this.timeStart = parameters.timeStart ?? 0;
      this.text = parameters.text ?? "";
    }
    static fromJson(json) {
      if (!json || typeof json !== "object") return new _LyricLine_t({});
      return new _LyricLine_t({
        timeStart: Number(json["time_start"] ?? 0),
        text: typeof json["text"] === "string" ? json["text"] : ""
      });
    }
    toJson() {
      return {
        "time_start": this.timeStart,
        "text": this.text
      };
    }
  };
  var LyricData_t = class _LyricData_t {
    constructor(parameters) {
      this.trackLyrics = parameters.trackLyrics ?? new TrackLyrics_t({});
      this.readyForDisplay = parameters.readyForDisplay ?? false;
    }
    static fromJson(json) {
      if (!json || typeof json !== "object") return new _LyricData_t({});
      return new _LyricData_t({
        trackLyrics: TrackLyrics_t.fromJson(json["track_lyrics"] ?? {}),
        readyForDisplay: json["readyForDisplay"] === true
      });
    }
    toJson() {
      return {
        "track_lyrics": this.trackLyrics,
        "readyForDisplay": this.readyForDisplay
      };
    }
  };
  var TrackListWidgetData_t = class _TrackListWidgetData_t {
    constructor(parameters) {
      this.tracks = parameters.tracks ?? [];
      this.currentPlayingIndex = parameters.currentPlayingIndex ?? 0;
      this.readyForDisplay = parameters.readyForDisplay ?? false;
    }
    static fromJson(json) {
      if (!json || typeof json !== "object") return new _TrackListWidgetData_t({});
      return new _TrackListWidgetData_t({
        tracks: Array.isArray(json["tracks"]) ? json["tracks"].map((element) => TrackListItem_t.fromJson(element)) : [],
        currentPlayingIndex: Number(json["currentPlayingIndex"] ?? 0),
        readyForDisplay: json["readyForDisplay"] === true
      });
    }
    toJson() {
      return {
        "tracks": this.tracks.map(function(element) {
          return element.toJson();
        }),
        "currentPlayingIndex": this.currentPlayingIndex,
        "readyForDisplay": this.readyForDisplay
      };
    }
  };
  var ProjectorHeartbeat_t = class _ProjectorHeartbeat_t {
    constructor(parameters) {
      this.id = parameters.id ?? "";
      this.width = parameters.width ?? 0;
      this.height = parameters.height ?? 0;
      this.timestamp = parameters.timestamp ?? 0;
    }
    static fromJson(json) {
      if (!json || typeof json !== "object") return new _ProjectorHeartbeat_t({});
      return new _ProjectorHeartbeat_t({
        id: typeof json["id"] === "string" ? json["id"] : "",
        width: Number(json["width"] ?? 0),
        height: Number(json["height"] ?? 0),
        timestamp: Number(json["timestamp"] ?? 0)
      });
    }
    toJson() {
      return {
        "id": this.id,
        "width": this.width,
        "height": this.height,
        "timestamp": this.timestamp
      };
    }
  };
  var ProgressData_t = class _ProgressData_t {
    constructor(parameters) {
      this.currentDurationInTrack = parameters.currentDurationInTrack ?? 0;
      this.totalDurationInTrack = parameters.totalDurationInTrack ?? 0;
      this.readyForDisplay = parameters.readyForDisplay ?? false;
    }
    static fromJson(json) {
      if (!json || typeof json !== "object") return new _ProgressData_t({});
      return new _ProgressData_t({
        currentDurationInTrack: Number(json["currentDurationInTrack"] ?? 0),
        totalDurationInTrack: Number(json["totalDurationInTrack"] ?? 0),
        readyForDisplay: json["readyForDisplay"] === true
      });
    }
    toJson() {
      return {
        "currentDurationInTrack": this.currentDurationInTrack,
        "totalDurationInTrack": this.totalDurationInTrack,
        "readyForDisplay": this.readyForDisplay
      };
    }
  };
  var Global_LastKnownUidScanned = { key: "Global_LastKnownUidScanned", fromJson: UidScanned_t.fromJson };
  var Global_LastUnknownUidScanned = { key: "Global_LastUnknownUidScanned", fromJson: UidScanned_t.fromJson };
  var Global_ProjectorHeartbeatSignal = { key: "Global_ProjectorHeartbeatSignal", fromJson: ProjectorHeartbeatSignal_t.fromJson };
  var Global_ProjectorHeartbeat = { key: "Global_ProjectorHeartbeat", fromJson: ProjectorHeartbeat_t.fromJson };
  var Global_CurrentMaptasticProjectorPositions = { key: "Global_CurrentMaptasticProjectorPositions", fromJson: MaptasticProjectorPositions_t.fromJson };
  var Global_SavedMaptasticProjectorPositions = { key: "Global_SavedMaptasticProjectorPositions", fromJson: MaptasticProjectorPositions_t.fromJson };
  var Global_InfoWidgetData = { key: "Global_InfoWidgetData", fromJson: TitleAndArtist_t.fromJson };
  var Global_OverlayWidgetData = { key: "Global_OverlayWidgetData", fromJson: OverlayData_t.fromJson };
  var Global_RecordWidgetData = { key: "Global_RecordWidgetData", fromJson: RecordDesignData_t.fromJson };
  var Global_TrackListWidgetData = { key: "Global_TrackListWidgetData", fromJson: TrackListWidgetData_t.fromJson };
  var Global_ProgressWidgetData = { key: "Global_ProgressWidgetData", fromJson: ProgressData_t.fromJson };
  var Global_LyricsWidgetData = { key: "Global_LyricsWidgetData", fromJson: LyricData_t.fromJson };
  var Global_QrCodeWidgetData = { key: "Global_QrCodeWidgetData", fromJson: QrCodeData_t.fromJson };
  var Global_ActiveTrackProgressInSeconds = "Global_ActiveTrackProgressInSeconds";
  var Global_ActiveTrackTotalDurationInSeconds = "Global_ActiveTrackTotalDurationInSeconds";
  var Global_MediaPlaybackState = "Global_MediaPlaybackState";
  var Global_ActiveTrack = { key: "Global_ActiveTrack", fromJson: ActiveTrack_t.fromJson };

  // js/playback_clock.ts
  var PlaybackClock_t = class {
    constructor() {
      this.sourceDataSource = null;
      this.listeners = [];
      this.baseProgressSeconds = 0;
      this.durationSeconds = 0;
      this.playbackState = 2 /* Idle */;
      this.sampledAtMilliseconds = 0;
      this.animationFrameHandle = null;
    }
    nowMilliseconds() {
      if (typeof performance !== "undefined" && performance.now) {
        return performance.now();
      }
      return Date.now();
    }
    clamp(value, min, max) {
      return Math.min(Math.max(value, min), max);
    }
    isPlayingState(state) {
      return Number(state) === 0 /* Playing */;
    }
    projectProgressSeconds(atMilliseconds) {
      const timestamp = atMilliseconds || this.nowMilliseconds();
      let projected = Number(this.baseProgressSeconds || 0);
      if (this.isPlayingState(this.playbackState) && this.sampledAtMilliseconds > 0) {
        projected += Math.max(0, (timestamp - this.sampledAtMilliseconds) / 1e3);
      }
      if (this.durationSeconds > 0) {
        return this.clamp(projected, 0, this.durationSeconds);
      }
      return Math.max(projected, 0);
    }
    emit() {
      const current = this.snapshot();
      this.listeners.forEach((listener) => {
        listener(current);
      });
    }
    stopAnimationLoop() {
      if (this.animationFrameHandle !== null) {
        cancelAnimationFrame(this.animationFrameHandle);
        this.animationFrameHandle = null;
      }
    }
    ensureAnimationLoop() {
      if (!this.isPlayingState(this.playbackState)) {
        this.stopAnimationLoop();
        return;
      }
      if (this.animationFrameHandle !== null) return;
      this.animationFrameHandle = requestAnimationFrame(() => {
        this.animationFrameHandle = null;
        if (!this.isPlayingState(this.playbackState)) {
          return;
        }
        this.emit();
        this.ensureAnimationLoop();
      });
    }
    updateAnchor(nextProgressSeconds) {
      this.baseProgressSeconds = Math.max(0, Number(nextProgressSeconds || 0));
      this.sampledAtMilliseconds = this.nowMilliseconds();
    }
    applyPlaybackState(nextPlaybackState) {
      const projectedNow = this.projectProgressSeconds();
      this.playbackState = Number(nextPlaybackState);
      this.updateAnchor(projectedNow);
      this.emit();
      this.ensureAnimationLoop();
    }
    applyProgressSample(nextProgressSeconds) {
      this.updateAnchor(nextProgressSeconds);
      this.emit();
    }
    applyDuration(nextDurationSeconds) {
      this.durationSeconds = Math.max(0, Number(nextDurationSeconds || 0));
      this.emit();
    }
    snapshot() {
      const progress = this.projectProgressSeconds();
      return {
        progressSeconds: progress,
        durationSeconds: Number(this.durationSeconds || 0),
        playbackState: Number(this.playbackState),
        isPlaying: this.isPlayingState(this.playbackState)
      };
    }
    subscribe(listener) {
      this.listeners.push(listener);
      listener(this.snapshot());
      return () => {
        this.listeners = this.listeners.filter((candidate) => candidate !== listener);
      };
    }
    async init(dataSource) {
      if (this.sourceDataSource === dataSource) {
        return;
      }
      this.sourceDataSource = dataSource;
      this.sourceDataSource.onStateChanged((variable, data) => {
        switch (variable) {
          case Global_MediaPlaybackState:
            this.applyPlaybackState(Number(data));
            break;
          case Global_ActiveTrackProgressInSeconds:
            this.applyProgressSample(Number(data));
            break;
          case Global_ActiveTrackTotalDurationInSeconds:
            this.applyDuration(Number(data));
            break;
        }
      });
      const [initialState, initialProgress, initialDuration] = await Promise.all([
        this.sourceDataSource.read(Global_MediaPlaybackState),
        this.sourceDataSource.read(Global_ActiveTrackProgressInSeconds),
        this.sourceDataSource.read(Global_ActiveTrackTotalDurationInSeconds)
      ]);
      this.playbackState = Number(initialState || 2 /* Idle */);
      this.durationSeconds = Math.max(0, Number(initialDuration || 0));
      this.updateAnchor(Number(initialProgress || 0));
      this.emit();
      this.ensureAnimationLoop();
    }
  };
  var PlaybackClock = new PlaybackClock_t();
})();
