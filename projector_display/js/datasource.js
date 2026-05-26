class DataSource {
    constructor(ws) {
        this._ws = ws;
        this._pending = {};
        this._subscribers = {};

        this.OnDataSourceChanged = function (ctx, args) { };

        ws.addEventListener('message', (e) => this._dispatch(e));
    }

    read(key) {
        return new Promise((resolve, reject) => {
            const reqId = this._makeId();
            const timeoutId = setTimeout(() => {
                delete this._pending[reqId];
                reject(new Error(`DS.read('${key}') timed out`));
            }, 5000);
            this._pending[reqId] = { resolve, reject, timeoutId };
            this._send({ action: 'read', key, req_id: reqId });
        });
    }

    write(key, value) {
        this._send({ action: 'write', key, value });
    }

    subscribe(topic, callback) {
        if (!this._subscribers[topic]) {
            this._subscribers[topic] = [];
            this._send({ action: 'subscribe', topic });
        }
        this._subscribers[topic].push(callback);
    }

    _dispatch(messageEvent) {
        let msg;
        try { msg = JSON.parse(messageEvent.data); } catch (e) { return; }

        if (msg.action === 'read_response' || msg.action === 'read_error') {
            const pending = this._pending[msg.req_id];
            if (!pending) return;
            clearTimeout(pending.timeoutId);
            delete this._pending[msg.req_id];
            if (msg.action === 'read_error') {
                pending.reject(new Error(msg.error));
            } else {
                pending.resolve(msg.value);
            }
            return;
        }

        const topic = msg.Topic ?? msg.topic;
        const payload = msg.Payload ?? msg.payload;

        if (!topic) return;

        if (topic === 'datasource') {
            const varName = payload?.variable ?? payload?.key ?? payload?.Key;
            const varData = payload?.data !== undefined ? payload.data : (payload?.value !== undefined ? payload.value : payload?.Value);

            if (varName !== undefined && varData !== undefined) {
                try {
                    this.OnDataSourceChanged(this, {
                        variable: varName,
                        data: varData,
                    });
                } catch (e) {
                    console.error('OnDataSourceChanged error:', e);
                }
            }
            return;
        }

        if (this._subscribers[topic]) {
            this._subscribers[topic].forEach(cb => {
                try { cb(payload); } catch (e) {
                    console.error(`DataSource subscriber error [${topic}]:`, e);
                }
            });
        }
    }

    _send(obj) {
        if (this._ws.readyState === WebSocket.OPEN) {
            this._ws.send(JSON.stringify(obj));
        }
    }

    _makeId() {
        return Math.random().toString(36).slice(2, 10);
    }
}