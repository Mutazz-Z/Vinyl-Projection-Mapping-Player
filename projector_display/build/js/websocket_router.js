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
      this.readyForDisplay = parameters.readyForDisplay ?? false;
    }
    static fromJson(json) {
      if (!json || typeof json !== "object") return new _QrCodeData_t({});
      return new _QrCodeData_t({
        registrationUrl: typeof json["registration_url"] === "string" ? json["registration_url"] : "",
        readyForDisplay: json["readyForDisplay"] === true
      });
    }
    toJson() {
      return {
        "registration_url": this.registrationUrl,
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
  var Global_LastKnownUidScanned = { key: "Global_LastKnownUidScanned", fromJson: UidScanned_t.fromJson };
  var Global_LastUnknownUidScanned = { key: "Global_LastUnknownUidScanned", fromJson: UidScanned_t.fromJson };
  var Global_ProjectorHeartbeatSignal = "Global_ProjectorHeartbeatSignal";
  var Global_DefinedProjectorErrorMessage = "Global_DefinedProjectorErrorMessage";
  var Global_ProjectorHeartbeat = "Global_ProjectorHeartbeat";
  var Global_InfoWidgetData = { key: "Global_InfoWidgetData", fromJson: TitleAndArtist_t.fromJson };
  var Global_InfoWidgetState = "Global_InfoWidgetState";
  var Global_OverlayWidgetData = { key: "Global_OverlayWidgetData", fromJson: OverlayData_t.fromJson };
  var Global_RecordWidgetData = { key: "Global_RecordWidgetData", fromJson: RecordDesignData_t.fromJson };
  var Global_TrackListWidgetData = { key: "Global_TrackListWidgetData", fromJson: TrackListWidgetData_t.fromJson };
  var Global_ProgressWidgetData = { key: "Global_ProgressWidgetData", fromJson: ProgressData_t.fromJson };
  var Global_LyricsWidgetData = { key: "Global_LyricsWidgetData", fromJson: LyricData_t.fromJson };
  var Global_QrCodeWidgetData = { key: "Global_QrCodeWidgetData", fromJson: QrCodeData_t.fromJson };
  var Global_PlaybackErrorMessageState = "Global_PlaybackErrorMessageState";
  var Global_ActiveTrack = { key: "Global_ActiveTrack", fromJson: ActiveTrack_t.fromJson };

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
          InfoWidgetPlayback.init(dataSource),
          window.OverlayWidgetPlayback.init(dataSource),
          window.RecordWidgetPlayback.init(dataSource),
          window.TracklistWidgetPlayback.init(dataSource),
          window.ProgressWidgetPlayback.init(dataSource),
          window.LyricsWidgetPlayback.init(dataSource),
          window.VisualizerWidgetPlayback.init(dataSource),
          window.LoadingWidgetPlayback.init(dataSource),
          window.QrCodeWidgetPlayback.init(dataSource),
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
