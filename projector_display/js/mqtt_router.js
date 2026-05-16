(function () {
    const PI_IP = '192.168.50.214';
    const PORT = 9001;

    window.PI_IP = PI_IP;

    const client = new Paho.MQTT.Client(
        PI_IP,
        PORT,
        'projector_' + Math.random().toString(16).substring(2, 10)
    );

    client.onConnectionLost = function () {
        console.warn('Projector MQTT disconnected — retrying in 5 s');
        setTimeout(function () {
            client.connect({ onSuccess: onConnect, useSSL: false });
        }, 5000);
    };

    client.onMessageArrived = function (message) {
        const topic = message.destinationName;
        let payload;

        try {
            payload = JSON.parse(message.payloadString);
        } catch (e) {
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
                    window.ProjectorPlayback.showPlaybackError(payload.message || "Playback failed to start.", payload); break;
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

            if (payload && payload.position !== undefined && payload.duration !== undefined) {
                window.ProjectorPlayback.handleProgress(payload);
            }

            const eventName = typeof payload.event === 'string' ? payload.event.toLowerCase() : '';
            const stateName = typeof payload.state === 'string' ? payload.state.toLowerCase() : '';
            const isPlayingEvent = eventName === 'play' || eventName === 'track_changed';
            const isPlayingState = stateName === 'playing' || payload.playing === true;

            if (isPlayingEvent || isPlayingState) {
                window.ProjectorPlayback.notifyMusicStarted(payload);
            }
        }
    };

    function onConnect() {
        console.log('Projector MQTT connected');
        client.subscribe('vinyl/shelf/visuals');
        client.subscribe('vinyl/shelf/visuals/progress');
        client.subscribe('vinyl/shelf/playback/state');
    }

    client.connect({ onSuccess: onConnect, useSSL: false });
})();
