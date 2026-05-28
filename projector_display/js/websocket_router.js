(function () {
    const urlParams = new URLSearchParams(window.location.search);
    const hostIp = window.location.hostname || '127.0.0.1';
    const wsHost = urlParams.get('host') || hostIp;
    const wsPort = urlParams.get('port') || 8099;

    const CLIENT_ID = 'projector_' + Math.random().toString(16).substring(2, 10);

    let ws;
    let reconnectTimer;

    function connect() {
        const wsUrl = `ws://${wsHost}:${wsPort}/ws`;
        console.log('Projector WS connecting to:', wsUrl);
        ws = new WebSocket(wsUrl);

        ws.onopen = async function () {
            console.log('Projector WS connected.');
            clearTimeout(reconnectTimer);

            const DS = new DataSource(ws);
            window.DS = DS;
            window.PI_IP = wsHost;

            let currentPlaybackState = { position: 0, duration: 0, track_name: '' };

            announcePresence();

            DS.OnDataSourceChanged = function (ctx, args) {
                switch (args.variable) {
                    case 'GLOBAL_ActiveRecordPlaybackState':
                        if (window.ProjectorPlayback?.handlePlaybackEvent) {
                            window.ProjectorPlayback.handlePlaybackEvent({ state: args.data });
                        }
                        break;

                    case 'GLOBAL_ActiveRecordTrackName':
                        currentPlaybackState.track_name = args.data;
                        if (window.ProjectorPlayback?.handlePlaybackEvent) {
                            window.ProjectorPlayback.handlePlaybackEvent({
                                event: 'track_changed',
                                track_name: args.data
                            });
                        }
                        break;

                    case 'GLOBAL_ActiveTrackTotalDurationInSeconds':
                        currentPlaybackState.duration = Number(args.data);
                        break;

                    case 'GLOBAL_ActiveTrackProgressInSeconds':
                        currentPlaybackState.position = Number(args.data);
                        if (window.ProjectorPlayback?.handleProgress) {
                            window.ProjectorPlayback.handleProgress(currentPlaybackState);
                        }
                        break;

                    case 'GLOBAL_CurrentShelfStatus':
                        if (args.data === 'empty') {
                            if (window.ProjectorPlayback?.stopPlayback) window.ProjectorPlayback.stopPlayback();
                        }
                        break;

                    case 'GLOBAL_CurrentProjectorData':
                        let visPayload = args.data;
                        if (typeof visPayload === 'string' && visPayload.length > 0) {
                            try { visPayload = JSON.parse(visPayload); } catch (e) { }
                        }
                        handleVisualUpdate(visPayload);
                        break;

                    case 'GLOBAL_ProjectorHeartbeatSignal':
                        let mapCmd = args.data;
                        if (typeof mapCmd === 'string' && mapCmd.length > 0) {
                            try { mapCmd = JSON.parse(mapCmd); } catch (e) { }
                        }

                        if (mapCmd && mapCmd.action) {
                            if (mapCmd.action === 'layout' && mapCmd.data && window.ProjectorMapping) {
                                window.ProjectorMapping.updateLayout(mapCmd.data);
                            } else if (mapCmd.action === 'toggle' && window.ProjectorMapping) {
                                window.ProjectorMapping.toggleMode();
                            } else if (mapCmd.action === 'ping') {
                                announcePresence();
                            }
                        }
                        break;
                }
            };

            try {
                const projData = await DS.read('GLOBAL_CurrentProjectorData');
                if (projData) {
                    let parsedData = projData;
                    if (typeof parsedData === 'string') {
                        try { parsedData = JSON.parse(parsedData); } catch (e) { }
                    }
                    handleVisualUpdate(parsedData);
                }

                const playbackState = await DS.read('GLOBAL_ActiveRecordPlaybackState');
                if (playbackState && window.ProjectorPlayback?.handlePlaybackEvent) {
                    window.ProjectorPlayback.handlePlaybackEvent({ state: playbackState });
                }

            } catch (err) {
                console.warn('Could not fetch initial projector state. Waiting for next event...', err);
            }
        };

        ws.onclose = function () {
            console.warn('Projector WS disconnected — retrying in 5s');
            window.DS = null;
            reconnectTimer = setTimeout(connect, 5000);
        };

        ws.onerror = function (err) {
            console.error('WS Error:', err);
            ws.close();
        };
    }

    function handleVisualUpdate(raw) {
        let payload;
        try {
            payload = new ProjectorPayload(raw);
        } catch (e) {
            console.error('ProjectorPayload parse error:', e);
            return;
        }

        if (!window.ProjectorPlayback) return;

        switch (payload.playerState) {
            case PlayerState.PLAYING: window.ProjectorPlayback.startPlayback(payload); break;
            case PlayerState.STOPPED: window.ProjectorPlayback.stopPlayback(); break;
            case PlayerState.UNKNOWN: window.ProjectorPlayback.showUnknownTag(payload); break;
            case PlayerState.ERROR: window.ProjectorPlayback.showPlaybackError(payload.errorMessage, payload); break;
        }
    }

    function announcePresence() {
        if (ws && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({
                action: 'write',
                key: 'GLOBAL_ProjectorHeartbeat',
                value: {
                    id: CLIENT_ID,
                    width: window.innerWidth,
                    height: window.innerHeight,
                    ts: Date.now()
                }
            }));
        }
    }

    connect();
})();