// ==========================================
// datasource.ts
// ==========================================

type KeyDef<T = unknown> = string | {
    key: string;
    fromJson?: (json: unknown) => T;
};

type PendingRead = {
    resolve: (value: unknown) => void;
    reject: (reason?: unknown) => void;
    timeoutId: ReturnType<typeof setTimeout>;
};

type DataSourceMessage = {
    action?: string;
    req_id?: string;
    error?: string;
    value?: unknown;
    Topic?: string;
    Payload?: {
        variable?: unknown;
        data?: unknown;
    };
};

class DataSource {
    _webSocket: WebSocket;
    _pendingReads: Record<string, PendingRead>;
    _topicSubscribers: Record<string, Array<(payload: unknown) => void>>;
    _onChangedCallback: (variable: unknown, data: unknown) => void;

    constructor(webSocket: WebSocket) {
        this._webSocket = webSocket;
        this._pendingReads = {};
        this._topicSubscribers = {};
        this._onChangedCallback = function () { };

        webSocket.addEventListener('message', (event) => DataSource__dispatch(this, event));
    }
}

function DataSource__dispatch(dataSource: DataSource, messageEvent: MessageEvent): void {
    const message = JSON.parse(String(messageEvent.data)) as DataSourceMessage;

    if (message.action === 'read_response' || message.action === 'read_error') {
        if (!message.req_id) return;
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

    const topic = message.Topic;
    const payload = message.Payload;

    if (topic === 'datasource') {
        dataSource._onChangedCallback(payload?.variable, payload?.data);
        return;
    }

    if (!topic) return;
    const subscribers = dataSource._topicSubscribers[topic];
    if (subscribers) {
        subscribers.forEach(function (callback) {
            callback(payload);
        });
    }
}

function DataSource__send(dataSource: DataSource, object: unknown): void {
    if (dataSource._webSocket.readyState === WebSocket.OPEN) {
        dataSource._webSocket.send(JSON.stringify(object));
    }
}

function DataSource__makeRequestId(): string {
    return Math.random().toString(36).slice(2, 10);
}

function DataSource_Read<T = unknown>(dataSource: DataSource, keyDef: KeyDef<T>): Promise<T> {
    const keyStr = typeof keyDef === 'object' ? keyDef.key : keyDef;
    const fromJson = typeof keyDef === 'object' ? keyDef.fromJson : null;

    return new Promise<T>(function (resolve, reject) {
        const requestId = DataSource__makeRequestId();
        const timeoutId = setTimeout(function () {
            delete dataSource._pendingReads[requestId];
            reject(new Error(`DataSource_Read('${keyStr}') timed out`));
        }, 5000);

        dataSource._pendingReads[requestId] = {
            resolve: function (value) {
                resolve((fromJson && value != null ? fromJson(value) : value) as T);
            },
            reject,
            timeoutId,
        };

        DataSource__send(dataSource, { action: 'read', key: keyStr, req_id: requestId });
    });
}

function DataSource_Write(dataSource: DataSource, keyDef: KeyDef, value: unknown): void {
    const keyStr = typeof keyDef === 'object' ? keyDef.key : keyDef;
    const serialised = (value && typeof value === 'object' && 'toJson' in value && typeof (value as { toJson?: unknown }).toJson === 'function')
        ? (value as { toJson: () => unknown }).toJson()
        : value;
    DataSource__send(dataSource, { action: 'write', key: keyStr, value: serialised });
}

function DataSource_Subscribe(dataSource: DataSource, topic: string, callback: (payload: unknown) => void): void {
    if (!dataSource._topicSubscribers[topic]) {
        dataSource._topicSubscribers[topic] = [];
        DataSource__send(dataSource, { action: 'subscribe', topic: topic });
    }
    dataSource._topicSubscribers[topic].push(callback);
}

function DataSource_OnChanged(dataSource: DataSource, callback: (variable: unknown, data: unknown) => void): void {
    dataSource._onChangedCallback = callback;
}
