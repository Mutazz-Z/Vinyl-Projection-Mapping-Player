// ==========================================
// datasource.js
// ==========================================

// DataSource is a plain object. Use the free functions below to interact with it.
// This mirrors the Go DataSource interface:
//
//   DataSource_Read(dataSource, Global_SomeVar)          → Promise<value>
//   DataSource_Write(dataSource, Global_SomeVar, value)
//   DataSource_Subscribe(dataSource, topic, callback)
//   DataSource_OnChanged(dataSource, callback)

class DataSource {
    constructor(webSocket) {
        this._webSocket = webSocket;
        this._pendingReads = {};
        this._topicSubscribers = {};
        this._onChangedCallback = function (variable, data) { };

        webSocket.addEventListener('message', (event) => DataSource__dispatch(this, event));
    }
}

// ── Internal dispatch (private) ───────────────────────────────────────────────

function DataSource__dispatch(dataSource, messageEvent) {
    let message;
    try {
        message = JSON.parse(messageEvent.data);
    } catch (error) {
        return;
    }

    if (message.action === 'read_response' || message.action === 'read_error') {
        const pending = dataSource._pendingReads[message.req_id];
        if (!pending) return;

        clearTimeout(pending.timeoutId);
        delete dataSource._pendingReads[message.req_id];

        if (message.action === 'read_error') {
            pending.reject(new Error(message.error));
        } else {
            pending.resolve(message.value);
        }
        return;
    }

    const topic = message.Topic ?? message.topic;
    const payload = message.Payload ?? message.payload;

    if (!topic) return;

    if (topic === 'datasource') {
        const variableKey = payload?.variable ?? payload?.key ?? payload?.Key;
        const variableData = payload?.data !== undefined ? payload.data
            : payload?.value !== undefined ? payload.value
                : payload?.Value;

        if (variableKey !== undefined && variableData !== undefined) {
            try {
                dataSource._onChangedCallback(variableKey, variableData);
            } catch (error) {
                console.error('DataSource: OnChanged callback error:', error);
            }
        }
        return;
    }

    const subscribers = dataSource._topicSubscribers[topic];
    if (subscribers) {
        subscribers.forEach(function (callback) {
            try {
                callback(payload);
            } catch (error) {
                console.error(`DataSource: subscriber error on topic "${topic}":`, error);
            }
        });
    }
}

function DataSource__send(dataSource, object) {
    if (dataSource._webSocket.readyState === WebSocket.OPEN) {
        dataSource._webSocket.send(JSON.stringify(object));
    }
}

function DataSource__makeRequestId() {
    return Math.random().toString(36).slice(2, 10);
}

// ── Public API ────────────────────────────────────────────────────────────────

function DataSource_Read(dataSource, keyDef) {
    const keyStr = typeof keyDef === 'object' ? keyDef.key : keyDef;
    const fromJson = typeof keyDef === 'object' ? keyDef.fromJson : null;

    return new Promise(function (resolve, reject) {
        const requestId = DataSource__makeRequestId();
        const timeoutId = setTimeout(function () {
            delete dataSource._pendingReads[requestId];
            reject(new Error(`DataSource_Read('${keyStr}') timed out`));
        }, 5000);

        dataSource._pendingReads[requestId] = {
            resolve: function (value) {
                resolve(fromJson && value != null ? fromJson(value) : value);
            },
            reject,
            timeoutId,
        };
        DataSource__send(dataSource, { action: 'read', key: keyStr, req_id: requestId });
    });
}

function DataSource_Write(dataSource, keyDef, value) {
    const keyStr = typeof keyDef === 'object' ? keyDef.key : keyDef;
    const serialised = (value && typeof value.toJson === 'function') ? value.toJson() : value;
    DataSource__send(dataSource, { action: 'write', key: keyStr, value: serialised });
}

function DataSource_Subscribe(dataSource, topic, callback) {
    if (!dataSource._topicSubscribers[topic]) {
        dataSource._topicSubscribers[topic] = [];
        DataSource__send(dataSource, { action: 'subscribe', topic: topic });
    }
    dataSource._topicSubscribers[topic].push(callback);
}

function DataSource_OnChanged(dataSource, callback) {
    dataSource._onChangedCallback = callback;
}