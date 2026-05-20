(function () {
    const urlParams = new URLSearchParams(window.location.search);
    const hostIp = window.location.hostname || '127.0.0.1';

    function initWebSocket(wsHost, wsPort) {
        window.PI_IP = wsHost;
        const CLIENT_ID = 'projector_' + Math.random().toString(16).substring(2, 10);
        let ws;
        let reconnectTimer;

        function normalizePayload(p) {
            if (!p) return {};
            return {
                effect: p.effect !== undefined ? p.effect : (p.Effect !== undefined ? p.Effect : ''),
                artist: p.artist || p.ArtistName || '',
                album: p.album || p.AlbumTitle || '',
                tracks: p.tracks || p.TrackList || '',
                inner_record_color: p.inner_record_color || p.InnerRecordColor || '',
                inner_record_image: p.inner_record_image || p.InnerRecordImage || '',
                outer_design_color: p.outer_design_color || p.OuterDesignColor || '',
                outer_design_image: p.outer_design_image || p.OuterDesignImage || '',
                overlay_art: p.overlay_art || p.OverlayArt || '',
                album_cover_art: p.album_cover_art || p.AlbumCoverArt || '',
                uid: p.uid || p.UniqueIdentifier || '',
                registration_url: p.registration_url || p.RegistrationURL || '',
                message: p.message || p.ErrorMessage || p.ErrorMsg || '',

                position: p.position !== undefined ? p.position : p.Position,
                duration: p.duration !== undefined ? p.duration : p.Duration,
                track_index: p.track_idx !== undefined ? p.track_idx : (p.TrackIndex !== undefined ? p.TrackIndex : p.track_index),
                event: p.event || p.Event || '',
                state: p.state || p.State || '',
                playing: p.playing !== undefined ? p.playing : p.Playing,
                track_name: p.track_name || p.TrackName || ''
            };
        }

        function connect() {
            const wsUrl = `ws://${wsHost}:${wsPort}/ws`;
            console.log('Projector WS connecting to:', wsUrl);
            ws = new WebSocket(wsUrl);

            ws.onopen = function () {
                console.log('Projector WS Connected.');
                clearTimeout(reconnectTimer);
                announcePresence();
            };

            ws.onclose = function () {
                console.warn('Projector WS disconnected — retrying in 5s');
                reconnectTimer = setTimeout(connect, 5000);
            };

            ws.onerror = function (err) {
                console.error('WS Error:', err);
                ws.close();
            };

            ws.onmessage = function (event) {
                let msg;
                try {
                    msg = JSON.parse(event.data);
                } catch (e) {
                    return;
                }

                const topic = msg.Topic || msg.topic;
                if (!topic) return;

                let rawPayload = msg.Payload !== undefined ? msg.Payload : msg.payload;

                if (typeof rawPayload === 'string') {
                    try {
                        rawPayload = JSON.parse(rawPayload);
                    } catch (e) { }
                }

                const payload = normalizePayload(rawPayload);

                if (topic === 'projector_visual_update' || topic === 'vinyl/shelf/visuals') {
                    const effectStr = String(payload.effect).toLowerCase();

                    let isPlay = effectStr.includes('play');
                    let isStop = effectStr.includes('stop');
                    let isUnknown = effectStr.includes('unknown');
                    let isError = effectStr.includes('error');

                    if (!isPlay && !isStop && !isUnknown && !isError) {
                        if (payload.registration_url || payload.uid) {
                            isUnknown = true;
                        } else if (payload.message) {
                            isError = true;
                        } else if (payload.album || payload.artist || payload.tracks) {
                            isPlay = true;
                        } else {
                            isStop = true;
                        }
                    }

                    if (isPlay) {
                        window.ProjectorPlayback.startPlayback(payload);
                    } else if (isUnknown) {
                        window.ProjectorPlayback.showUnknownTag(payload);
                    } else if (isError) {
                        window.ProjectorPlayback.showPlaybackError(payload.message || "Playback failed.", payload);
                    } else if (isStop) {
                        window.ProjectorPlayback.stopPlayback();
                    }
                    return;
                }

                if (topic.includes('progress')) {
                    window.ProjectorPlayback.handleProgress(payload);
                    return;
                }

                if (topic.includes('state')) {
                    const eventName = String(payload.event).toLowerCase();
                    const stateName = String(payload.state).toLowerCase();

                    if (payload.position !== undefined) {
                        if (eventName !== 'pause' && eventName !== 'play') {
                            window.ProjectorPlayback.handleProgress(payload);
                        }
                    }

                    const isPlayingEvent = eventName === 'play' || eventName === 'track_changed';
                    const isPlayingState = stateName === 'playing' || payload.playing === true;

                    if (isPlayingEvent || isPlayingState) {
                        window.ProjectorPlayback.notifyMusicStarted(payload);
                    }

                    if (window.ProjectorPlayback && window.ProjectorPlayback.handlePlaybackEvent) {
                        window.ProjectorPlayback.handlePlaybackEvent(payload);
                    }
                }

                if (topic === 'projector_mapping' || topic === 'vinyl/shelf/mapping') {
                    if (payload.targetId && payload.targetId !== CLIENT_ID && payload.targetId !== 'all') {
                        return;
                    }

                    if (rawPayload.action === 'toggle') {
                        if (window.ProjectorMapping) window.ProjectorMapping.toggleMode();
                    } else if (rawPayload.action === 'layout' && rawPayload.data) {
                        if (window.ProjectorMapping) window.ProjectorMapping.updateLayout(rawPayload.data);
                    } else if (rawPayload.action === 'ping') {
                        announcePresence();
                    }
                }
            };
        }

        function announcePresence() {
            if (ws && ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({
                    Topic: 'projector_mapping_status',
                    Payload: {
                        id: CLIENT_ID,
                        width: window.innerWidth,
                        height: window.innerHeight
                    }
                }));
            }
        }

        connect();

    }
    const wsHost = urlParams.get('host') || hostIp || '127.0.0.1';
    const wsPort = urlParams.get('port') || 8080;
    initWebSocket(wsHost, wsPort);
})();