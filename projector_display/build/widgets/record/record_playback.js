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
  var Global_RecordWidgetState = "Global_RecordWidgetState";
  var Global_TrackListWidgetData = { key: "Global_TrackListWidgetData", fromJson: TrackListWidgetData_t.fromJson };
  var Global_ProgressWidgetData = { key: "Global_ProgressWidgetData", fromJson: ProgressData_t.fromJson };
  var Global_LyricsWidgetData = { key: "Global_LyricsWidgetData", fromJson: LyricData_t.fromJson };
  var Global_QrCodeWidgetData = { key: "Global_QrCodeWidgetData", fromJson: QrCodeData_t.fromJson };
  var Global_MediaPlaybackState = "Global_MediaPlaybackState";
  var Global_ActiveTrack = { key: "Global_ActiveTrack", fromJson: ActiveTrack_t.fromJson };

  // widgets/record/record_app.ts
  var RecordWidget_t = class {
    constructor() {
      this.RECORD_SLIDE_MS = 700;
      this.currentDesignData = RecordDesignData_t.fromJson({});
      this.hideCleanupTimer = null;
    }
    getRecord() {
      return document.getElementById("record");
    }
    getRecordContainer() {
      const record = this.getRecord();
      return record.closest(".record-container");
    }
    setSpinState(state) {
      const record = this.getRecord();
      if (record) record.style.animationPlayState = state;
    }
    applyLayerStyle(targetElement, value, isImage, fallbackColor) {
      if (isImage) {
        const safeUrl = String(value).replace(/"/g, '\\"');
        targetElement.style.backgroundImage = 'url("' + safeUrl + '")';
        targetElement.style.removeProperty("background-color");
      } else {
        targetElement.style.backgroundImage = "none";
        if (value) {
          targetElement.style.backgroundColor = value;
        } else if (fallbackColor) {
          targetElement.style.backgroundColor = fallbackColor;
        } else {
          targetElement.style.removeProperty("background-color");
        }
      }
    }
    applyDesignData(designData) {
      const labelDesign = designData.labelDesign;
      const ringDesign = designData.ringDesign;
      const label = labelDesign.usesImage ? labelDesign.labelImage : labelDesign.labelColor;
      const ring = ringDesign.usesImage ? ringDesign.ringImage : ringDesign.ringColor;
      const record = this.getRecord();
      this.applyLayerStyle(record, ring, ringDesign.usesImage, "#ffffff");
      const recordLabel = document.querySelector(".record-label");
      this.applyLayerStyle(recordLabel, label, labelDesign.usesImage, "#2a2a2a");
    }
    applyDesignToWidgets(designData) {
      if (!designData.readyForDisplay) return;
      this.currentDesignData = designData;
      this.applyDesignData(designData);
    }
    updateData(recordDesignData) {
      this.applyDesignToWidgets(recordDesignData);
    }
    show() {
      const recordContainer = this.getRecordContainer();
      if (!recordContainer) return;
      if (this.hideCleanupTimer) {
        clearTimeout(this.hideCleanupTimer);
        this.hideCleanupTimer = null;
      }
      recordContainer.style.display = "";
      void recordContainer.offsetWidth;
      recordContainer.classList.add("visible");
    }
    hide() {
      const recordContainer = this.getRecordContainer();
      if (this.hideCleanupTimer) {
        clearTimeout(this.hideCleanupTimer);
        this.hideCleanupTimer = null;
      }
      const widgetSlot = recordContainer.parentElement;
      if (widgetSlot) {
        widgetSlot.style.removeProperty("overflow");
        widgetSlot.style.removeProperty("clip-path");
      }
      recordContainer.classList.remove("error-eject");
      recordContainer.classList.remove("visible");
      this.hideCleanupTimer = setTimeout(() => {
        if (!recordContainer.classList.contains("visible") && !recordContainer.classList.contains("error-eject")) {
          recordContainer.style.display = "none";
        }
        this.hideCleanupTimer = null;
      }, this.RECORD_SLIDE_MS);
    }
    play() {
      this.setSpinState("running");
    }
    pause() {
      this.setSpinState("paused");
    }
    ejectRecord() {
      const recordContainer = this.getRecordContainer();
      if (!recordContainer) return;
      this.applyDesignData(this.currentDesignData);
      const widgetSlot = recordContainer.parentElement;
      if (widgetSlot) {
        widgetSlot.style.overflow = "visible";
        widgetSlot.style.clipPath = "inset(-100px -1000px -100px 0)";
      }
      recordContainer.style.display = "block";
      void recordContainer.offsetWidth;
      recordContainer.classList.add("error-eject");
    }
  };
  var RecordWidget = new RecordWidget_t();

  // widgets/record/record_playback.ts
  var RecordWidgetPlayback_t = class {
    applyData(data) {
      RecordWidget.updateData(RecordDesignData_t.fromJson(data));
    }
    applyState(state) {
      const numericState = Number(state);
      switch (numericState) {
        case 1 /* Show */:
          RecordWidget.show();
          return;
        case 0 /* Hide */:
          RecordWidget.hide();
          return;
        case 2 /* Pause */:
          RecordWidget.pause();
          return;
        case 3 /* Resume */:
          RecordWidget.play();
          return;
        case 6 /* EjectRecord */:
          RecordWidget.ejectRecord();
          return;
      }
    }
    applyPlaybackState(state) {
      if (Number(state) === 0 /* Playing */) {
        RecordWidget.play();
        return;
      }
      RecordWidget.pause();
    }
    async init(dataSource) {
      dataSource.onStateChanged((variable, data) => {
        const globalVariable = variable;
        switch (globalVariable) {
          case Global_RecordWidgetData.key:
            this.applyData(data);
            break;
          case Global_RecordWidgetState:
            this.applyState(data);
            break;
          case Global_MediaPlaybackState:
            this.applyPlaybackState(data);
            break;
        }
      });
      const currentData = await dataSource.read(Global_RecordWidgetData.key);
      this.applyData(currentData);
      const currentState = await dataSource.read(Global_RecordWidgetState);
      this.applyState(currentState);
      const currentPlaybackState = await dataSource.read(Global_MediaPlaybackState);
      this.applyPlaybackState(currentPlaybackState);
    }
  };
  var RecordWidgetPlayback = new RecordWidgetPlayback_t();
})();
