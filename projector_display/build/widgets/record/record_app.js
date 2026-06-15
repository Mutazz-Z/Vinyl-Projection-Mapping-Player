"use strict";
(() => {
  // types/state.ts
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
  var Global_LastKnownUidScanned = { key: "Global_LastKnownUidScanned", fromJson: UidScanned_t.fromJson };
  var Global_LastUnknownUidScanned = { key: "Global_LastUnknownUidScanned", fromJson: UidScanned_t.fromJson };
  var Global_InfoWidgetData = { key: "Global_InfoWidgetData", fromJson: TitleAndArtist_t.fromJson };
  var Global_OverlayWidgetData = { key: "Global_OverlayWidgetData", fromJson: OverlayData_t.fromJson };
  var Global_RecordWidgetData = { key: "Global_RecordWidgetData", fromJson: RecordDesignData_t.fromJson };
  var Global_TrackListWidgetData = { key: "Global_TrackListWidgetData", fromJson: TrackListWidgetData_t.fromJson };
  var Global_ProgressWidgetData = { key: "Global_ProgressWidgetData", fromJson: ProgressData_t.fromJson };
  var Global_LyricsWidgetData = { key: "Global_LyricsWidgetData", fromJson: LyricData_t.fromJson };
  var Global_QrCodeWidgetData = { key: "Global_QrCodeWidgetData", fromJson: QrCodeData_t.fromJson };
  var Global_ActiveTrack = { key: "Global_ActiveTrack", fromJson: ActiveTrack_t.fromJson };

  // widgets/record/record_app.ts
  (function() {
    const RECORD_SLIDE_MS_FOR_SPIN = 700;
    const TRACKLIST_FADE_MS_FOR_STAGGER = 220;
    let pendingRevealTimer = null;
    let pendingStopCleanupTimer = null;
    let currentDesignData = {};
    let designApplyToken = 0;
    function getRecord() {
      return document.getElementById("record");
    }
    function getRecordContainer() {
      const record = getRecord();
      return record ? record.closest(".record-container") : null;
    }
    function setSpinState(state) {
      const record = getRecord();
      if (record) record.style.animationPlayState = state;
    }
    function show(input) {
      const config = input && typeof input === "object" ? input : {};
      if (Object.prototype.hasOwnProperty.call(config, "playbackState")) {
        consumePlaybackState(Number(config.playbackState));
      }
      if (config.prepareForPlayback === true) {
        resetForNewPlayback();
      }
      if (config.revealForPlayback) {
        const revealConfig = config.revealForPlayback;
        cancelPendingTransitions();
        resetRecord();
        const timers = revealRecordAndTracklistWithStaggeredSpin(
          revealConfig.token,
          revealConfig.getPlaybackToken,
          revealConfig.onReadyForCarousel
        );
        if (timers) {
          pendingRevealTimer = timers.staggerTimer || null;
        }
        return;
      }
      if (config.visible === false) {
        return;
      }
      const recordContainer = getRecordContainer();
      if (!recordContainer) return;
      recordContainer.style.display = "";
      recordContainer.classList.add("visible");
    }
    function hide(options) {
      const config = options && typeof options === "object" ? options : {};
      if (config.cancelPendingTransitions === true) {
        cancelPendingTransitions();
      }
      if (config.beginStop) {
        const stopConfig = config.beginStop;
        pauseSpin();
        if (pendingRevealTimer) {
          clearTimeout(pendingRevealTimer);
          pendingRevealTimer = null;
        }
        if (pendingStopCleanupTimer) {
          clearTimeout(pendingStopCleanupTimer);
          pendingStopCleanupTimer = null;
        }
        if (!stopConfig.isError) {
          pendingStopCleanupTimer = hideRecordContainerWithCleanup(
            stopConfig.token,
            stopConfig.getPlaybackToken,
            stopConfig.delayMs
          );
          return pendingStopCleanupTimer;
        }
        const errorRecordContainer = getRecordContainer();
        if (errorRecordContainer) {
          errorRecordContainer.classList.remove("visible");
        }
        return null;
      }
      if (config.resetForNewPlayback === true) {
        resetForNewPlayback();
        return;
      }
      if (config.visible === false) {
        return;
      }
      const recordContainer = getRecordContainer();
      if (!recordContainer) return;
      recordContainer.classList.remove("visible");
      recordContainer.style.display = "none";
    }
    function play() {
      setSpinState("running");
    }
    function pause() {
      setSpinState("paused");
    }
    function applyLayerStyle(targetElement, imageUrl, color, fallbackColor) {
      if (!targetElement) return;
      if (imageUrl) {
        const safeUrl = String(imageUrl).replace(/"/g, '\\"');
        targetElement.style.backgroundImage = 'url("' + safeUrl + '")';
      } else {
        targetElement.style.backgroundImage = "none";
      }
      if (color) {
        targetElement.style.backgroundColor = color;
      } else if (fallbackColor) {
        targetElement.style.backgroundColor = fallbackColor;
      } else {
        targetElement.style.removeProperty("background-color");
      }
    }
    function applyDesignData(designData) {
      const safeDesignData = designData || {};
      const record = getRecord();
      if (record) {
        applyLayerStyle(record, safeDesignData.outer_design_image, safeDesignData.outer_design_color, void 0);
      }
      const recordLabel = document.querySelector(".record-label");
      if (recordLabel) {
        applyLayerStyle(recordLabel, safeDesignData.inner_record_image, safeDesignData.inner_record_color, "#2a2a2a");
      }
    }
    function clearDesignData() {
      const record = getRecord();
      if (record) {
        record.style.removeProperty("background-image");
        record.style.removeProperty("background-color");
      }
      const recordLabel = document.querySelector(".record-label");
      if (recordLabel) {
        recordLabel.style.removeProperty("background-image");
        recordLabel.style.removeProperty("background-color");
      }
    }
    function ejectRecord() {
      const recordContainer = getRecordContainer();
      if (!recordContainer) return;
      applyDesignData(currentDesignData);
      const widgetSlot = recordContainer.parentElement;
      if (widgetSlot) {
        widgetSlot.style.overflow = "visible";
        widgetSlot.style.clipPath = "inset(-100px -1000px -100px 0)";
      }
      recordContainer.style.display = "block";
      void recordContainer.offsetWidth;
      recordContainer.classList.add("error-eject");
    }
    function resetRecord() {
      const recordContainer = getRecordContainer();
      if (!recordContainer) return;
      recordContainer.classList.remove("error-eject");
      const widgetSlot = recordContainer.parentElement;
      if (widgetSlot) {
        widgetSlot.style.removeProperty("overflow");
        widgetSlot.style.removeProperty("clip-path");
      }
    }
    function consumePlaybackState(state) {
      const numeric = Number(state);
      if (numeric === 0 /* Playing */) {
        play();
      } else {
        pause();
      }
    }
    function cancelPendingTransitions() {
      if (pendingRevealTimer) {
        clearTimeout(pendingRevealTimer);
        pendingRevealTimer = null;
      }
      if (pendingStopCleanupTimer) {
        clearTimeout(pendingStopCleanupTimer);
        pendingStopCleanupTimer = null;
      }
    }
    function mapRecordDesignData(recordDesignData) {
      const usesLabelImage = recordDesignData.labelDesign?.usesImage === true;
      const usesRingImage = recordDesignData.ringDesign?.usesImage === true;
      return {
        labelColor: usesLabelImage ? "" : recordDesignData.labelDesign?.labelColor || "",
        labelImage: usesLabelImage ? recordDesignData.labelDesign?.labelImage || "" : "",
        outerRingColor: usesRingImage ? "" : recordDesignData.ringDesign?.ringColor || "",
        outerRingImage: usesRingImage ? recordDesignData.ringDesign?.ringImage || "" : "",
        inner_record_color: usesLabelImage ? "" : recordDesignData.labelDesign?.labelColor || "",
        inner_record_image: usesLabelImage ? recordDesignData.labelDesign?.labelImage || "" : "",
        outer_design_color: usesRingImage ? "" : recordDesignData.ringDesign?.ringColor || "",
        outer_design_image: usesRingImage ? recordDesignData.ringDesign?.ringImage || "" : ""
      };
    }
    function applyDesignToWidgets(designData) {
      if (!designData || !Object.values(designData).some(Boolean)) return;
      const token = ++designApplyToken;
      currentDesignData = designData;
      if (token !== designApplyToken) return;
      applyDesignData(designData);
    }
    function updateData(recordDesignData) {
      const mappedDesignData = mapRecordDesignData(recordDesignData);
      applyDesignToWidgets(mappedDesignData);
    }
    function hideRecordContainerWithCleanup(guardToken, getPlaybackToken, delayMs) {
      const recordContainer = getRecordContainer();
      if (!recordContainer) return null;
      recordContainer.classList.remove("visible");
      const cleanupTimer = setTimeout(function() {
        if (guardToken !== getPlaybackToken()) return;
        recordContainer.style.display = "none";
        clearDesignData();
        currentDesignData = {};
      }, delayMs);
      return cleanupTimer;
    }
    function pauseSpin() {
      const recordElement = getRecord();
      if (recordElement) pause();
    }
    function resetForNewPlayback() {
      resetRecord();
      const recordContainer = getRecordContainer();
      if (recordContainer) {
        recordContainer.classList.remove("visible");
        recordContainer.style.display = "none";
      }
      pauseSpin();
    }
    function revealRecordAndTracklistWithStaggeredSpin(guardToken, getPlaybackToken, onReadyForCarousel) {
      const recordContainer = getRecordContainer();
      if (!recordContainer) {
        if (onReadyForCarousel) onReadyForCarousel();
        return { staggerTimer: null };
      }
      recordContainer.style.display = "";
      void recordContainer.offsetWidth;
      const staggerTimer = setTimeout(function() {
        if (guardToken !== getPlaybackToken()) return;
        recordContainer.classList.add("visible");
        if (onReadyForCarousel) onReadyForCarousel();
        setTimeout(function() {
          if (guardToken !== getPlaybackToken()) return;
          play();
        }, RECORD_SLIDE_MS_FOR_SPIN);
      }, TRACKLIST_FADE_MS_FOR_STAGGER);
      return { staggerTimer };
    }
    window.RecordWidget = {
      show,
      hide,
      updateData,
      play,
      pause,
      ejectRecord
    };
  })();
})();
