(function () {
    const urlParams = new URLSearchParams(window.location.search);
    const hostIp = window.location.hostname || '127.0.0.1';

    function initMqtt(brokerIp, brokerPort) {
        window.PI_IP = brokerIp;
        const CLIENT_ID = 'projector_' + Math.random().toString(16).substring(2, 10);

        const client = new Paho.MQTT.Client(
            brokerIp,
            parseInt(brokerPort, 10),
            CLIENT_ID
        );

        client.onConnectionLost = function () {
            console.warn('Projector MQTT disconnected — retrying in 5s');
            setTimeout(function () {
                client.connect({ onSuccess: onConnect, useSSL: false });
            }, 5000);
        };

        function announcePresence() {
            const statusPayload = {
                id: CLIENT_ID,
                width: window.innerWidth,
                height: window.innerHeight
            };
            const statusMsg = new Paho.MQTT.Message(JSON.stringify(statusPayload));
            statusMsg.destinationName = 'vinyl/shelf/mapping/status';
            client.send(statusMsg);
        }

        client.onMessageArrived = function (message) {
            const topic = message.destinationName;
            let payload;

            try {
                payload = JSON.parse(message.payloadString);
            } catch (e) {
                return;
            }

            if (topic === 'vinyl/shelf/mapping') {
                if (payload.targetId && payload.targetId !== CLIENT_ID && payload.targetId !== 'all') {
                    return;
                }

                if (payload.action === 'toggle') {
                    if (window.ProjectorMapping) window.ProjectorMapping.toggleMode();
                }
                else if (payload.action === 'layout' && payload.data) {
                    if (window.ProjectorMapping) window.ProjectorMapping.updateLayout(payload.data);
                }
                else if (payload.action === 'ping') {
                    announcePresence();
                }
                return;
            }

            if (topic === 'vinyl/shelf/visuals') {
                switch (payload.effect) {
                    case 'play':
                        window.ProjectorPlayback.startPlayback(payload);
                        break;
                    case 'stop':
                        window.ProjectorPlayback.stopPlayback();
                        break;
                    case 'unknown':
                        window.ProjectorPlayback.showUnknownTag(payload);
                        break;
                    case 'error':
                        window.ProjectorPlayback.showPlaybackError(payload.message || "Playback failed to start.", payload);
                        break;
                }
                return;
            }

            if (topic === 'vinyl/shelf/visuals/progress') {
                window.ProjectorPlayback.handleProgress(payload);
                return;
            }

            if (topic === 'vinyl/shelf/playback/state') {
                if (payload && payload.track_idx === undefined && payload.track_index !== undefined) {
                    payload.track_idx = payload.track_index;
                }

                const eventName = typeof payload.event === 'string' ? payload.event.toLowerCase() : '';
                const stateName = typeof payload.state === 'string' ? payload.state.toLowerCase() : '';

                if (payload && payload.position !== undefined && payload.duration !== undefined) {
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
        };

        function onConnect() {
            console.log('Projector MQTT connected to ' + brokerIp + ':' + brokerPort);
            client.subscribe('vinyl/shelf/visuals');
            client.subscribe('vinyl/shelf/visuals/progress');
            client.subscribe('vinyl/shelf/playback/state');
            client.subscribe('vinyl/shelf/mapping');

            announcePresence();
        }

        client.connect({ onSuccess: onConnect, useSSL: false });
    }

    fetch(`http://${hostIp}:8100/api/config`)
        .then(res => res.json())
        .then(data => {
            const brokerIp = data.mqtt_host || urlParams.get('broker') || hostIp;
            const brokerPort = data.mqtt_ws_port || urlParams.get('port') || 9001;
            initMqtt(brokerIp, brokerPort);
        })
        .catch(err => {
            console.warn("Could not load global config, falling back to defaults.", err);
            const fallbackIp = urlParams.get('broker') || hostIp || '192.168.50.214';
            const fallbackPort = urlParams.get('port') || 9001;
            initMqtt(fallbackIp, fallbackPort);
        });
})();