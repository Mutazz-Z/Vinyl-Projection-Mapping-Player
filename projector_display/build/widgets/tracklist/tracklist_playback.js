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
  var Global_TrackListWidgetState = "Global_TrackListWidgetState";
  var Global_ProgressWidgetData = { key: "Global_ProgressWidgetData", fromJson: ProgressData_t.fromJson };
  var Global_LyricsWidgetData = { key: "Global_LyricsWidgetData", fromJson: LyricData_t.fromJson };
  var Global_QrCodeWidgetData = { key: "Global_QrCodeWidgetData", fromJson: QrCodeData_t.fromJson };
  var Global_ActiveTrack = { key: "Global_ActiveTrack", fromJson: ActiveTrack_t.fromJson };

  // js/track_resolver.ts
  var TrackResolver_t = class {
    constructor() {
      this.trackNames = [];
      this.activeTrackIndex = 0;
      this.lyricsByNormalizedTrackName = {};
    }
    normalizeTrackName(trackName) {
      return trackName.trim().toLowerCase();
    }
    clampTrackIndex(trackIndex) {
      if (this.trackNames.length === 0) return 0;
      const numericTrackIndex = Number(trackIndex);
      if (Number.isNaN(numericTrackIndex)) return this.activeTrackIndex;
      if (numericTrackIndex < 0) return 0;
      if (numericTrackIndex >= this.trackNames.length) return this.trackNames.length - 1;
      return Math.floor(numericTrackIndex);
    }
    buildLyricsLookupFromTrackList(trackList) {
      this.lyricsByNormalizedTrackName = {};
      trackList.forEach((trackListEntry) => {
        this.lyricsByNormalizedTrackName[this.normalizeTrackName(trackListEntry.track)] = trackListEntry.lyrics;
      });
    }
    getLyricsByTrackIndex(trackIndex) {
      if (this.trackNames.length === 0) return null;
      const resolvedTrackName = this.trackNames[this.clampTrackIndex(trackIndex)];
      return this.lyricsByNormalizedTrackName[this.normalizeTrackName(resolvedTrackName)] || null;
    }
    setTrackNames(trackNames) {
      this.trackNames = trackNames;
    }
    setActiveTrackIndex(trackIndex) {
      this.activeTrackIndex = this.clampTrackIndex(trackIndex);
    }
    getTrackNames() {
      return this.trackNames;
    }
    clear() {
      this.trackNames = [];
      this.activeTrackIndex = 0;
      this.lyricsByNormalizedTrackName = {};
    }
    clearTrackPositionOnly() {
      this.activeTrackIndex = 0;
    }
  };
  var TrackResolver = new TrackResolver_t();

  // widgets/tracklist/tracklist_app.ts
  var TracklistWidget_t = class {
    constructor() {
      this.transitionToken = 0;
      this.currentActiveIndex = 0;
      this.uiTracks = [];
      this.renderedTrackSignature = "";
      this.pendingTransitionCleanup = null;
    }
    getContainer() {
      return document.querySelector("#tracklist-widget .tracklist-container");
    }
    renderTracklist(tracks) {
      const container = document.getElementById("tracklist-arc");
      if (!container) return;
      container.innerHTML = "";
      this.currentActiveIndex = 0;
      this.uiTracks = [];
      for (const trackItem of tracks) {
        const trackName = trackItem.track || "";
        if (!trackName) continue;
        const trackElement = document.createElement("div");
        trackElement.className = "track-item";
        trackElement.textContent = trackName;
        container.appendChild(trackElement);
        this.uiTracks.push({ name: trackName, element: trackElement });
      }
      this.renderedTrackSignature = tracks.map((t) => `${t.trackIndex}:${t.track}`).join("|");
    }
    setLinearLayout() {
      if (this.uiTracks.length === 0) return;
      const anchorIndex = this.currentActiveIndex || 0;
      const yStep = 58;
      this.uiTracks.forEach((track, index) => {
        const trackElement = track.element;
        if (!trackElement) return;
        const offset = index - anchorIndex;
        const y = offset * yStep;
        trackElement.classList.toggle("active", offset === 0);
        let opacity = 0;
        if (Math.abs(offset) === 0) opacity = 1;
        else if (Math.abs(offset) === 1) opacity = 0.45;
        else if (Math.abs(offset) === 2) opacity = 0.1;
        trackElement.style.opacity = String(opacity);
        trackElement.style.transform = `translate(0px, calc(${y}px - 50%)) scale(${offset === 0 ? 1.12 : 1})`;
      });
    }
    updateArcCarousel(activeIndex) {
      if (this.uiTracks.length === 0) return;
      const container = this.getContainer();
      if (container && !container.classList.contains("carousel")) {
        const newIndex = Number(activeIndex);
        if (!Number.isNaN(newIndex)) this.currentActiveIndex = newIndex;
        this.setLinearLayout();
        return;
      }
      const safeIndex = Number(activeIndex);
      if (!Number.isNaN(safeIndex)) this.currentActiveIndex = safeIndex;
      const TEXT_GAP = 40;
      const ARC_RADIUS = 250;
      const ANGLE_STEP = 0.35;
      this.uiTracks.forEach((track, index) => {
        const trackElement = track.element;
        if (!trackElement) return;
        const offset = index - this.currentActiveIndex;
        if (Math.abs(offset) > 2) {
          trackElement.style.opacity = "0";
          const yDir = offset > 0 ? 300 : -300;
          trackElement.style.transform = `translate(${TEXT_GAP}px, ${yDir}px) scale(0.5)`;
          trackElement.classList.remove("active");
          return;
        }
        const angle = offset * ANGLE_STEP;
        const x = Math.cos(angle) * ARC_RADIUS - ARC_RADIUS + TEXT_GAP;
        const y = Math.sin(angle) * ARC_RADIUS;
        const scale = offset === 0 ? 1.3 : 1 - Math.abs(offset) * 0.15;
        const opacity = offset === 0 ? 1 : 0.6 - Math.abs(offset) * 0.25;
        trackElement.classList.toggle("active", offset === 0);
        trackElement.style.opacity = String(opacity);
        trackElement.style.transform = `translate(${x}px, calc(${y}px - 50%)) scale(${scale})`;
      });
    }
    cancelPendingTransitions() {
      if (this.pendingTransitionCleanup) {
        this.pendingTransitionCleanup();
        this.pendingTransitionCleanup = null;
      }
    }
    clear() {
      const container = document.getElementById("tracklist-arc");
      if (container) container.innerHTML = "";
      this.uiTracks = [];
      this.renderedTrackSignature = "";
      this.cancelPendingTransitions();
    }
    show() {
      ++this.transitionToken;
      this.cancelPendingTransitions();
      const container = this.getContainer();
      if (!container) return;
      container.classList.remove("hiding");
      container.classList.add("visible");
      container.classList.add("carousel");
      this.updateArcCarousel(this.currentActiveIndex);
    }
    hide() {
      const guardToken = ++this.transitionToken;
      this.cancelPendingTransitions();
      const container = this.getContainer();
      if (!container) {
        this.clear();
        TrackResolver.clear();
        return;
      }
      container.classList.remove("carousel");
      container.classList.add("visible");
      this.setLinearLayout();
      const onTransitionEnd = (event) => {
        const transitionEvent = event;
        if (transitionEvent.target !== container) return;
        if (transitionEvent.propertyName !== "opacity") return;
        if (guardToken !== this.transitionToken) return;
        container.classList.remove("hiding");
        container.removeEventListener("transitionend", onTransitionEnd);
        if (this.pendingTransitionCleanup === cleanup) {
          this.pendingTransitionCleanup = null;
        }
        this.clear();
        TrackResolver.clear();
      };
      const cleanup = () => {
        container.removeEventListener("transitionend", onTransitionEnd);
        container.classList.remove("hiding");
      };
      this.pendingTransitionCleanup = cleanup;
      container.addEventListener("transitionend", onTransitionEnd);
      container.classList.remove("carousel");
      container.classList.add("visible");
      void container.offsetHeight;
      requestAnimationFrame(() => {
        container.classList.add("hiding");
        container.classList.remove("visible");
        container.classList.remove("carousel");
      });
    }
    updateData(data) {
      const tracks = data.tracks || [];
      if (tracks.length === 0) return;
      this.cancelPendingTransitions();
      const nextSignature = tracks.map((t) => `${t.trackIndex}:${t.track}`).join("|");
      if (nextSignature !== this.renderedTrackSignature) {
        this.renderTracklist(tracks);
      }
      TrackResolver.setTrackNames(tracks.map((t) => t.track));
      const incomingIndex = Number(data.currentPlayingIndex ?? 0);
      const safeIndex = Number.isNaN(incomingIndex) ? 0 : Math.floor(incomingIndex);
      this.currentActiveIndex = Math.max(0, Math.min(tracks.length - 1, safeIndex));
      this.updateArcCarousel(this.currentActiveIndex);
    }
  };
  var TracklistWidget = new TracklistWidget_t();

  // widgets/tracklist/tracklist_playback.ts
  var TracklistWidgetPlayback_t = class {
    applyData(data) {
      TracklistWidget.updateData(data);
    }
    applyState(state) {
      switch (Number(state)) {
        case 1 /* Show */:
          TracklistWidget.show();
          return;
        case 0 /* Hide */:
          TracklistWidget.hide();
          return;
      }
    }
    async init(dataSource) {
      dataSource.onStateChanged((variable, data) => {
        switch (variable) {
          case Global_TrackListWidgetData.key:
            this.applyData(data);
            break;
          case Global_TrackListWidgetState:
            this.applyState(data);
            break;
        }
      });
      const currentData = await dataSource.read(Global_TrackListWidgetData.key);
      this.applyData(currentData);
      const currentState = await dataSource.read(Global_TrackListWidgetState);
      this.applyState(currentState);
    }
  };
  var TracklistWidgetPlayback = new TracklistWidgetPlayback_t();
})();
