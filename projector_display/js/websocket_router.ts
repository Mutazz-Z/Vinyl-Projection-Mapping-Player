import { Global_ActiveTrack, ActiveTrack_t, Global_ProjectorHeartbeatSignal, Global_ProjectorHeartbeat, ProjectorHeartbeat_t, ProjectorHeartbeatSignal_t, Global_CurrentMaptasticProjectorPositions, MaptasticProjectorPositions_t } from "../types/state";
import { TrackResolver } from "./track_resolver";
import { ProjectorMapping } from "./mapping";
import { ContextMessageWidgetPlayback } from "../widgets/context_message/context_message_playback";
import { InfoWidgetPlayback } from "../widgets/info/info_playback";
import { LoadingWidgetPlayback } from "../widgets/loading/loading_playback";
import { OverlayWidgetPlayback } from "../widgets/overlay/overlay_playback";
import { ProgressWidgetPlayback } from "../widgets/progress/progress_playback";
import { QrCodeWidgetPlayback } from "../widgets/qrcode/qrcode_playback";
import { RecordWidgetPlayback } from "../widgets/record/record_playback";
import { TracklistWidgetPlayback } from "../widgets/tracklist/tracklist_playback";
import { LyricsWidgetPlayback } from "../widgets/lyrics/lyrics_playback";
import { VisualizerWidgetPlayback } from "../widgets/visualizer/visualizer_playback";
import { DataSource } from "./datasource";

declare global {
    interface Window {
        AppDataSource: DataSource | null;
        PI_IP: string;
    }
}

(function () {
    const urlParams = new URLSearchParams(window.location.search);
    const hostIp = window.location.hostname || '127.0.0.1';
    const wsHost = urlParams.get('host') || hostIp;
    const wsPort = urlParams.get('port') || 8099;

    const CLIENT_ID = 'projector_' + Math.random().toString(16).substring(2, 10);

    let webSocket: WebSocket;
    let reconnectTimer: ReturnType<typeof setTimeout> | undefined;

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
                    case Global_ProjectorHeartbeatSignal.key:
                        handleMappingCommand(ProjectorHeartbeatSignal_t.fromJson(data), dataSource);
                        break;
                    case Global_CurrentMaptasticProjectorPositions.key: {
                        const positions = MaptasticProjectorPositions_t.fromJson(data);
                        if (positions.layoutJson) {
                            try {
                                const layout = JSON.parse(positions.layoutJson);
                                ProjectorMapping.updateLayout(layout);
                            } catch (error) {
                                console.error('Failed to parse layout from updated positions:', error);
                            }
                        }
                        break;
                    }
                }
            });

            await Promise.all([
                LoadingWidgetPlayback.init(dataSource),
                OverlayWidgetPlayback.init(dataSource),
                RecordWidgetPlayback.init(dataSource),
                TracklistWidgetPlayback.init(dataSource),
                ProgressWidgetPlayback.init(dataSource),
                LyricsWidgetPlayback.init(dataSource),
                VisualizerWidgetPlayback.init(dataSource),
                InfoWidgetPlayback.init(dataSource),
                QrCodeWidgetPlayback.init(dataSource),
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

    function handleMappingCommand(command: ProjectorHeartbeatSignal_t, dataSource: DataSource): void {
        switch (command.action) {
            case 'layout':
                ProjectorMapping.updateLayout(command.data ? JSON.parse(command.data) : null);
                break;
            case 'toggle':
                ProjectorMapping.toggleMode();
                break;
            case 'ping':
                announcePresence(dataSource);
                break;
        }
    }

    function announcePresence(dataSource: DataSource): void {
        dataSource.write(Global_ProjectorHeartbeat, new ProjectorHeartbeat_t({
            id: CLIENT_ID,
            width: window.innerWidth,
            height: window.innerHeight,
            timestamp: Date.now(),
        }));
    }

    connect();
})();
