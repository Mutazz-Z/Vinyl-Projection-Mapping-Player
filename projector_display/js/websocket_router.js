(function () {
    const urlParams = new URLSearchParams(window.location.search);
    const hostIp = window.location.hostname || '127.0.0.1';
    const wsHost = urlParams.get('host') || hostIp;
    const wsPort = urlParams.get('port') || 8099;

    const CLIENT_ID = 'projector_' + Math.random().toString(16).substring(2, 10);

    let webSocket;
    let reconnectTimer;

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

            let currentPlaybackState = { position: 0, duration: 0, track_name: '' };

            announcePresence(dataSource);

            DataSource_OnChanged(dataSource, function (variable, data) {
                switch (variable) {
                    case Global_MediaPlaybackState:
                        if (window.ProjectorPlayback?.handlePlaybackEvent) {
                            window.ProjectorPlayback.handlePlaybackEvent({ state: data });
                        }
                        break;

                    case Global_ActiveTrack.key:
                        currentPlaybackState.track_name = data.track_name;
                        if (window.ProjectorPlayback?.handlePlaybackEvent) {
                            window.ProjectorPlayback.handlePlaybackEvent({
                                event: 'track_changed',
                                track_name: data.track_name,
                            });
                        }
                        break;

                    case Global_ActiveTrackTotalDurationInSeconds:
                        currentPlaybackState.duration = Number(data);
                        break;

                    case Global_ActiveTrackProgressInSeconds:
                        currentPlaybackState.position = Number(data);
                        if (window.ProjectorPlayback?.handleProgress) {
                            window.ProjectorPlayback.handleProgress(currentPlaybackState);
                        }
                        break;

                    case Global_CurrentShelfStatus:
                        if (data === ShelfStatus.Empty) {
                            if (window.ProjectorPlayback?.stopPlayback) {
                                window.ProjectorPlayback.stopPlayback();
                            }
                        }
                        break;

                    case Global_CurrentProjectorData.key:
                        handleVisualUpdate(new ProjectorPayload(
                            typeof data === 'string' ? JSON.parse(data) : data
                        ));
                        break;

                    case Global_ProjectorHeartbeatSignal.key:
                        handleMappingCommand(parseJsonIfString(data), dataSource);
                        break;
                    case Global_CurrentMediaPlaybackQueue.key:
                        if (data && Array.isArray(data.tracks)) {
                            if (window.ProjectorPlayback && window.ProjectorPlayback.updateQueueList) {
                                window.ProjectorPlayback.updateQueueList(data.tracks);
                            }
                        }
                        break;
                }
            });

            try {
                const projectorData = await DataSource_Read(dataSource, Global_CurrentProjectorData.key);
                if (projectorData) {
                    handleVisualUpdate(new ProjectorPayload(
                        typeof projectorData === 'string' ? JSON.parse(projectorData) : projectorData
                    ));
                }

                const playbackState = await DataSource_Read(dataSource, Global_MediaPlaybackState);
                if (playbackState && window.ProjectorPlayback?.handlePlaybackEvent) {
                    window.ProjectorPlayback.handlePlaybackEvent({ state: playbackState });
                }
            } catch (error) {
                console.warn('Could not fetch initial projector state. Waiting for next event...', error);
            }
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

    function handleVisualUpdate(projectorData) {
        if (!projectorData || !window.ProjectorPlayback) return;

        switch (projectorData.visualDataState) {
            case VisualDataState.DisplayAlbumVisuals: window.ProjectorPlayback.startPlayback(projectorData); break;
            case VisualDataState.DisplayIdle: window.ProjectorPlayback.stopPlayback(); break;
            case VisualDataState.DisplayTagRegistration: window.ProjectorPlayback.showUnknownTag(projectorData); break;
            case VisualDataState.DisplayErrorMessage: window.ProjectorPlayback.showPlaybackError(projectorData.errorMessage, projectorData); break;
        }
    }

    function handleMappingCommand(command, dataSource) {
        if (!command || !command.action) return;

        switch (command.action) {
            case 'layout':
                if (command.data && window.ProjectorMapping) {
                    window.ProjectorMapping.updateLayout(command.data);
                }
                break;
            case 'toggle':
                if (window.ProjectorMapping) {
                    window.ProjectorMapping.toggleMode();
                }
                break;
            case 'ping':
                announcePresence(dataSource);
                break;
        }
    }

    function parseJsonIfString(value) {
        if (typeof value !== 'string') {
            return value;
        }

        try {
            return JSON.parse(value);
        } catch (error) {
            return value;
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