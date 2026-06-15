import { Global_ActiveTrack, ActiveTrack_t, Global_ProjectorHeartbeatSignal, Global_ProjectorHeartbeat } from "../types/state";
import { ContextMessageWidgetPlayback } from "../widgets/context_message/context_message_playback";
import { InfoWidgetPlayback } from "../widgets/info/info_playback";
import { LoadingWidgetPlayback } from "../widgets/loading/loading_playback";
import { OverlayWidgetPlayback } from "../widgets/overlay/overlay_playback";
import { ProgressWidgetPlayback } from "../widgets/progress/progress_playback";
import { DataSource } from "./datasource";

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

            dataSource.onStateChanged(function (variable, data) {
                switch (variable) {
                    case Global_ActiveTrack.key: {
                        const activeTrack = ActiveTrack_t.fromJson(data);
                        TrackResolver.setActiveTrackIndex(Number(activeTrack.trackIndex || 0));
                        break;
                    }
                    case Global_ProjectorHeartbeatSignal:
                        handleMappingCommand((data || {}) as MappingCommand, dataSource);
                        break;
                }
            });

            await Promise.all([
                LoadingWidgetPlayback.init(dataSource),
                OverlayWidgetPlayback.init(dataSource),
                window.RecordWidgetPlayback.init(dataSource),
                window.TracklistWidgetPlayback.init(dataSource),
                ProgressWidgetPlayback.init(dataSource),
                window.LyricsWidgetPlayback.init(dataSource),
                window.VisualizerWidgetPlayback.init(dataSource),
                InfoWidgetPlayback.init(dataSource),
                window.QrCodeWidgetPlayback.init(dataSource),
                ContextMessageWidgetPlayback.init(dataSource),
            ]);

            const activeTrack = await dataSource.read<ActiveTrack_t>(Global_ActiveTrack.key);
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
        dataSource.write(Global_ProjectorHeartbeat, {
            id: CLIENT_ID,
            width: window.innerWidth,
            height: window.innerHeight,
            ts: Date.now(),
        });
    }

    connect();
})();
