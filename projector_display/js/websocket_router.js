(function () {
    const urlParams = new URLSearchParams(window.location.search);
    const hostIp = window.location.hostname || '127.0.0.1';
    const wsHost = urlParams.get('host') || hostIp;
    const wsPort = urlParams.get('port') || 8099;

    const CLIENT_ID = 'projector_' + Math.random().toString(16).substring(2, 10);

    let webSocket;
    let reconnectTimer;
    let isPlaybackVisualActive = false;

    function resolveTrackIndex(snapshot) {
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
            window.LyricsWidget.show({
                lyricsData: activeLyrics,
                progressSeconds: positionSeconds,
                isPlaybackVisualActive: isPlaybackVisualActive,
                isPlaying: isPlaying,
            });
        }

        const hasLyrics = window.LyricsWidget && window.LyricsWidget.hasLyrics && window.LyricsWidget.hasLyrics();
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

    function applyNowPlayingTitleAndArtistToWidgets(payload) {
        const titleAndArtist = TitleAndArtist_t.fromJson(payload);
        window.InfoWidget.updateData(titleAndArtist);
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

            let currentPlaybackState = {
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
                        if (data.track_name !== undefined) {
                            currentPlaybackState.track_name = data.track_name;
                        }
                        if (data.track_index !== undefined && data.track_index !== null) {
                            currentPlaybackState.track_index = data.track_index;
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
                        handleMappingCommand(data, dataSource);
                        break;
                    case Global_CurrentMediaPlaybackQueue.key:
                        TrackResolver.setTrackNames(data.tracks || []);
                        if (window.TracklistWidget && window.TracklistWidget.show) {
                            window.TracklistWidget.show({
                                visible: false,
                                queueList: data.tracks || [],
                            });
                        }
                        applyTrackStateToWidgets(currentPlaybackState);
                        break;
                    case Global_CurrentPlayingAlbumTitleAndArtist.key:
                        applyNowPlayingTitleAndArtistToWidgets(data);
                        break;
                }
            });

            const projectorData = await DataSource_Read(dataSource, Global_CurrentProjectorData.key);
            handleVisualUpdate(ProjectorData_t.fromJson(projectorData), { restore: true });

            const queueState = await DataSource_Read(dataSource, Global_CurrentMediaPlaybackQueue.key);
            TrackResolver.setTrackNames(queueState.tracks || []);
            if (window.TracklistWidget && window.TracklistWidget.show) {
                window.TracklistWidget.show({
                    visible: false,
                    queueList: queueState.tracks || [],
                });
            }

            const currentPlayingAlbumTitleAndArtist = await DataSource_Read(dataSource, Global_CurrentPlayingAlbumTitleAndArtist.key);
            applyNowPlayingTitleAndArtistToWidgets(currentPlayingAlbumTitleAndArtist);

            const activeTrack = await DataSource_Read(dataSource, Global_ActiveTrack.key);
            currentPlaybackState.track_name = activeTrack.track_name;
            currentPlaybackState.track_index = activeTrack.track_index;
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
            console.warn('Projector WS disconnected — retrying in 5s');
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
            case VisualDataState.DisplayAlbumVisuals: window.ProjectorPlayback.startPlayback(projectorData, { restore: !!visualOptions.restore }); break;
            case VisualDataState.DisplayIdle: window.ProjectorPlayback.stopPlayback(); break;
            case VisualDataState.DisplayTagRegistration: window.ProjectorPlayback.showUnknownTag(projectorData); break;
            case VisualDataState.DisplayErrorMessage: window.ProjectorPlayback.showPlaybackError(projectorData.errorMessage, projectorData); break;
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