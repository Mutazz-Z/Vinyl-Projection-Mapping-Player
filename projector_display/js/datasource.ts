export type KeyDefinition<Type = unknown> = string | {
    key: string;
    fromJson?: (json: unknown) => Type;
};

export interface PendingReadRequest {
    resolve: (value: unknown) => void;
    reject: (reason?: Error) => void;
    timeoutIdentifier: ReturnType<typeof setTimeout>;
}

export interface WebSocketMessage {
    action?: string;
    req_id?: string;
    error?: string;
    value?: unknown;
    Topic?: string;
    Payload?: unknown;
}

export interface DataSourceChangedPayload {
    variable?: unknown;
    data?: unknown;
}

export class DataSource {
    private webSocketConnection: WebSocket;
    private pendingReadRequests: Record<string, PendingReadRequest>;
    private eventSubscribers: Record<string, Array<(payload: unknown) => void>>;
    private stateChangedCallbacks: Array<(variable: unknown, data: unknown) => void>;

    constructor(webSocketConnection: WebSocket) {
        this.webSocketConnection = webSocketConnection;
        this.pendingReadRequests = {};
        this.eventSubscribers = {};
        this.stateChangedCallbacks = [];

        this.webSocketConnection.addEventListener('message', (messageEvent) => this.dispatchMessage(messageEvent));
    }

    private dispatchMessage(messageEvent: MessageEvent): void {
        const message = JSON.parse(String(messageEvent.data)) as WebSocketMessage;

        if (message.action === 'read_response' || message.action === 'read_error') {
            if (!message.req_id) {
                return;
            }
            const pendingRequest = this.pendingReadRequests[message.req_id];
            if (!pendingRequest) {
                return;
            }

            clearTimeout(pendingRequest.timeoutIdentifier);
            delete this.pendingReadRequests[message.req_id];

            if (message.action === 'read_error') {
                const requestedKey = (message as { key?: unknown }).key;
                const keyLabel = typeof requestedKey === 'string' && requestedKey ? requestedKey : 'unknown-key';
                pendingRequest.reject(new Error(`Read operation for '${keyLabel}' failed: ${message.error}`));
            } else {
                pendingRequest.resolve(message.value);
            }
            return;
        }

        const topic = message.Topic;
        const payload = message.Payload;

        if (topic === 'datasource') {
            const changedPayload = payload as DataSourceChangedPayload;
            this.stateChangedCallbacks.forEach((callback) => {
                callback(changedPayload.variable, changedPayload.data);
            });
            return;
        }

        if (!topic) {
            return;
        }

        const subscribers = this.eventSubscribers[topic];
        if (subscribers) {
            subscribers.forEach((callback) => {
                callback(payload);
            });
        }
    }

    private sendNetworkMessage(messageObject: unknown): void {
        if (this.webSocketConnection.readyState === WebSocket.OPEN) {
            this.webSocketConnection.send(JSON.stringify(messageObject));
        }
    }

    private generateRequestIdentifier(): string {
        return Math.random().toString(36).slice(2, 10);
    }

    public read<Type = unknown>(keyDefinition: KeyDefinition<Type>): Promise<Type> {
        const keyString = typeof keyDefinition === 'object' ? keyDefinition.key : keyDefinition;
        const parseFunction = typeof keyDefinition === 'object' ? keyDefinition.fromJson : null;

        return new Promise<Type>((resolve, reject) => {
            const requestIdentifier = this.generateRequestIdentifier();
            const timeoutIdentifier = setTimeout(() => {
                delete this.pendingReadRequests[requestIdentifier];
                reject(new Error(`Read operation for '${keyString}' timed out`));
            }, 5000);

            this.pendingReadRequests[requestIdentifier] = {
                resolve: (value: unknown) => {
                    resolve((parseFunction && value != null ? parseFunction(value) : value) as Type);
                },
                reject: reject,
                timeoutIdentifier: timeoutIdentifier,
            };

            this.sendNetworkMessage({ action: 'read', key: keyString, req_id: requestIdentifier });
        });
    }

    public write(keyDefinition: KeyDefinition, value: unknown): void {
        const keyString = typeof keyDefinition === 'object' ? keyDefinition.key : keyDefinition;

        let serializedValue = value;
        if (value && typeof value === 'object' && 'toJson' in value && typeof (value as { toJson?: unknown }).toJson === 'function') {
            serializedValue = (value as { toJson: () => unknown }).toJson();
        }

        this.sendNetworkMessage({ action: 'write', key: keyString, value: serializedValue });
    }

    public subscribe(topic: string, callback: (payload: unknown) => void): void {
        if (!this.eventSubscribers[topic]) {
            this.eventSubscribers[topic] = [];
            this.sendNetworkMessage({ action: 'subscribe', topic: topic });
        }
        this.eventSubscribers[topic].push(callback);
    }

    public onStateChanged(callback: (variable: unknown, data: unknown) => void): void {
        this.stateChangedCallbacks.push(callback);
    }
}