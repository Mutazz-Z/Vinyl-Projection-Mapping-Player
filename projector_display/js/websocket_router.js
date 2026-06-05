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

            let currentPlaybackState = { position: 0, duration: 0, track_name: '', track_index: 0 };

            announcePresence(dataSource);

            DataSource_OnChanged(dataSource, function (variable, data) {
                switch (variable) {
                    case Global_MediaPlaybackState:
                        window.ProjectorPlayback.handlePlaybackEvent({ state: data });
                        break;

                    case Global_ActiveTrack.key:
                        currentPlaybackState.track_name = data.track_name;
                        currentPlaybackState.track_index = data.track_index;
                        window.ProjectorPlayback.handlePlaybackEvent({
                            track_name: currentPlaybackState.track_name,
                            track_index: currentPlaybackState.track_index,
                        });
                        break;

                    case Global_ActiveTrackTotalDurationInSeconds:
                        currentPlaybackState.duration = Number(data);
                        break;

                    case Global_ActiveTrackProgressInSeconds:
                        currentPlaybackState.position = Number(data);
                        window.ProjectorPlayback.handleProgress(currentPlaybackState);
                        break;

                    case Global_CurrentShelfStatus:
                        if (data === ShelfStatus.Empty) {
                            window.ProjectorPlayback.stopPlayback();
                        }
                        break;

                    case Global_CurrentProjectorData.key:
                        handleVisualUpdate(new ProjectorPayload(data));
                        break;

                    case Global_ProjectorHeartbeatSignal.key:
                        handleMappingCommand(data, dataSource);
                        break;
                    case Global_CurrentMediaPlaybackQueue.key:
                        window.ProjectorPlayback.updateQueueList(data.tracks);
                        break;
                }
            });

            const projectorData = await DataSource_Read(dataSource, Global_CurrentProjectorData.key);
            handleVisualUpdate(new ProjectorPayload(projectorData));

            const queueState = await DataSource_Read(dataSource, Global_CurrentMediaPlaybackQueue.key);
            window.ProjectorPlayback.updateQueueList(queueState.tracks);

            const activeTrack = await DataSource_Read(dataSource, Global_ActiveTrack.key);
            currentPlaybackState.track_name = activeTrack.track_name;
            currentPlaybackState.track_index = activeTrack.track_index;
            window.ProjectorPlayback.handlePlaybackEvent({
                track_name: currentPlaybackState.track_name,
                track_index: currentPlaybackState.track_index,
            });

            const totalDuration = await DataSource_Read(dataSource, Global_ActiveTrackTotalDurationInSeconds);
            currentPlaybackState.duration = Number(totalDuration);

            const elapsedTime = await DataSource_Read(dataSource, Global_ActiveTrackProgressInSeconds);
            currentPlaybackState.position = Number(elapsedTime);
            window.ProjectorPlayback.handleProgress(currentPlaybackState);

            const playbackState = await DataSource_Read(dataSource, Global_MediaPlaybackState);
            window.ProjectorPlayback.handlePlaybackEvent({ state: playbackState });
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
        switch (projectorData.visualDataState) {
            case VisualDataState.DisplayAlbumVisuals: window.ProjectorPlayback.startPlayback(projectorData); break;
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