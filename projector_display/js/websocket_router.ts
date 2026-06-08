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
    let tracklistWidgetTransitionToken = 0;
    let currentProgressWidgetState: WidgetState_t = WidgetState.Hide;
    let hasProgressWidgetStateKey = true;

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

    type WidgetState_t = number;

    function resolveTrackIndex(snapshot: Partial<PlaybackSnapshot>): number | null {
        if (snapshot && snapshot.track_index !== undefined && snapshot.track_index !== null) {
            const numeric = Number(snapshot.track_index);
            if (!Number.isNaN(numeric)) return numeric;
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

    function applyProgressWidgetDataToWidgets(progressData: ProgressData_t): void {
        if (currentProgressWidgetState === WidgetState.Show) {
            setProgressWidgetVisible(true);
        }
        window.ProgressWidget?.updateData?.(progressData);
    }

    function applyTrackStateToWidgets(snapshot: PlaybackSnapshot): void {
        const resolvedIndex = resolveTrackIndex(snapshot);
        if (resolvedIndex !== null) {
            TrackResolver.setActiveTrackIndex(resolvedIndex);
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

    function applyTrackListWidgetDataToWidgets(trackListWidgetData: TrackListWidgetData_t, snapshot: PlaybackSnapshot): void {
        console.debug('[TL] WidgetData ->', (trackListWidgetData.tracks || []).length, 'tracks');
        window.TracklistWidget?.updateData?.(trackListWidgetData);

        const trackNames = (trackListWidgetData.tracks || []).map(function (entry) {
            return entry.track;
        });

        TrackResolver.setTrackNames(trackNames);
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

    function applyTrackListWidgetStateToWidgets(state: WidgetState_t): void {
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

    function setProgressWidgetVisible(visible: boolean): void {
        const progressContainer = document.querySelector('#progress-widget .progress-container');
        if (!progressContainer) return;

        if (visible) {
            progressContainer.classList.add('visible');
            return;
        }

        progressContainer.classList.remove('visible');
    }

    function applyProgressWidgetStateToWidgets(state: WidgetState_t): void {
        const numericState = Number(state);
        currentProgressWidgetState = numericState;

        if (numericState === WidgetState.Show) {
            setProgressWidgetVisible(true);
            window.ProgressWidget?.show?.();
            return;
        }

        if (numericState === WidgetState.Hide) {
            setProgressWidgetVisible(false);
            window.ProgressWidget?.hide?.({ reset: true });
        }
    }

    function applyLoadingWidgetStateToWidgets(state: WidgetState_t): void {
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

                    case Global_TrackListWidgetData.key:
                        applyTrackListWidgetDataToWidgets(TrackListWidgetData_t.fromJson(data), currentPlaybackState);
                        break;

                    case Global_ProgressWidgetData.key:
                        applyProgressWidgetDataToWidgets(ProgressData_t.fromJson(data));
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
                        handleMappingCommand((data || {}) as MappingCommand, dataSource);
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
                        applyInfoWidgetStateToWidgets(Number(data) as WidgetState_t);
                        break;

                    case Global_OverlayWidgetState:
                        applyOverlayWidgetStateToWidgets(Number(data) as WidgetState_t);
                        break;

                    case Global_RecordWidgetState:
                        applyRecordWidgetStateToWidgets(Number(data) as WidgetState_t);
                        break;

                    case Global_TrackListWidgetState:
                        applyTrackListWidgetStateToWidgets(Number(data) as WidgetState_t);
                        if (!hasProgressWidgetStateKey) {
                            applyProgressWidgetStateToWidgets(Number(data) as WidgetState_t);
                        }
                        break;

                    case Global_ProgressWidgetState:
                        applyProgressWidgetStateToWidgets(Number(data) as WidgetState_t);
                        break;

                    case Global_LoadingWidgetState:
                        applyLoadingWidgetStateToWidgets(Number(data) as WidgetState_t);
                        break;
                }
            });

            const projectorData = await DataSource_Read(dataSource, Global_CurrentProjectorData.key);
            handleVisualUpdate(ProjectorData_t.fromJson(projectorData), { restore: true });

            const trackListWidgetData = await DataSource_Read<TrackListWidgetData_t>(dataSource, Global_TrackListWidgetData.key);
            applyTrackListWidgetDataToWidgets(trackListWidgetData, currentPlaybackState);

            const progressWidgetData = await DataSource_Read<ProgressData_t>(dataSource, Global_ProgressWidgetData.key);
            applyProgressWidgetDataToWidgets(progressWidgetData);

            const activeTrack = await DataSource_Read<ActiveTrack_t>(dataSource, Global_ActiveTrack.key);
            currentPlaybackState.track_index = Number(activeTrack.trackIndex || 0);
            currentPlaybackState.track_name = activeTrack.trackName || '';

            const currentPlayingAlbumTitleAndArtist = await DataSource_Read<TitleAndArtist_t>(dataSource, Global_InfoWidgetData.key);
            applyNowPlayingTitleAndArtistToWidgets(currentPlayingAlbumTitleAndArtist);

            const currentPlayingAlbumOverlay = await DataSource_Read<OverlayData_t>(dataSource, Global_OverlayWidgetData.key);
            applyOverlayDataToWidgets(currentPlayingAlbumOverlay);

            const currentPlayingAlbumRecordDesign = await DataSource_Read<RecordDesignData_t>(dataSource, Global_RecordWidgetData.key);
            applyRecordDesignDataToWidgets(currentPlayingAlbumRecordDesign);

            const infoWidgetState = await DataSource_Read<WidgetState_t>(dataSource, Global_InfoWidgetState);
            applyInfoWidgetStateToWidgets(infoWidgetState);

            const overlayWidgetState = await DataSource_Read<WidgetState_t>(dataSource, Global_OverlayWidgetState);
            applyOverlayWidgetStateToWidgets(overlayWidgetState);

            const recordWidgetState = await DataSource_Read<WidgetState_t>(dataSource, Global_RecordWidgetState);
            applyRecordWidgetStateToWidgets(recordWidgetState);

            const trackListWidgetState = await DataSource_Read<WidgetState_t>(dataSource, Global_TrackListWidgetState);
            applyTrackListWidgetStateToWidgets(trackListWidgetState);

            try {
                const progressWidgetState = await DataSource_Read<WidgetState_t>(dataSource, Global_ProgressWidgetState);
                applyProgressWidgetStateToWidgets(progressWidgetState);
            } catch (error) {
                hasProgressWidgetStateKey = false;
                console.warn('[Progress] Global_ProgressWidgetState unavailable; mirroring TrackListWidgetState for visibility fallback.', error);
                applyProgressWidgetStateToWidgets(trackListWidgetState);
            }

            const loadingWidgetState = await DataSource_Read<WidgetState_t>(dataSource, Global_LoadingWidgetState);
            applyLoadingWidgetStateToWidgets(loadingWidgetState);

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
