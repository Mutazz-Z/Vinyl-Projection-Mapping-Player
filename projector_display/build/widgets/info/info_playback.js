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
  var Global_InfoWidgetState = "Global_InfoWidgetState";
  var Global_OverlayWidgetData = { key: "Global_OverlayWidgetData", fromJson: OverlayData_t.fromJson };
  var Global_RecordWidgetData = { key: "Global_RecordWidgetData", fromJson: RecordDesignData_t.fromJson };
  var Global_TrackListWidgetData = { key: "Global_TrackListWidgetData", fromJson: TrackListWidgetData_t.fromJson };
  var Global_ProgressWidgetData = { key: "Global_ProgressWidgetData", fromJson: ProgressData_t.fromJson };
  var Global_LyricsWidgetData = { key: "Global_LyricsWidgetData", fromJson: LyricData_t.fromJson };
  var Global_QrCodeWidgetData = { key: "Global_QrCodeWidgetData", fromJson: QrCodeData_t.fromJson };
  var Global_ActiveTrack = { key: "Global_ActiveTrack", fromJson: ActiveTrack_t.fromJson };

  // widgets/info/info_app.ts
  var InfoWidget = class {
    constructor() {
      this._private = {
        pendingTransitionCleanupFunction: null,
        resizeTimerIdentifier: void 0
      };
      window.addEventListener("resize", () => {
        clearTimeout(this._private.resizeTimerIdentifier);
        this._private.resizeTimerIdentifier = setTimeout(() => this.updateLayout(), 100);
      });
    }
    getContainer() {
      return document.querySelector("#info-widget .info-container");
    }
    getTitleElement() {
      return document.getElementById("album-title");
    }
    getArtistElement() {
      return document.getElementById("artist-name");
    }
    getTitleWrapper() {
      return document.getElementById("title-wrap");
    }
    getArtistWrapper() {
      return document.getElementById("artist-wrap");
    }
    resetMarquee(element) {
      element.classList.remove("marquee");
      if (element.dataset.originalText !== void 0) {
        element.textContent = element.dataset.originalText;
        delete element.dataset.originalText;
      }
    }
    applyMarquee(element) {
      const textContent = element.textContent;
      element.dataset.originalText = textContent;
      element.innerHTML = "";
      const firstTextSpan = document.createElement("span");
      firstTextSpan.textContent = textContent;
      const spacerSpan = document.createElement("span");
      spacerSpan.className = "spacer";
      const secondTextSpan = document.createElement("span");
      secondTextSpan.textContent = textContent;
      element.appendChild(firstTextSpan);
      element.appendChild(spacerSpan);
      element.appendChild(secondTextSpan);
      element.classList.add("marquee");
    }
    updateLayout() {
      const container = this.getContainer();
      const titleElement = this.getTitleElement();
      const titleWrapper = this.getTitleWrapper();
      const artistWrapper = this.getArtistWrapper();
      container.style.setProperty("--scale", "1");
      titleWrapper.style.width = "auto";
      titleWrapper.style.flex = "none";
      artistWrapper.style.width = "auto";
      artistWrapper.style.flex = "none";
      this.resetMarquee(titleElement);
      void container.offsetHeight;
      const rawTitleWidth = titleElement.scrollWidth;
      const rawArtistWidth = artistWrapper.scrollWidth;
      const availableWidth = container.clientWidth - 8;
      if (rawTitleWidth === 0 && rawArtistWidth === 0) {
        return;
      }
      const actualGap = rawTitleWidth > 0 && rawArtistWidth > 0 ? 20 : 0;
      const totalContentWidth = rawTitleWidth + rawArtistWidth + actualGap;
      const scaleAmount = Math.max(0.8, Math.min(1.2, availableWidth / totalContentWidth));
      const scaledArtistWidth = Math.ceil(rawArtistWidth * scaleAmount);
      const scaledTitleTextWidth = Math.ceil(rawTitleWidth * scaleAmount);
      const maxTitleBoxWidth = Math.floor(availableWidth - scaledArtistWidth - actualGap);
      container.style.setProperty("--scale", String(scaleAmount));
      artistWrapper.style.width = scaledArtistWidth + "px";
      artistWrapper.style.flex = "0 0 " + scaledArtistWidth + "px";
      titleWrapper.style.width = maxTitleBoxWidth + "px";
      titleWrapper.style.flex = "0 0 " + maxTitleBoxWidth + "px";
      if (scaledTitleTextWidth > maxTitleBoxWidth + 2) {
        this.applyMarquee(titleElement);
      }
    }
    setText(album, artist) {
      const albumTitle = this.getTitleElement();
      const artistName = this.getArtistElement();
      this.resetMarquee(albumTitle);
      albumTitle.textContent = album;
      artistName.textContent = artist;
      this.updateLayout();
    }
    show() {
      const container = this.getContainer();
      if (this._private.pendingTransitionCleanupFunction) {
        this._private.pendingTransitionCleanupFunction();
        this._private.pendingTransitionCleanupFunction = null;
      }
      container.classList.remove("hiding");
      if (!container.classList.contains("visible")) {
        requestAnimationFrame(() => {
          container.classList.add("visible");
        });
      }
    }
    hide() {
      const container = this.getContainer();
      if (container.classList.contains("hiding")) {
        return;
      }
      if (this._private.pendingTransitionCleanupFunction) {
        this._private.pendingTransitionCleanupFunction();
        this._private.pendingTransitionCleanupFunction = null;
      }
      const transitionEndCallback = (event) => {
        const transitionEvent = event;
        if (transitionEvent.target !== container) {
          return;
        }
        if (transitionEvent.propertyName !== "transform") {
          return;
        }
        container.classList.remove("hiding");
        container.removeEventListener("transitionend", transitionEndCallback);
        if (this._private.pendingTransitionCleanupFunction === cleanupFunction) {
          this._private.pendingTransitionCleanupFunction = null;
        }
      };
      const cleanupFunction = () => {
        container.removeEventListener("transitionend", transitionEndCallback);
        container.classList.remove("hiding");
      };
      this._private.pendingTransitionCleanupFunction = cleanupFunction;
      container.addEventListener("transitionend", transitionEndCallback);
      container.classList.remove("hiding");
      container.classList.add("visible");
      void container.offsetHeight;
      requestAnimationFrame(() => {
        container.classList.add("hiding");
        container.classList.remove("visible");
      });
    }
    updateData(albumInfo) {
      if (!albumInfo.title && !albumInfo.artist) {
        return;
      }
      this.setText(albumInfo.title, albumInfo.artist);
    }
  };
  var infoWidget = new InfoWidget();

  // widgets/info/info_playback.ts
  var InfoWidgetPlayback_t = class {
    applyData(data) {
      infoWidget.updateData(data);
    }
    applyState(state) {
      switch (state) {
        case 1 /* Show */:
          infoWidget.show();
          break;
        case 0 /* Hide */:
          infoWidget.hide();
          break;
      }
    }
    async init(dataSource) {
      dataSource.onStateChanged((variable, data) => {
        switch (variable) {
          case Global_InfoWidgetData.key:
            this.applyData(data);
            break;
          case Global_InfoWidgetState:
            this.applyState(data);
            break;
        }
      });
      const currentData = await dataSource.read(Global_InfoWidgetData.key);
      this.applyData(currentData);
      const currentState = await dataSource.read(Global_InfoWidgetState);
      this.applyState(currentState);
    }
  };
  var InfoWidgetPlayback = new InfoWidgetPlayback_t();
})();
