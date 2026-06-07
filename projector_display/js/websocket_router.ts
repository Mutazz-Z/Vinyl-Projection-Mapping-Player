(function () {
    const urlParams = new URLSearchParams(window.location.search);
    const hostIp = window.location.hostname || '127.0.0.1';
    const wsHost = urlParams.get('host') || hostIp;
    const wsPort = urlParams.get('port') || 8099;

    const CLIENT_ID = 'projector_' + Math.random().toString(16).substring(2, 10);

    let webSocket: WebSocket;
    let reconnectTimer: ReturnType<typeof setTimeout> | undefined;
    let isPlaybackVisualActive = false;
    let recordWidgetTransitionToken = 0;

    const RECORD_SLIDE_MS = 700;

    type PlaybackSnapshot = {
        state: number;
        position: number;
        duration: number;
        track_name: string;
        track_index: number | null;
    };

    type MappingCommand = {
        action?: string;
        data?: object | Array<object> | null;
    };

    type QueueState = {
        tracks?: string[];
    };

    type ActiveTrackState = {
        track_name?: string;
        track_index?: number | null;
    };

    type WidgetState_t = number;

    function resolveTrackIndex(snapshot: Partial<PlaybackSnapshot>): number | null {
        if (snapshot && snapshot.track_index !== undefined && snapshot.track_index !== null) {
            const numeric = Number(snapshot.track_index);
            if (!Number.isNaN(numeric)) return numeric;
        }

        if (snapshot && snapshot.track_name) {
            const incomingName = String(snapshot.track_name).trim().toLowerCase();
            const trackNames = TrackResolver.getTrackNames() || [];

            for (let i = 0; i < trackNames.length; i++) {
                if (String(trackNames[i]).trim().toLowerCase() === incomingName) {
                    return i;
                }
            }
        }

        return null;
    }

    function syncLyricsAndVisualizerFromPlaybackState(snapshot: PlaybackSnapshot): void {
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
            } else if (window.VisualizerWidget.pause) {
                window.VisualizerWidget.pause();
            }
        } else if (window.VisualizerWidget && window.VisualizerWidget.hide) {
            window.VisualizerWidget.hide();
        }
    }

    function applyPlaybackStateToWidgets(snapshot: PlaybackSnapshot): void {
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

    function applyProgressToWidgets(snapshot: PlaybackSnapshot): void {
        if (window.ProgressWidget && window.ProgressWidget.show) {
            window.ProgressWidget.show({
                visible: false,
                snapshot: snapshot,
            });
        }
    }

    function applyTrackStateToWidgets(snapshot: PlaybackSnapshot): void {
        const resolvedIndex = resolveTrackIndex(snapshot);
        if (resolvedIndex !== null) {
            TrackResolver.setActiveTrackIndex(resolvedIndex);
        }

        if (window.TracklistWidget && window.TracklistWidget.show) {
            window.TracklistWidget.show({
                visible: false,
                activeTrack: {
                    track_index: snapshot.track_index,
                    track_name: snapshot.track_name,
                },
            });
        }

        syncLyricsAndVisualizerFromPlaybackState(snapshot);
    }

    function applyNowPlayingTitleAndArtistToWidgets(titleAndArtist: TitleAndArtist_t): void {
        window.InfoWidget.updateData(titleAndArtist);
    }

    function applyOverlayDataToWidgets(overlayData: OverlayData_t): void {
        window.OverlayWidget?.updateData?.(overlayData);
    }

    function applyRecordDesignDataToWidgets(recordDesignData: RecordDesignData_t): void {
        window.RecordWidget?.updateData?.(recordDesignData);
    }

    function applyInfoWidgetStateToWidgets(state: WidgetState_t): void {
        const numericState = Number(state);

        if (numericState === WidgetState.Show) {
            window.InfoWidget.show();
            return;
        }

        if (numericState === WidgetState.Hide) {
            window.InfoWidget.hide();
        }
    }

    function applyOverlayWidgetStateToWidgets(state: WidgetState_t): void {
        const numericState = Number(state);

        if (numericState === WidgetState.Show) {
            window.OverlayWidget?.show?.();
            return;
        }

        if (numericState === WidgetState.Hide) {
            window.OverlayWidget?.hide?.();
        }
    }

    function applyRecordWidgetStateToWidgets(state: WidgetState_t): void {
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

    function connect(): void {
        const wsUrl = `ws://${wsHost}:${wsPort}/ws`;
        console.log('Projector WS connecting to:', wsUrl);
        webSocket = new WebSocket(wsUrl);

        webSocket.onopen = async function () {
            console.log('Projector WS connected.');
            clearTimeout(reconnectTimer);

            const dataSource = new DataSource(webSocket);
            window.AppDataSource = dataSource;
            window.PI_IP = wsHost;

            const currentPlaybackState: PlaybackSnapshot = {
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

                    case Global_ActiveTrack.key:
                        if (typeof data === 'object' && data !== null && 'track_name' in data) {
                            currentPlaybackState.track_name = (data as ActiveTrackState).track_name || currentPlaybackState.track_name;
                        }
                        if (typeof data === 'object' && data !== null && 'track_index' in data) {
                            const activeTrackState = data as ActiveTrackState;
                            if (activeTrackState.track_index !== undefined && activeTrackState.track_index !== null) {
                                currentPlaybackState.track_index = activeTrackState.track_index;
                            }
                        }
                        applyTrackStateToWidgets(currentPlaybackState);
                        break;

                    case Global_ActiveTrackTotalDurationInSeconds:
                        currentPlaybackState.duration = Number(data);
                        break;

                    case Global_ActiveTrackProgressInSeconds:
                        currentPlaybackState.position = Number(data);
                        applyProgressToWidgets(currentPlaybackState);
                        break;

                    case Global_CurrentShelfStatus:
                        if (data === ShelfStatus.Empty) {
                            window.ProjectorPlayback.stopPlayback();
                        }
                        break;

                    case Global_CurrentProjectorData.key:
                        handleVisualUpdate(ProjectorData_t.fromJson(data));
                        break;

                    case Global_ProjectorHeartbeatSignal.key:
                        handleMappingCommand((data || {}) as MappingCommand, dataSource);
                        break;

                    case Global_CurrentMediaPlaybackQueue.key:
                        TrackResolver.setTrackNames((data as QueueState).tracks || []);
                        if (window.TracklistWidget && window.TracklistWidget.show) {
                            window.TracklistWidget.show({
                                visible: false,
                                queueList: (data as QueueState).tracks || [],
                            });
                        }
                        applyTrackStateToWidgets(currentPlaybackState);
                        break;

                    case Global_CurrentPlayingAlbumTitleAndArtist.key:
                        applyNowPlayingTitleAndArtistToWidgets(TitleAndArtist_t.fromJson(data));
                        break;

                    case Global_CurrentPlayingAlbumOverlay.key:
                        applyOverlayDataToWidgets(OverlayData_t.fromJson(data));
                        break;

                    case Global_CurrentPlayingAlbumRecordDesign.key:
                        applyRecordDesignDataToWidgets(RecordDesignData_t.fromJson(data));
                        break;

                    case Global_InfoWidgetState:
                        applyInfoWidgetStateToWidgets(Number(data) as WidgetState_t);
                        break;

                    case Global_OverlayWidgetState:
                        applyOverlayWidgetStateToWidgets(Number(data) as WidgetState_t);
                        break;

                    case Global_RecordWidgetState:
                        applyRecordWidgetStateToWidgets(Number(data) as WidgetState_t);
                        break;
                }
            });

            const projectorData = await DataSource_Read(dataSource, Global_CurrentProjectorData.key);
            handleVisualUpdate(ProjectorData_t.fromJson(projectorData), { restore: true });

            const queueState = await DataSource_Read<QueueState>(dataSource, Global_CurrentMediaPlaybackQueue.key);
            TrackResolver.setTrackNames(queueState.tracks || []);
            if (window.TracklistWidget && window.TracklistWidget.show) {
                window.TracklistWidget.show({
                    visible: false,
                    queueList: queueState.tracks || [],
                });
            }

            const currentPlayingAlbumTitleAndArtist = await DataSource_Read<TitleAndArtist_t>(dataSource, Global_CurrentPlayingAlbumTitleAndArtist.key);
            applyNowPlayingTitleAndArtistToWidgets(currentPlayingAlbumTitleAndArtist);

            const currentPlayingAlbumOverlay = await DataSource_Read<OverlayData_t>(dataSource, Global_CurrentPlayingAlbumOverlay.key);
            applyOverlayDataToWidgets(currentPlayingAlbumOverlay);

            const currentPlayingAlbumRecordDesign = await DataSource_Read<RecordDesignData_t>(dataSource, Global_CurrentPlayingAlbumRecordDesign.key);
            applyRecordDesignDataToWidgets(currentPlayingAlbumRecordDesign);

            const infoWidgetState = await DataSource_Read<WidgetState_t>(dataSource, Global_InfoWidgetState);
            applyInfoWidgetStateToWidgets(infoWidgetState);

            const overlayWidgetState = await DataSource_Read<WidgetState_t>(dataSource, Global_OverlayWidgetState);
            applyOverlayWidgetStateToWidgets(overlayWidgetState);

            const recordWidgetState = await DataSource_Read<WidgetState_t>(dataSource, Global_RecordWidgetState);
            applyRecordWidgetStateToWidgets(recordWidgetState);

            const activeTrack = await DataSource_Read<ActiveTrackState>(dataSource, Global_ActiveTrack.key);
            currentPlaybackState.track_name = activeTrack.track_name || '';
            currentPlaybackState.track_index = activeTrack.track_index ?? 0;
            applyTrackStateToWidgets(currentPlaybackState);

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

    function handleVisualUpdate(projectorData: ProjectorData_t, options?: { restore?: boolean }): void {
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

    function handleMappingCommand(command: MappingCommand, dataSource: DataSource): void {
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

    function announcePresence(dataSource: DataSource): void {
        DataSource_Write(dataSource, Global_ProjectorHeartbeat, {
            id: CLIENT_ID,
            width: window.innerWidth,
            height: window.innerHeight,
            ts: Date.now(),
        });
    }

    connect();
})();
