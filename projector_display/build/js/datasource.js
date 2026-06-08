"use strict";
// ==========================================
// datasource.ts
// ==========================================
class DataSource {
    constructor(webSocket) {
        this._webSocket = webSocket;
        this._pendingReads = {};
        this._topicSubscribers = {};
        this._onChangedCallback = function () { };
        webSocket.addEventListener('message', (event) => DataSource__dispatch(this, event));
    }
}
function DataSource__dispatch(dataSource, messageEvent) {
    const message = JSON.parse(String(messageEvent.data));
    if (message.action === 'read_response' || message.action === 'read_error') {
        if (!message.req_id)
            return;
        const pending = dataSource._pendingReads[message.req_id];
        if (!pending)
            return;
        clearTimeout(pending.timeoutId);
        delete dataSource._pendingReads[message.req_id];
        if (message.action === 'read_error') {
            const requestedKey = message.key;
            const keyLabel = typeof requestedKey === 'string' && requestedKey ? requestedKey : 'unknown-key';
            pending.reject(new Error(`DataSource_Read('${keyLabel}') failed: ${message.error}`));
        }
        else {
            pending.resolve(message.value);
        }
        return;
    }
    const topic = message.Topic;
    const payload = message.Payload;
    if (topic === 'datasource') {
        dataSource._onChangedCallback(payload?.variable, payload?.data);
        return;
    }
    if (!topic)
        return;
    const subscribers = dataSource._topicSubscribers[topic];
    if (subscribers) {
        subscribers.forEach(function (callback) {
            callback(payload);
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
                resolve((fromJson && value != null ? fromJson(value) : value));
            },
            reject,
            timeoutId,
        };
        DataSource__send(dataSource, { action: 'read', key: keyStr, req_id: requestId });
    });
}
function DataSource_Write(dataSource, keyDef, value) {
    const keyStr = typeof keyDef === 'object' ? keyDef.key : keyDef;
    const serialised = (value && typeof value === 'object' && 'toJson' in value && typeof value.toJson === 'function')
        ? value.toJson()
        : value;
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
