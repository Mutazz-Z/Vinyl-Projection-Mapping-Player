"use strict";
(function () {
    const urlParams = new URLSearchParams(window.location.search);
    const hostIp = window.location.hostname || '127.0.0.1';
    const wsHost = urlParams.get('host') || hostIp;
    const wsPort = urlParams.get('port') || 8099;
    const CLIENT_ID = 'projector_' + Math.random().toString(16).substring(2, 10);
    let webSocket;
    let reconnectTimer;
    let isPlaybackVisualActive = false;
    let recordWidgetTransitionToken = 0;
    let tracklistWidgetTransitionToken = 0;
    const RECORD_SLIDE_MS = 700;
    function resolveTrackIndex(snapshot) {
        if (snapshot && snapshot.track_index !== undefined && snapshot.track_index !== null) {
            const numeric = Number(snapshot.track_index);
            if (!Number.isNaN(numeric))
                return numeric;
        }
        return null;
    }
    function syncLyricsAndVisualizerFromPlaybackState(snapshot) {
        const isPlaying = Number(snapshot.state) === MediaPlaybackState.Playing;
        if (!isPlaybackVisualActive) {
            if (window.LyricsWidget && window.LyricsWidget.hide) {
                window.LyricsWidget.hide();
            }
            return;
        }
        const resolvedIndex = resolveTrackIndex(snapshot);
        if (resolvedIndex !== null) {
            TrackResolver.setActiveTrackIndex(resolvedIndex);
        }
        const activeLyrics = TrackResolver.getLyricsByTrackIndex(resolvedIndex !== null ? resolvedIndex : 0);
        const positionSeconds = Number(snapshot.position || 0);
        if (window.LyricsWidget) {
            window.LyricsWidget.show?.({
                lyricsData: activeLyrics,
                progressSeconds: positionSeconds,
                isPlaybackVisualActive: isPlaybackVisualActive,
                isPlaying: isPlaying,
            });
        }
        const hasLyrics = !!(window.LyricsWidget && window.LyricsWidget.hasLyrics && window.LyricsWidget.hasLyrics());
        if (!hasLyrics && window.VisualizerWidget) {
            if (isPlaying && window.VisualizerWidget.play) {
                window.VisualizerWidget.play();
            }
            else if (window.VisualizerWidget.pause) {
                window.VisualizerWidget.pause();
            }
        }
        else if (window.VisualizerWidget && window.VisualizerWidget.hide) {
            window.VisualizerWidget.hide();
        }
    }
    function applyPlaybackStateToWidgets(snapshot) {
        const playbackState = Number(snapshot.state);
        if (window.RecordWidget && window.RecordWidget.show) {
            window.RecordWidget.show({
                visible: false,
                playbackState: playbackState,
            });
        }
        if (window.OverlayWidget && window.OverlayWidget.show) {
            window.OverlayWidget.show({
                visible: false,
                playbackState: playbackState,
            });
        }
        if (window.ProgressWidget && window.ProgressWidget.show) {
            window.ProgressWidget.show({
                visible: false,
                playbackState: playbackState,
            });
        }
        syncLyricsAndVisualizerFromPlaybackState(snapshot);
    }
    function applyProgressToWidgets(snapshot) {
        if (window.ProgressWidget && window.ProgressWidget.show) {
            window.ProgressWidget.show({
                visible: false,
                snapshot: snapshot,
            });
        }
    }
    function applyTrackStateToWidgets(snapshot) {
        const resolvedIndex = resolveTrackIndex(snapshot);
        if (resolvedIndex !== null) {
            TrackResolver.setActiveTrackIndex(resolvedIndex);
        }
        syncLyricsAndVisualizerFromPlaybackState(snapshot);
    }
    function applyNowPlayingTitleAndArtistToWidgets(titleAndArtist) {
        window.InfoWidget.updateData(titleAndArtist);
    }
    function applyOverlayDataToWidgets(overlayData) {
        window.OverlayWidget?.updateData?.(overlayData);
    }
    function applyRecordDesignDataToWidgets(recordDesignData) {
        window.RecordWidget?.updateData?.(recordDesignData);
    }
    function applyTrackListWidgetDataToWidgets(trackListWidgetData, snapshot) {
        console.debug('[TL] WidgetData ->', (trackListWidgetData.tracks || []).length, 'tracks');
        window.TracklistWidget?.updateData?.(trackListWidgetData);
        const trackNames = (trackListWidgetData.tracks || []).map(function (entry) {
            return entry.track;
        });
        TrackResolver.setTrackNames(trackNames);
    }
    function applyInfoWidgetStateToWidgets(state) {
        const numericState = Number(state);
        if (numericState === WidgetState.Show) {
            window.InfoWidget.show();
            return;
        }
        if (numericState === WidgetState.Hide) {
            window.InfoWidget.hide();
        }
    }
    function applyOverlayWidgetStateToWidgets(state) {
        const numericState = Number(state);
        if (numericState === WidgetState.Show) {
            window.OverlayWidget?.show?.();
            return;
        }
        if (numericState === WidgetState.Hide) {
            window.OverlayWidget?.hide?.();
        }
    }
    function applyRecordWidgetStateToWidgets(state) {
        const numericState = Number(state);
        if (numericState === WidgetState.Show) {
            const transitionToken = ++recordWidgetTransitionToken;
            window.RecordWidget?.show?.({
                visible: false,
                revealForPlayback: {
                    token: transitionToken,
                    getPlaybackToken: function () {
                        return recordWidgetTransitionToken;
                    },
                },
            });
            return;
        }
        if (numericState === WidgetState.Hide) {
            const transitionToken = ++recordWidgetTransitionToken;
            window.RecordWidget?.hide?.({
                visible: false,
                beginStop: {
                    token: transitionToken,
                    getPlaybackToken: function () {
                        return recordWidgetTransitionToken;
                    },
                    isError: false,
                    delayMs: RECORD_SLIDE_MS,
                },
            });
        }
    }
    function applyTrackListWidgetStateToWidgets(state) {
        const numericState = Number(state);
        console.debug('[TL] WidgetState ->', numericState, '(Show=' + WidgetState.Show + ', Hide=' + WidgetState.Hide + ')');
        if (numericState === WidgetState.Show) {
            window.TracklistWidget?.show?.();
            return;
        }
        if (numericState === WidgetState.Hide) {
            const transitionToken = ++tracklistWidgetTransitionToken;
            window.TracklistWidget?.hide?.({
                visible: false,
                beginStopSequence: {
                    token: transitionToken,
                    getPlaybackToken: function () {
                        return tracklistWidgetTransitionToken;
                    },
                },
            });
        }
    }
    function applyLoadingWidgetStateToWidgets(state) {
        const numericState = Number(state);
        if (numericState === WidgetState.Loading) {
            void window.LoadingWidget?.loading?.();
            return;
        }
        if (numericState === WidgetState.Hide) {
            void window.LoadingWidget?.hide?.();
            return;
        }
        if (numericState === WidgetState.Idle) {
            window.LoadingWidget?.idle?.();
        }
    }
    function connect() {
        const wsUrl = `ws://${wsHost}:${wsPort}/ws`;
        console.log('Projector WS connecting to:', wsUrl);
        webSocket = new WebSocket(wsUrl);
        webSocket.onopen = async function () {
            console.log('Projector WS connected.');
            clearTimeout(reconnectTimer);
            const dataSource = new DataSource(webSocket);
            window.AppDataSource = dataSource;
            window.PI_IP = wsHost;
            const currentPlaybackState = {
                state: MediaPlaybackState.Idle,
                position: 0,
                duration: 0,
                track_name: '',
                track_index: 0,
            };
            announcePresence(dataSource);
            DataSource_OnChanged(dataSource, function (variable, data) {
                switch (variable) {
                    case Global_MediaPlaybackState:
                        currentPlaybackState.state = Number(data);
                        applyPlaybackStateToWidgets(currentPlaybackState);
                        break;
                    case Global_TrackListWidgetData.key:
                        applyTrackListWidgetDataToWidgets(TrackListWidgetData_t.fromJson(data), currentPlaybackState);
                        break;
                    case Global_ActiveTrackTotalDurationInSeconds:
                        currentPlaybackState.duration = Number(data);
                        break;
                    case Global_ActiveTrackProgressInSeconds:
                        currentPlaybackState.position = Number(data);
                        applyProgressToWidgets(currentPlaybackState);
                        break;
                    case Global_ActiveTrack.key: {
                        const activeTrack = ActiveTrack_t.fromJson(data);
                        currentPlaybackState.track_index = Number(activeTrack.trackIndex || 0);
                        currentPlaybackState.track_name = activeTrack.trackName || '';
                        applyTrackStateToWidgets(currentPlaybackState);
                        break;
                    }
                    case Global_CurrentShelfStatus:
                        if (data === ShelfStatus.Empty) {
                            window.ProjectorPlayback.stopPlayback();
                        }
                        break;
                    case Global_CurrentProjectorData.key:
                        handleVisualUpdate(ProjectorData_t.fromJson(data));
                        break;
                    case Global_ProjectorHeartbeatSignal.key:
                        handleMappingCommand((data || {}), dataSource);
                        break;
                    case Global_InfoWidgetData.key:
                        applyNowPlayingTitleAndArtistToWidgets(TitleAndArtist_t.fromJson(data));
                        break;
                    case Global_OverlayWidgetData.key:
                        applyOverlayDataToWidgets(OverlayData_t.fromJson(data));
                        break;
                    case Global_RecordWidgetData.key:
                        applyRecordDesignDataToWidgets(RecordDesignData_t.fromJson(data));
                        break;
                    case Global_InfoWidgetState:
                        applyInfoWidgetStateToWidgets(Number(data));
                        break;
                    case Global_OverlayWidgetState:
                        applyOverlayWidgetStateToWidgets(Number(data));
                        break;
                    case Global_RecordWidgetState:
                        applyRecordWidgetStateToWidgets(Number(data));
                        break;
                    case Global_TrackListWidgetState:
                        applyTrackListWidgetStateToWidgets(Number(data));
                        break;
                    case Global_LoadingWidgetState:
                        applyLoadingWidgetStateToWidgets(Number(data));
                        break;
                }
            });
            const projectorData = await DataSource_Read(dataSource, Global_CurrentProjectorData.key);
            handleVisualUpdate(ProjectorData_t.fromJson(projectorData), { restore: true });
            const trackListWidgetData = await DataSource_Read(dataSource, Global_TrackListWidgetData.key);
            applyTrackListWidgetDataToWidgets(trackListWidgetData, currentPlaybackState);
            const activeTrack = await DataSource_Read(dataSource, Global_ActiveTrack.key);
            currentPlaybackState.track_index = Number(activeTrack.trackIndex || 0);
            currentPlaybackState.track_name = activeTrack.trackName || '';
            const currentPlayingAlbumTitleAndArtist = await DataSource_Read(dataSource, Global_InfoWidgetData.key);
            applyNowPlayingTitleAndArtistToWidgets(currentPlayingAlbumTitleAndArtist);
            const currentPlayingAlbumOverlay = await DataSource_Read(dataSource, Global_OverlayWidgetData.key);
            applyOverlayDataToWidgets(currentPlayingAlbumOverlay);
            const currentPlayingAlbumRecordDesign = await DataSource_Read(dataSource, Global_RecordWidgetData.key);
            applyRecordDesignDataToWidgets(currentPlayingAlbumRecordDesign);
            const infoWidgetState = await DataSource_Read(dataSource, Global_InfoWidgetState);
            applyInfoWidgetStateToWidgets(infoWidgetState);
            const overlayWidgetState = await DataSource_Read(dataSource, Global_OverlayWidgetState);
            applyOverlayWidgetStateToWidgets(overlayWidgetState);
            const recordWidgetState = await DataSource_Read(dataSource, Global_RecordWidgetState);
            applyRecordWidgetStateToWidgets(recordWidgetState);
            const trackListWidgetState = await DataSource_Read(dataSource, Global_TrackListWidgetState);
            applyTrackListWidgetStateToWidgets(trackListWidgetState);
            const loadingWidgetState = await DataSource_Read(dataSource, Global_LoadingWidgetState);
            applyLoadingWidgetStateToWidgets(loadingWidgetState);
            const totalDuration = await DataSource_Read(dataSource, Global_ActiveTrackTotalDurationInSeconds);
            currentPlaybackState.duration = Number(totalDuration);
            const elapsedTime = await DataSource_Read(dataSource, Global_ActiveTrackProgressInSeconds);
            currentPlaybackState.position = Number(elapsedTime);
            applyProgressToWidgets(currentPlaybackState);
            const playbackState = await DataSource_Read(dataSource, Global_MediaPlaybackState);
            currentPlaybackState.state = Number(playbackState);
            applyPlaybackStateToWidgets(currentPlaybackState);
        };
        webSocket.onclose = function () {
            console.warn('Projector WS disconnected - retrying in 5s');
            window.AppDataSource = null;
            reconnectTimer = setTimeout(connect, 5000);
        };
        webSocket.onerror = function (error) {
            console.error('WS error:', error);
            webSocket.close();
        };
    }
    function handleVisualUpdate(projectorData, options) {
        const visualOptions = options || {};
        isPlaybackVisualActive = projectorData.visualDataState === VisualDataState.DisplayAlbumVisuals;
        switch (projectorData.visualDataState) {
            case VisualDataState.DisplayAlbumVisuals:
                window.ProjectorPlayback.startPlayback(projectorData, { restore: !!visualOptions.restore });
                break;
            case VisualDataState.DisplayIdle:
                window.ProjectorPlayback.stopPlayback();
                break;
            case VisualDataState.DisplayTagRegistration:
                window.ProjectorPlayback.showUnknownTag(projectorData);
                break;
            case VisualDataState.DisplayErrorMessage:
                window.ProjectorPlayback.showPlaybackError(projectorData.errorMessage, projectorData);
                break;
        }
    }
    function handleMappingCommand(command, dataSource) {
        switch (command.action) {
            case 'layout':
                window.ProjectorMapping.updateLayout(command.data);
                break;
            case 'toggle':
                window.ProjectorMapping.toggleMode();
                break;
            case 'ping':
                announcePresence(dataSource);
                break;
        }
    }
    function announcePresence(dataSource) {
        DataSource_Write(dataSource, Global_ProjectorHeartbeat, {
            id: CLIENT_ID,
            width: window.innerWidth,
            height: window.innerHeight,
            ts: Date.now(),
        });
    }
    connect();
})();
