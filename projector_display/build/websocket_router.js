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
  var Global_ProjectorHeartbeatSignal = "Global_ProjectorHeartbeatSignal";
  var Global_DefinedProjectorErrorMessage = "Global_DefinedProjectorErrorMessage";
  var Global_ProjectorHeartbeat = "Global_ProjectorHeartbeat";
  var Global_CurrentMaptasticProjectorPositions = "Global_CurrentMaptasticProjectorPositions";
  var Global_LoadingWidgetState = "Global_LoadingWidgetState";
  var Global_InfoWidgetData = { key: "Global_InfoWidgetData", fromJson: TitleAndArtist_t.fromJson };
  var Global_InfoWidgetState = "Global_InfoWidgetState";
  var Global_OverlayWidgetData = { key: "Global_OverlayWidgetData", fromJson: OverlayData_t.fromJson };
  var Global_OverlayWidgetState = "Global_OverlayWidgetState";
  var Global_RecordWidgetData = { key: "Global_RecordWidgetData", fromJson: RecordDesignData_t.fromJson };
  var Global_RecordWidgetState = "Global_RecordWidgetState";
  var Global_TrackListWidgetData = { key: "Global_TrackListWidgetData", fromJson: TrackListWidgetData_t.fromJson };
  var Global_TrackListWidgetState = "Global_TrackListWidgetState";
  var Global_ProgressWidgetData = { key: "Global_ProgressWidgetData", fromJson: ProgressData_t.fromJson };
  var Global_ProgressWidgetState = "Global_ProgressWidgetState";
  var Global_LyricsWidgetData = { key: "Global_LyricsWidgetData", fromJson: LyricData_t.fromJson };
  var Global_LyricsWidgetState = "Global_LyricsWidgetState";
  var Global_VisualizerWidgetState = "Global_VisualizerWidgetState";
  var Global_QrCodeWidgetData = { key: "Global_QrCodeWidgetData", fromJson: QrCodeData_t.fromJson };
  var Global_QrCodeWidgetState = "Global_QrCodeWidgetState";
  var Global_PlaybackErrorMessageState = "Global_PlaybackErrorMessageState";
  var Global_ActiveTrackProgressInSeconds = "Global_ActiveTrackProgressInSeconds";
  var Global_ActiveTrackTotalDurationInSeconds = "Global_ActiveTrackTotalDurationInSeconds";
  var Global_MediaPlaybackState = "Global_MediaPlaybackState";
  var Global_ActiveTrack = { key: "Global_ActiveTrack", fromJson: ActiveTrack_t.fromJson };

  // js/mapping.ts
  var LAYOUT_LOCALSTORAGE_KEY = "vinylProjectionLayout";
  var LAYOUT_LOCALSTORAGE_BACKUP_KEY = "vinylProjectionLayoutBackup";
  var saveToDbTimer = null;
  function readLocalStorageJson(key) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch (error) {
      console.warn(`mapping.js: failed to parse localStorage["${key}"]`, error);
      return null;
    }
  }
  function saveLayout() {
    if (!maptastic || typeof maptastic.getLayout !== "function") return;
    const layout = maptastic.getLayout();
    if (!layout) return;
    const layoutJson = JSON.stringify(layout);
    localStorage.setItem(LAYOUT_LOCALSTORAGE_KEY, layoutJson);
    localStorage.setItem(LAYOUT_LOCALSTORAGE_BACKUP_KEY, layoutJson);
    if (saveToDbTimer) {
      clearTimeout(saveToDbTimer);
    }
    saveToDbTimer = setTimeout(function() {
      if (window.AppDataSource) {
        window.AppDataSource.write(Global_CurrentMaptasticProjectorPositions, layoutJson);
      }
    }, 800);
  }
  async function restoreLayout() {
    if (!maptastic || typeof maptastic.setLayout !== "function") return;
    let layout = null;
    try {
      if (window.AppDataSource) {
        const storedValue = await window.AppDataSource.read(Global_CurrentMaptasticProjectorPositions);
        if (storedValue) {
          layout = typeof storedValue === "string" ? JSON.parse(storedValue) : storedValue;
        }
      }
    } catch (error) {
      console.warn("mapping.js: could not read layout from DataSource, falling back to localStorage", error);
    }
    if (!layout) {
      layout = readLocalStorageJson(LAYOUT_LOCALSTORAGE_KEY) || readLocalStorageJson(LAYOUT_LOCALSTORAGE_BACKUP_KEY);
    }
    if (layout) {
      maptastic.setLayout(layout);
      window.dispatchEvent(new Event("resize"));
    }
  }
  window.addEventListener("keydown", function(event) {
    const key = event.key.toLowerCase();
    if (key === "m") {
      document.body.classList.toggle("mapping-mode");
      const mappingModeActive = document.body.classList.contains("mapping-mode");
      console.log("Mapping mode:", mappingModeActive ? "ON" : "OFF");
      if (mappingModeActive) saveLayout();
      return;
    }
    if (key === "0") {
      localStorage.clear();
      location.reload();
    }
  });
  var maptastic = Maptastic("projection-group");
  (function waitForDataSourceAndRestore() {
    if (window.AppDataSource) {
      void restoreLayout();
    } else {
      setTimeout(waitForDataSourceAndRestore, 100);
    }
  })();
  setInterval(function() {
    if (document.body.classList.contains("mapping-mode")) {
      saveLayout();
    }
  }, 2e3);
  window.ProjectorMapping = {
    toggleMode: function() {
      document.body.classList.toggle("mapping-mode");
      const mappingModeActive = document.body.classList.contains("mapping-mode");
      console.log("Remote mapping mode:", mappingModeActive ? "ON" : "OFF");
      if (mappingModeActive) saveLayout();
    },
    updateLayout: function(layoutData) {
      if (!maptastic || typeof maptastic.setLayout !== "function") return;
      try {
        const currentLayout = maptastic.getLayout();
        if (currentLayout && currentLayout.length > 0 && layoutData && layoutData.length > 0) {
          const updatedLayout = JSON.parse(JSON.stringify(currentLayout));
          updatedLayout[0].targetPoints = layoutData[0].targetPoints;
          maptastic.setLayout(updatedLayout);
        } else {
          maptastic.setLayout(layoutData);
        }
        window.dispatchEvent(new Event("resize"));
        saveLayout();
        console.log("Remote layout applied successfully.");
      } catch (error) {
        console.error("Failed to apply remote layout:", error);
      }
    }
  };

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

  // widgets/context_message/context_message_app.ts
  var ContextMessageWidget = class {
    getContainer() {
      return document.getElementById("context-message-widget");
    }
    getTextElement() {
      return document.getElementById("context-message-text");
    }
    show() {
      const container = this.getContainer();
      container.classList.add("visible");
    }
    hide() {
      const container = this.getContainer();
      container.classList.remove("visible");
    }
    updateData(message) {
      const textElement = this.getTextElement();
      textElement.textContent = message;
    }
  };
  var contextMessageWidget = new ContextMessageWidget();

  // widgets/context_message/context_message_playback.ts
  var ContextMessageWidgetPlayback_t = class {
    applyData(data) {
      contextMessageWidget.updateData(data);
    }
    applyState(state) {
      switch (state) {
        case 1 /* Show */:
          contextMessageWidget.show();
          break;
        case 0 /* Hide */:
          contextMessageWidget.hide();
          break;
      }
    }
    async init(dataSource) {
      dataSource.onStateChanged((variable, data) => {
        const globalVariable = variable;
        switch (globalVariable) {
          case Global_DefinedProjectorErrorMessage:
            this.applyData(data);
            break;
          case Global_PlaybackErrorMessageState:
            this.applyState(data);
            break;
        }
      });
      const currentData = await dataSource.read(Global_DefinedProjectorErrorMessage);
      this.applyData(currentData);
      const currentState = await dataSource.read(Global_PlaybackErrorMessageState);
      this.applyState(currentState);
    }
  };
  var ContextMessageWidgetPlayback = new ContextMessageWidgetPlayback_t();

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

  // widgets/loading/loading_app.ts
  var LOADING_SCALE = 0.33;
  var HIDE_HOLD_MILLISECONDS = 1e3;
  var LoadingWidget_t = class {
    constructor() {
      this._private = {
        loadingTransitionToken: 0,
        scheduledWaitTimer: null
      };
      this.idle();
    }
    getOutline() {
      return document.getElementById("loading-outline");
    }
    waitForTransition(element, propertyName, timeoutInMilliseconds = 700) {
      return new Promise((resolve) => {
        let isComplete = false;
        const finishTransition = () => {
          if (isComplete) return;
          isComplete = true;
          element.removeEventListener("transitionend", onTransitionEnd);
          resolve();
        };
        const onTransitionEnd = (event) => {
          if (propertyName && event.propertyName !== propertyName) return;
          finishTransition();
        };
        element.addEventListener("transitionend", onTransitionEnd);
        setTimeout(finishTransition, timeoutInMilliseconds);
      });
    }
    freezeCurrentVisualState(outline) {
      const computedStyles = window.getComputedStyle(outline);
      const currentTransform = computedStyles.transform;
      const currentOpacity = computedStyles.opacity;
      const currentBackgroundColor = computedStyles.backgroundColor;
      const currentBorderColor = computedStyles.borderColor;
      outline.style.transition = "none";
      if (currentTransform && currentTransform !== "none") {
        outline.style.transform = currentTransform;
      }
      outline.style.opacity = currentOpacity;
      outline.style.backgroundColor = currentBackgroundColor;
      outline.style.borderColor = currentBorderColor;
      void outline.offsetWidth;
      outline.style.transition = "";
    }
    clearInlineOverrides(outline) {
      outline.style.backgroundColor = "";
      outline.style.borderColor = "";
    }
    show() {
      const outline = this.getOutline();
      this.freezeCurrentVisualState(outline);
      outline.classList.remove("hidden", "pulsing", "error", "error-fill");
      void outline.offsetWidth;
      requestAnimationFrame(() => {
        outline.style.opacity = "1";
        outline.style.transform = "translate(-50%, -50%) scale(1.25)";
        this.clearInlineOverrides(outline);
      });
    }
    beginScanLoading(sequenceToken) {
      const outline = this.getOutline();
      this.freezeCurrentVisualState(outline);
      outline.classList.remove("hidden", "pulsing", "error", "error-fill");
      void outline.offsetWidth;
      requestAnimationFrame(() => {
        outline.style.opacity = "1";
        outline.style.transform = `translate(-50%, -50%) scale(${LOADING_SCALE})`;
        this.clearInlineOverrides(outline);
      });
      return this.waitForTransition(outline, "transform", 560).then(() => {
        if (sequenceToken !== this._private.loadingTransitionToken) return;
        outline.classList.add("pulsing");
      });
    }
    fadeOut(sequenceToken) {
      const outline = this.getOutline();
      this.freezeCurrentVisualState(outline);
      outline.classList.remove("pulsing", "hidden", "error", "error-fill");
      void outline.offsetWidth;
      requestAnimationFrame(() => {
        outline.style.opacity = "0";
        this.clearInlineOverrides(outline);
      });
      return this.waitForTransition(outline, "opacity", 420).then(() => {
        if (sequenceToken !== this._private.loadingTransitionToken) return;
        outline.classList.add("hidden");
      });
    }
    waitDuration(durationInMilliseconds) {
      return new Promise((resolve) => {
        this._private.scheduledWaitTimer = setTimeout(() => {
          this._private.scheduledWaitTimer = null;
          resolve();
        }, durationInMilliseconds);
      });
    }
    expandToOverlay(sequenceToken) {
      const outline = this.getOutline();
      this.freezeCurrentVisualState(outline);
      outline.classList.remove("pulsing", "hidden", "error", "error-fill");
      void outline.offsetWidth;
      requestAnimationFrame(() => {
        outline.style.opacity = "1";
        outline.style.transform = "translate(-50%, -50%) scale(1)";
        this.clearInlineOverrides(outline);
      });
      return this.waitForTransition(outline, "transform", 560).then(() => {
        if (sequenceToken !== this._private.loadingTransitionToken) return;
      });
    }
    cancelScheduledTransitions() {
      if (this._private.scheduledWaitTimer) {
        clearTimeout(this._private.scheduledWaitTimer);
        this._private.scheduledWaitTimer = null;
      }
    }
    showError(sequenceToken) {
      const outline = this.getOutline();
      this.freezeCurrentVisualState(outline);
      outline.classList.remove("pulsing", "hidden", "error", "error-fill");
      void outline.offsetWidth;
      requestAnimationFrame(() => {
        outline.style.opacity = "1";
        outline.classList.add("error-fill");
        this.clearInlineOverrides(outline);
      });
      return this.waitForTransition(outline, "transform", 420).then(() => {
        if (sequenceToken !== this._private.loadingTransitionToken) return;
      });
    }
    idle() {
      this.cancelScheduledTransitions();
      this._private.loadingTransitionToken++;
      this.show();
    }
    loading() {
      this.cancelScheduledTransitions();
      this._private.loadingTransitionToken++;
      return this.beginScanLoading(this._private.loadingTransitionToken);
    }
    hide() {
      this.cancelScheduledTransitions();
      this._private.loadingTransitionToken++;
      const sequenceToken = this._private.loadingTransitionToken;
      return this.expandToOverlay(sequenceToken).then(() => {
        if (sequenceToken !== this._private.loadingTransitionToken) return;
        return this.waitDuration(HIDE_HOLD_MILLISECONDS);
      }).then(() => {
        if (sequenceToken !== this._private.loadingTransitionToken) return;
        return this.fadeOut(sequenceToken);
      });
    }
    error() {
      this.cancelScheduledTransitions();
      this._private.loadingTransitionToken++;
      return this.showError(this._private.loadingTransitionToken);
    }
  };
  var LoadingWidget = new LoadingWidget_t();

  // widgets/loading/loading_playback.ts
  var LoadingWidgetPlayback_t = class {
    applyState(state) {
      switch (state) {
        case 4 /* Loading */:
          LoadingWidget.loading();
          break;
        case 0 /* Hide */:
          LoadingWidget.hide();
          break;
        case 5 /* Idle */:
          LoadingWidget.idle();
          break;
      }
    }
    async init(dataSource) {
      dataSource.onStateChanged((variable, data) => {
        const globalVariable = variable;
        switch (globalVariable) {
          case Global_LoadingWidgetState:
            this.applyState(data);
            break;
        }
      });
      const currentState = await dataSource.read(Global_LoadingWidgetState);
      this.applyState(currentState);
    }
  };
  var LoadingWidgetPlayback = new LoadingWidgetPlayback_t();

  // widgets/overlay/overlay_app.ts
  var OverlayWidget_t = class {
    constructor() {
      this._private = {
        statusTimer: null
      };
    }
    getOverlayContainer() {
      return document.getElementById("fx-video-container");
    }
    setActive(active) {
      const overlayContainer = this.getOverlayContainer();
      overlayContainer.classList.toggle("active", Boolean(active));
    }
    setOverlayArt(url) {
      const overlayContainer = this.getOverlayContainer();
      if (url) {
        const safeOverlayUrl = String(url).replace(/"/g, '\\"');
        overlayContainer.style.backgroundImage = 'url("' + safeOverlayUrl + '")';
        overlayContainer.style.backgroundSize = "cover";
        overlayContainer.style.backgroundPosition = "center center";
        overlayContainer.style.backgroundRepeat = "no-repeat";
      } else {
        overlayContainer.style.backgroundImage = "none";
      }
    }
    showStatusIcon(type) {
      const iconElement = document.getElementById("status-icon-overlay");
      const overlayContainer = this.getOverlayContainer();
      if (overlayContainer) {
        overlayContainer.classList.toggle("paused", type === "pause");
      }
      if (this._private.statusTimer) {
        clearTimeout(this._private.statusTimer);
        this._private.statusTimer = null;
      }
      let imgPath = "";
      if (type === "play") imgPath = "widgets/assets/play_overlay.png";
      else if (type === "pause") imgPath = "widgets/assets/pause_overlay.png";
      if (!imgPath) {
        iconElement.classList.remove("visible");
        return;
      }
      iconElement.style.backgroundImage = 'url("' + imgPath + '")';
      void iconElement.offsetWidth;
      iconElement.classList.add("visible");
      if (type !== "pause") {
        this._private.statusTimer = setTimeout(function() {
          iconElement.classList.remove("visible");
        }, 2e3);
      }
    }
    updateData(overlayData) {
      this.setOverlayArt(overlayData.overlayImage);
    }
    show() {
      this.setActive(true);
    }
    hide() {
      this.setActive(false);
    }
    play() {
      this.show();
      this.showStatusIcon("play");
    }
    pause() {
      this.show();
      this.showStatusIcon("pause");
    }
  };
  var OverlayWidget = new OverlayWidget_t();

  // widgets/overlay/overlay_playback.ts
  var OverlayWidgetPlayback_t = class {
    applyData(data) {
      OverlayWidget.updateData(OverlayData_t.fromJson(data));
    }
    applyState(state) {
      switch (state) {
        case 1 /* Show */:
          OverlayWidget.show();
          break;
        case 0 /* Hide */:
          OverlayWidget.hide();
          break;
        case 2 /* Pause */:
          OverlayWidget.pause();
          break;
        case 3 /* Resume */:
          OverlayWidget.play();
          break;
      }
    }
    async init(dataSource) {
      dataSource.onStateChanged((variable, data) => {
        const globalVariable = variable;
        switch (globalVariable) {
          case Global_OverlayWidgetData.key:
            this.applyData(data);
            break;
          case Global_OverlayWidgetState:
            this.applyState(data);
            break;
        }
      });
      const currentData = await dataSource.read(Global_OverlayWidgetData);
      this.applyData(currentData);
      const currentState = await dataSource.read(Global_OverlayWidgetState);
      this.applyState(currentState);
    }
  };
  var OverlayWidgetPlayback = new OverlayWidgetPlayback_t();

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

  // widgets/progress/progress_app.ts
  var ProgressWidget_t = class {
    constructor() {
      this._private = {
        lastProgressSeconds: 0,
        lastDurationSeconds: 0
      };
    }
    getContainer() {
      return document.querySelector("#progress-widget .progress-container");
    }
    show() {
      const containerElement = this.getContainer();
      containerElement.classList.add("visible");
      this.renderFromValues(this._private.lastProgressSeconds, this._private.lastDurationSeconds);
    }
    hide() {
      const containerElement = this.getContainer();
      containerElement.classList.remove("visible");
      this.reset();
    }
    formatTimeInMinutesAndSeconds(seconds) {
      if (isNaN(seconds)) return "0:00";
      const minutes = Math.floor(seconds / 60);
      const secondsPart = Math.floor(seconds % 60).toString().padStart(2, "0");
      return minutes + ":" + secondsPart;
    }
    reset() {
      this._private.lastProgressSeconds = 0;
      this._private.lastDurationSeconds = 0;
      this.renderFromValues(0, 0);
    }
    renderFromValues(progressSeconds, durationSeconds) {
      const boundedDuration = Number(durationSeconds || 0);
      const boundedProgress = Number(progressSeconds || 0);
      if (!durationSeconds || durationSeconds <= 0) return;
      const progressPercentage = boundedProgress / boundedDuration * 100;
      const progressBarElement = document.getElementById("progress-bar");
      if (progressBarElement) progressBarElement.style.width = progressPercentage + "%";
      const currentTimeElement = document.getElementById("current-time");
      const totalTimeElement = document.getElementById("total-time");
      if (currentTimeElement) currentTimeElement.textContent = this.formatTimeInMinutesAndSeconds(boundedProgress);
      if (totalTimeElement) totalTimeElement.textContent = this.formatTimeInMinutesAndSeconds(boundedDuration);
    }
    updateData(progressData) {
      this._private.lastProgressSeconds = Number(progressData.currentDurationInTrack || 0);
      this._private.lastDurationSeconds = Number(progressData.totalDurationInTrack || 0);
      this.renderFromValues(this._private.lastProgressSeconds, this._private.lastDurationSeconds);
    }
  };
  var ProgressWidget = new ProgressWidget_t();

  // widgets/progress/progress_playback.ts
  var ProgressWidgetPlayback_t = class {
    constructor() {
      this.unsubscribePlaybackClock = null;
    }
    applyClockSnapshot(clockSnapshot) {
      ProgressWidget.updateData(ProgressData_t.fromJson({
        currentDurationInTrack: clockSnapshot.progressSeconds,
        totalDurationInTrack: clockSnapshot.durationSeconds,
        readyForDisplay: clockSnapshot.durationSeconds > 0
      }));
    }
    applyState(state) {
      switch (state) {
        case 1 /* Show */:
          ProgressWidget.show();
          break;
        case 0 /* Hide */:
          ProgressWidget.hide();
          break;
      }
    }
    async init(dataSource) {
      dataSource.onStateChanged((variable, data) => {
        const globalVariable = variable;
        switch (globalVariable) {
          case Global_ProgressWidgetState:
            this.applyState(data);
            break;
        }
      });
      await PlaybackClock.init(dataSource);
      if (this.unsubscribePlaybackClock) this.unsubscribePlaybackClock();
      this.unsubscribePlaybackClock = PlaybackClock.subscribe((clockSnapshot) => {
        this.applyClockSnapshot(clockSnapshot);
      });
      const state = await dataSource.read(Global_ProgressWidgetState);
      this.applyState(state);
    }
  };
  var ProgressWidgetPlayback = new ProgressWidgetPlayback_t();

  // widgets/qrcode/qrcode_app.ts
  var QrCodeWidget_t = class {
    getContainer() {
      return document.getElementById("qrcode-container");
    }
    getUnknownTagIndicator() {
      return document.getElementById("unknown-tag-indicator");
    }
    getQrRenderTargetElement() {
      return document.getElementById("unknown-tag-qr");
    }
    getUidLabelElement() {
      return document.getElementById("unknown-tag-uid");
    }
    renderQrCodeImage(registrationUrl) {
      const qrRenderTargetElement = this.getQrRenderTargetElement();
      qrRenderTargetElement.innerHTML = "";
      new window.QRCode(qrRenderTargetElement, {
        text: registrationUrl,
        width: 240,
        height: 240,
        correctLevel: window.QRCode.CorrectLevel.M
      });
    }
    updateData(qrCodeData) {
      if (qrCodeData.readyForDisplay) {
        this.renderQrCodeImage(qrCodeData.registrationUrl);
        const uidLabelElement = this.getUidLabelElement();
        uidLabelElement.textContent = `Register Tag: ${qrCodeData.uid}`;
      }
    }
    show() {
      const container = this.getContainer();
      container.classList.add("visible");
    }
    hide() {
      const container = this.getContainer();
      container.classList.remove("visible");
      const indicator = this.getUnknownTagIndicator();
      indicator.classList.remove("visible");
    }
  };
  var QrCodeWidget = new QrCodeWidget_t();

  // widgets/qrcode/qrcode_playback.ts
  var QrCodeWidgetPlayback_t = class {
    applyState(state) {
      switch (state) {
        case 1 /* Show */:
          QrCodeWidget.show();
          break;
        case 0 /* Hide */:
          QrCodeWidget.hide();
          break;
      }
    }
    async init(dataSource) {
      dataSource.onStateChanged((variable, data) => {
        const globalVariable = variable;
        switch (globalVariable) {
          case Global_QrCodeWidgetData.key:
            QrCodeWidget.updateData(QrCodeData_t.fromJson(data));
            break;
          case Global_QrCodeWidgetState:
            this.applyState(data);
            break;
        }
      });
      const currentData = await dataSource.read(Global_QrCodeWidgetData);
      QrCodeWidget.updateData(currentData);
      const currentState = await dataSource.read(Global_QrCodeWidgetState);
      this.applyState(currentState);
    }
  };
  var QrCodeWidgetPlayback = new QrCodeWidgetPlayback_t();

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

  // widgets/lyrics/lyrics_app.ts
  var LyricsWidget_t = class {
    constructor() {
      this.uiLines = [];
      this.currentTimeSeconds = 0;
      this.fixedStepPx = 120;
      this.contextPrevEl = null;
      this.contextNextEl = null;
      this.interTrackBridgeActive = false;
      this.suppressTransitionsUntilNextFrame = false;
      this.bridgeSourceIndex = -1;
      this.bridgeEntrancePending = false;
      this.latestLyricsData = null;
      this.renderedLyricsData = null;
      this.MIN_STEP_PX = 112;
      this.STEP_PADDING_PX = 26;
      this.contextLines = {
        previousTrackLine: "",
        upcomingTrackLine: ""
      };
    }
    getContainer() {
      return document.getElementById("lyrics-scroll");
    }
    ensureContextElements() {
      const container = this.getContainer();
      if (!container) return null;
      if (!this.contextPrevEl) {
        this.contextPrevEl = document.createElement("div");
        this.contextPrevEl.className = "lyric-line lyric-context-prev";
        container.appendChild(this.contextPrevEl);
      }
      if (!this.contextNextEl) {
        this.contextNextEl = document.createElement("div");
        this.contextNextEl.className = "lyric-line lyric-context-next";
        container.appendChild(this.contextNextEl);
      }
      return { prev: this.contextPrevEl, next: this.contextNextEl };
    }
    computeLineUnitPx(lineElement) {
      const style = window.getComputedStyle(lineElement);
      const fontSize = parseFloat(style.fontSize) || 28;
      const lineHeight = parseFloat(style.lineHeight) || fontSize * 1.25;
      return Math.ceil(lineHeight);
    }
    recomputeFixedStep() {
      const context = this.ensureContextElements();
      if (!context) return;
      const anchorEl = this.uiLines.length > 0 ? this.uiLines[0].element : context.next;
      const unit = this.computeLineUnitPx(anchorEl);
      let maxHeight = unit;
      this.uiLines.forEach((line) => {
        const renderedHeight = Math.ceil(line.element.getBoundingClientRect().height || 0);
        if (renderedHeight > maxHeight) maxHeight = renderedHeight;
      });
      const contextHeights = [context.prev, context.next].map((contextElement) => {
        return Math.ceil(contextElement.getBoundingClientRect().height || 0);
      });
      maxHeight = Math.max(maxHeight, contextHeights[0], contextHeights[1]);
      this.fixedStepPx = Math.max(this.MIN_STEP_PX, maxHeight + this.STEP_PADDING_PX);
    }
    findActiveIndex(timeSeconds) {
      if (this.uiLines.length === 0) return -1;
      let activeIndex = -1;
      for (let i = 0; i < this.uiLines.length; i++) {
        if (timeSeconds >= this.uiLines[i].time) activeIndex = i;
        else break;
      }
      return activeIndex;
    }
    applyLineVisuals(lineElement, text, yPx, opacity, isActive) {
      lineElement.textContent = text || "";
      lineElement.style.transform = "translateY(calc(" + yPx + "px - 50%))";
      lineElement.style.opacity = text ? String(opacity) : "0";
      lineElement.classList.toggle("active", isActive && Boolean(text));
      lineElement.classList.toggle("no-motion", this.suppressTransitionsUntilNextFrame);
    }
    withSuppressedTransitions(work) {
      this.suppressTransitionsUntilNextFrame = true;
      try {
        work();
      } finally {
        requestAnimationFrame(() => {
          this.suppressTransitionsUntilNextFrame = false;
          this.uiLines.forEach((line) => {
            line.element.classList.remove("no-motion");
          });
          if (this.contextPrevEl) this.contextPrevEl.classList.remove("no-motion");
          if (this.contextNextEl) this.contextNextEl.classList.remove("no-motion");
        });
      }
    }
    renderBridgeState(context) {
      const hasBridgeSourceElement = this.bridgeSourceIndex >= 0 && this.bridgeSourceIndex < this.uiLines.length;
      this.uiLines.forEach((line, index) => {
        if (hasBridgeSourceElement && index === this.bridgeSourceIndex) {
          this.applyLineVisuals(line.element, line.text, -this.fixedStepPx, 0.36, false);
          return;
        }
        if (!hasBridgeSourceElement && index === 0) {
          if (this.bridgeEntrancePending) {
            this.applyLineVisuals(line.element, line.text, 2 * this.fixedStepPx, 0, false);
          } else {
            this.applyLineVisuals(line.element, line.text, this.fixedStepPx, 0.34, false);
          }
          return;
        }
        const y = (index + 1) * this.fixedStepPx;
        this.applyLineVisuals(line.element, line.text, y, 0, false);
      });
      if (hasBridgeSourceElement) {
        this.applyLineVisuals(context.prev, this.contextLines.previousTrackLine, -this.fixedStepPx, 0, false);
      } else {
        this.applyLineVisuals(context.prev, this.contextLines.previousTrackLine, -this.fixedStepPx, 0.36, false);
      }
      if (this.uiLines.length === 0) {
        if (this.bridgeEntrancePending) {
          this.applyLineVisuals(context.next, this.contextLines.upcomingTrackLine, 2 * this.fixedStepPx, 0, false);
        } else {
          this.applyLineVisuals(context.next, this.contextLines.upcomingTrackLine, this.fixedStepPx, 0.34, false);
        }
      } else {
        this.applyLineVisuals(context.next, this.contextLines.upcomingTrackLine, this.fixedStepPx, 0, false);
      }
    }
    renderNormalState(context, activeIndex, preFirst) {
      this.uiLines.forEach((line, index) => {
        if (preFirst) {
          if (index === 0) {
            this.applyLineVisuals(line.element, line.text, this.fixedStepPx, 0.5, false);
          } else {
            this.applyLineVisuals(line.element, line.text, (index + 1) * this.fixedStepPx, 0, false);
          }
          return;
        }
        const indexDelta = index - activeIndex;
        const y = indexDelta * this.fixedStepPx;
        if (Math.abs(indexDelta) > 1) {
          this.applyLineVisuals(line.element, line.text, y, 0, false);
          return;
        }
        if (indexDelta === 0) {
          this.applyLineVisuals(line.element, line.text, 0, 1, true);
        } else {
          this.applyLineVisuals(line.element, line.text, y, 0.42, false);
        }
      });
      if (preFirst) {
        this.applyLineVisuals(context.prev, this.contextLines.previousTrackLine, -this.fixedStepPx, 0.36, false);
        this.applyLineVisuals(context.next, this.contextLines.upcomingTrackLine, this.fixedStepPx, 0, false);
        return;
      }
      this.applyLineVisuals(context.prev, this.contextLines.previousTrackLine, -this.fixedStepPx, 0, false);
      this.applyLineVisuals(context.next, this.contextLines.upcomingTrackLine, this.fixedStepPx, 0, false);
    }
    renderState() {
      const context = this.ensureContextElements();
      if (!context) return;
      const activeIndex = this.findActiveIndex(this.currentTimeSeconds);
      const preFirst = this.uiLines.length > 0 && activeIndex < 0;
      this.recomputeFixedStep();
      if (this.interTrackBridgeActive) {
        this.renderBridgeState(context);
        return;
      }
      this.renderNormalState(context, activeIndex, preFirst);
    }
    updateLyrics(lyricsData) {
      const container = this.getContainer();
      if (!container) return;
      const incomingLines = lyricsData ? lyricsData.lines : [];
      this.withSuppressedTransitions(() => {
        this.ensureContextElements();
        const insertBeforeNode = this.contextPrevEl || this.contextNextEl || null;
        for (let i = 0; i < incomingLines.length; i++) {
          const lineObj = incomingLines[i];
          if (i < this.uiLines.length) {
            this.uiLines[i].time = lineObj.timeStart;
            this.uiLines[i].text = lineObj.text;
            this.uiLines[i].element.textContent = lineObj.text;
          } else {
            const lyricLineElement = document.createElement("div");
            lyricLineElement.className = "lyric-line no-motion";
            lyricLineElement.textContent = lineObj.text;
            container.insertBefore(lyricLineElement, insertBeforeNode);
            this.uiLines.push({
              time: lineObj.timeStart,
              text: lineObj.text,
              element: lyricLineElement
            });
          }
        }
        while (this.uiLines.length > incomingLines.length) {
          const removed = this.uiLines.pop();
          if (removed && removed.element && removed.element.parentNode) {
            removed.element.parentNode.removeChild(removed.element);
          }
        }
        if (this.interTrackBridgeActive) {
          this.bridgeSourceIndex = -1;
          this.bridgeEntrancePending = this.uiLines.length > 0;
          if (this.bridgeEntrancePending) {
            requestAnimationFrame(() => {
              requestAnimationFrame(() => {
                this.bridgeEntrancePending = false;
                this.renderState();
              });
            });
          }
        }
        this.renderState();
      });
    }
    syncProgress(timeSeconds) {
      this.currentTimeSeconds = Number(timeSeconds) || 0;
      if (this.interTrackBridgeActive && this.uiLines.length > 0) {
        const firstLineTime = Number(this.uiLines[0].time || 0);
        if (this.currentTimeSeconds >= firstLineTime) {
          this.interTrackBridgeActive = false;
          this.bridgeSourceIndex = -1;
          this.bridgeEntrancePending = false;
        }
      }
      this.renderState();
    }
    clear() {
      this.uiLines = [];
      this.currentTimeSeconds = 0;
      this.interTrackBridgeActive = false;
      this.bridgeSourceIndex = -1;
      this.bridgeEntrancePending = false;
      this.contextLines.previousTrackLine = "";
      this.contextLines.upcomingTrackLine = "";
      this.latestLyricsData = null;
      this.renderedLyricsData = null;
      const container = this.getContainer();
      if (container) container.innerHTML = "";
      this.contextPrevEl = null;
      this.contextNextEl = null;
    }
    getLyricsWidgetElement() {
      return document.getElementById("lyrics-widget");
    }
    show() {
      const element = this.getLyricsWidgetElement();
      if (!element) return;
      element.style.display = "block";
      void element.offsetWidth;
      element.classList.add("visible");
      if (this.latestLyricsData && this.renderedLyricsData !== this.latestLyricsData) {
        this.updateLyrics(this.latestLyricsData);
        this.renderedLyricsData = this.latestLyricsData;
      }
    }
    updateData(lyricData) {
      this.setLyricsDataForCurrentTrack(lyricData.readyForDisplay ? lyricData.trackLyrics : null);
      const element = this.getLyricsWidgetElement();
      const isVisible = !!(element && element.classList.contains("visible"));
      if (isVisible && this.latestLyricsData && this.renderedLyricsData !== this.latestLyricsData) {
        this.updateLyrics(this.latestLyricsData);
        this.renderedLyricsData = this.latestLyricsData;
      }
    }
    updateProgress(progressSeconds) {
      this.syncProgress(progressSeconds);
    }
    hide() {
      const element = this.getLyricsWidgetElement();
      if (!element) return;
      element.classList.remove("visible");
    }
    setLyricsDataForCurrentTrack(lyricsData) {
      if (lyricsData && lyricsData.lines && lyricsData.lines.length > 0) {
        this.latestLyricsData = lyricsData;
      } else {
        this.latestLyricsData = null;
      }
    }
  };
  var LyricsWidget = new LyricsWidget_t();

  // widgets/lyrics/lyrics_playback.ts
  var LyricsWidgetPlayback_t = class {
    constructor() {
      this.unsubscribePlaybackClock = null;
    }
    applyData(lyricData) {
      LyricsWidget.updateData(lyricData);
    }
    applyState(state) {
      switch (state) {
        case 1 /* Show */:
          LyricsWidget.show();
          break;
        case 0 /* Hide */:
          LyricsWidget.hide();
          break;
      }
    }
    async init(dataSource) {
      await PlaybackClock.init(dataSource);
      if (this.unsubscribePlaybackClock) this.unsubscribePlaybackClock();
      this.unsubscribePlaybackClock = PlaybackClock.subscribe((clockSnapshot) => {
        LyricsWidget.updateProgress(clockSnapshot.progressSeconds);
      });
      dataSource.onStateChanged((variable, data) => {
        switch (variable) {
          case Global_LyricsWidgetData.key:
            this.applyData(LyricData_t.fromJson(data));
            break;
          case Global_LyricsWidgetState:
            this.applyState(data);
            break;
        }
      });
      const currentData = await dataSource.read(Global_LyricsWidgetData.key);
      this.applyData(LyricData_t.fromJson(currentData));
      const currentState = await dataSource.read(Global_LyricsWidgetState);
      this.applyState(currentState);
    }
  };
  var LyricsWidgetPlayback = new LyricsWidgetPlayback_t();

  // widgets/visualizer/visualizer_app.ts
  var VisualizerWidget_t = class {
    constructor() {
      this.visualizerInterval = null;
    }
    getElement() {
      return document.getElementById("visualizer");
    }
    show() {
      this.play();
    }
    hide() {
      const el = this.getElement();
      if (!el) return;
      el.classList.remove("paused");
      el.classList.add("hidden");
      el.querySelectorAll(".bar").forEach((bar) => {
        bar.style.height = "0%";
      });
      if (this.visualizerInterval) {
        clearInterval(this.visualizerInterval);
        this.visualizerInterval = null;
      }
    }
    play() {
      const el = this.getElement();
      if (!el) return;
      el.classList.remove("paused", "hidden");
      if (this.visualizerInterval) clearInterval(this.visualizerInterval);
      const bars = el.querySelectorAll(".bar");
      this.visualizerInterval = setInterval(() => {
        bars.forEach((bar) => {
          bar.style.height = Math.random() * 80 + 20 + "%";
        });
      }, 140);
    }
    pause() {
      const el = this.getElement();
      if (!el || el.classList.contains("hidden")) return;
      el.classList.add("paused");
      el.querySelectorAll(".bar").forEach((bar) => {
        bar.style.height = "2%";
      });
      if (this.visualizerInterval) {
        clearInterval(this.visualizerInterval);
        this.visualizerInterval = null;
      }
    }
  };
  var VisualizerWidget = new VisualizerWidget_t();

  // widgets/visualizer/visualizer_playback.ts
  var VisualizerWidgetPlayback_t = class {
    constructor() {
      this.currentPlaybackState = 2 /* Idle */;
    }
    applyState(state) {
      switch (state) {
        case 1 /* Show */:
          VisualizerWidget.show();
          return;
        case 0 /* Hide */:
          VisualizerWidget.hide();
          return;
        case 3 /* Resume */:
          VisualizerWidget.play();
          return;
        case 2 /* Pause */:
          VisualizerWidget.pause();
          return;
      }
    }
    async init(dataSource) {
      dataSource.onStateChanged((variable, data) => {
        switch (variable) {
          case Global_VisualizerWidgetState:
            this.applyState(data);
            break;
        }
      });
      const currentState = await dataSource.read(Global_VisualizerWidgetState);
      this.applyState(currentState);
    }
  };
  var VisualizerWidgetPlayback = new VisualizerWidgetPlayback_t();

  // js/datasource.ts
  var DataSource = class {
    constructor(webSocketConnection) {
      this.webSocketConnection = webSocketConnection;
      this.pendingReadRequests = {};
      this.eventSubscribers = {};
      this.stateChangedCallbacks = [];
      this.webSocketConnection.addEventListener("message", (messageEvent) => this.dispatchMessage(messageEvent));
    }
    dispatchMessage(messageEvent) {
      const message = JSON.parse(String(messageEvent.data));
      if (message.action === "read_response" || message.action === "read_error") {
        if (!message.req_id) {
          return;
        }
        const pendingRequest = this.pendingReadRequests[message.req_id];
        if (!pendingRequest) {
          return;
        }
        clearTimeout(pendingRequest.timeoutIdentifier);
        delete this.pendingReadRequests[message.req_id];
        if (message.action === "read_error") {
          const requestedKey = message.key;
          const keyLabel = typeof requestedKey === "string" && requestedKey ? requestedKey : "unknown-key";
          pendingRequest.reject(new Error(`Read operation for '${keyLabel}' failed: ${message.error}`));
        } else {
          pendingRequest.resolve(message.value);
        }
        return;
      }
      const topic = message.Topic;
      const payload = message.Payload;
      if (topic === "datasource") {
        const changedPayload = payload;
        this.stateChangedCallbacks.forEach((callback) => {
          callback(changedPayload.variable, changedPayload.data);
        });
        return;
      }
      if (!topic) {
        return;
      }
      const subscribers = this.eventSubscribers[topic];
      if (subscribers) {
        subscribers.forEach((callback) => {
          callback(payload);
        });
      }
    }
    sendNetworkMessage(messageObject) {
      if (this.webSocketConnection.readyState === WebSocket.OPEN) {
        this.webSocketConnection.send(JSON.stringify(messageObject));
      }
    }
    generateRequestIdentifier() {
      return Math.random().toString(36).slice(2, 10);
    }
    read(keyDefinition) {
      const keyString = typeof keyDefinition === "object" ? keyDefinition.key : keyDefinition;
      const parseFunction = typeof keyDefinition === "object" ? keyDefinition.fromJson : null;
      return new Promise((resolve, reject) => {
        const requestIdentifier = this.generateRequestIdentifier();
        const timeoutIdentifier = setTimeout(() => {
          delete this.pendingReadRequests[requestIdentifier];
          reject(new Error(`Read operation for '${keyString}' timed out`));
        }, 5e3);
        this.pendingReadRequests[requestIdentifier] = {
          resolve: (value) => {
            resolve(parseFunction && value != null ? parseFunction(value) : value);
          },
          reject,
          timeoutIdentifier
        };
        this.sendNetworkMessage({ action: "read", key: keyString, req_id: requestIdentifier });
      });
    }
    write(keyDefinition, value) {
      const keyString = typeof keyDefinition === "object" ? keyDefinition.key : keyDefinition;
      let serializedValue = value;
      if (value && typeof value === "object" && "toJson" in value && typeof value.toJson === "function") {
        serializedValue = value.toJson();
      }
      this.sendNetworkMessage({ action: "write", key: keyString, value: serializedValue });
    }
    subscribe(topic, callback) {
      if (!this.eventSubscribers[topic]) {
        this.eventSubscribers[topic] = [];
        this.sendNetworkMessage({ action: "subscribe", topic });
      }
      this.eventSubscribers[topic].push(callback);
    }
    onStateChanged(callback) {
      this.stateChangedCallbacks.push(callback);
    }
  };

  // js/websocket_router.ts
  (function() {
    const urlParams = new URLSearchParams(window.location.search);
    const hostIp = window.location.hostname || "127.0.0.1";
    const wsHost = urlParams.get("host") || hostIp;
    const wsPort = urlParams.get("port") || 8099;
    const CLIENT_ID = "projector_" + Math.random().toString(16).substring(2, 10);
    let webSocket;
    let reconnectTimer;
    function connect() {
      const wsUrl = `ws://${wsHost}:${wsPort}/ws`;
      console.log("Projector WS connecting to:", wsUrl);
      webSocket = new WebSocket(wsUrl);
      webSocket.onopen = async function() {
        console.log("Projector WS connected.");
        clearTimeout(reconnectTimer);
        const dataSource = new DataSource(webSocket);
        window.AppDataSource = dataSource;
        window.PI_IP = wsHost;
        announcePresence(dataSource);
        dataSource.onStateChanged(function(variable, data) {
          switch (variable) {
            case Global_ActiveTrack.key: {
              const activeTrack2 = ActiveTrack_t.fromJson(data);
              TrackResolver.setActiveTrackIndex(Number(activeTrack2.trackIndex || 0));
              break;
            }
            case Global_ProjectorHeartbeatSignal:
              handleMappingCommand(data || {}, dataSource);
              break;
          }
        });
        await Promise.all([
          LoadingWidgetPlayback.init(dataSource),
          OverlayWidgetPlayback.init(dataSource),
          RecordWidgetPlayback.init(dataSource),
          TracklistWidgetPlayback.init(dataSource),
          ProgressWidgetPlayback.init(dataSource),
          LyricsWidgetPlayback.init(dataSource),
          VisualizerWidgetPlayback.init(dataSource),
          InfoWidgetPlayback.init(dataSource),
          QrCodeWidgetPlayback.init(dataSource),
          ContextMessageWidgetPlayback.init(dataSource)
        ]);
        const activeTrack = await dataSource.read(Global_ActiveTrack.key);
        TrackResolver.setActiveTrackIndex(Number(activeTrack.trackIndex || 0));
      };
      webSocket.onclose = function() {
        console.warn("Projector WS disconnected - retrying in 5s");
        window.AppDataSource = null;
        reconnectTimer = setTimeout(connect, 5e3);
      };
      webSocket.onerror = function(error) {
        console.error("WS error:", error);
        webSocket.close();
      };
    }
    function handleMappingCommand(command, dataSource) {
      switch (command.action) {
        case "layout":
          window.ProjectorMapping.updateLayout(command.data);
          break;
        case "toggle":
          window.ProjectorMapping.toggleMode();
          break;
        case "ping":
          announcePresence(dataSource);
          break;
      }
    }
    function announcePresence(dataSource) {
      dataSource.write(Global_ProjectorHeartbeat, {
        id: CLIENT_ID,
        width: window.innerWidth,
        height: window.innerHeight,
        ts: Date.now()
      });
    }
    connect();
  })();
})();
