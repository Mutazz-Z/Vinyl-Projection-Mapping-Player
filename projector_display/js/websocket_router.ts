(function () {
    const urlParams = new URLSearchParams(window.location.search);
    const hostIp = window.location.hostname || '127.0.0.1';
    const wsHost = urlParams.get('host') || hostIp;
    const wsPort = urlParams.get('port') || 8099;

    const CLIENT_ID = 'projector_' + Math.random().toString(16).substring(2, 10);

    let webSocket: WebSocket;
    let reconnectTimer: ReturnType<typeof setTimeout> | undefined;

    type MappingCommand = {
        action?: string;
        data?: object | Array<object> | null;
    };

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

            announcePresence(dataSource);

            // Infrastructure-level datasource handler: tracks shared state and
            // drives mapping. Widget-specific handling is delegated to each
            // widget's playback module.
            DataSource_OnChanged(dataSource, function (variable, data) {
                switch (variable) {
                    case Global_ActiveTrack.key: {
                        const activeTrack = ActiveTrack_t.fromJson(data);
                        TrackResolver.setActiveTrackIndex(Number(activeTrack.trackIndex || 0));
                        break;
                    }
                    case Global_ProjectorHeartbeatSignal.key:
                        handleMappingCommand((data || {}) as MappingCommand, dataSource);
                        break;
                }
            });

            // Initialise all widget playback modules in parallel — each registers
            // its own DataSource_OnChanged handler and restores current state.
            await Promise.all([
                window.InfoWidgetPlayback.init(dataSource),
                window.OverlayWidgetPlayback.init(dataSource),
                window.RecordWidgetPlayback.init(dataSource),
                window.TracklistWidgetPlayback.init(dataSource),
                window.ProgressWidgetPlayback.init(dataSource),
                window.LyricsWidgetPlayback.init(dataSource),
                window.VisualizerWidgetPlayback.init(dataSource),
                window.LoadingWidgetPlayback.init(dataSource),
                window.QrCodeWidgetPlayback.init(dataSource),
            ]);

            const activeTrack = await DataSource_Read<ActiveTrack_t>(dataSource, Global_ActiveTrack.key);
            TrackResolver.setActiveTrackIndex(Number(activeTrack.trackIndex || 0));
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
