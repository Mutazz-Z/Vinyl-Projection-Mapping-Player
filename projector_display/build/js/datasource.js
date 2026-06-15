"use strict";
(() => {
  // js/datasource.ts
  var DataSource = class {
    constructor(webSocketConnection) {
      this.webSocketConnection = webSocketConnection;
      this.pendingReadRequests = {};
      this.eventSubscribers = {};
      this.stateChangedCallbacks = [];
      this.webSocketConnection.addEventListener("message", (messageEvent) => this.dispatchMessage(messageEvent));
    }
    dispatchMessage(messageEvent) {
      const message = JSON.parse(String(messageEvent.data));
      if (message.action === "read_response" || message.action === "read_error") {
        if (!message.req_id) {
          return;
        }
        const pendingRequest = this.pendingReadRequests[message.req_id];
        if (!pendingRequest) {
          return;
        }
        clearTimeout(pendingRequest.timeoutIdentifier);
        delete this.pendingReadRequests[message.req_id];
        if (message.action === "read_error") {
          const requestedKey = message.key;
          const keyLabel = typeof requestedKey === "string" && requestedKey ? requestedKey : "unknown-key";
          pendingRequest.reject(new Error(`Read operation for '${keyLabel}' failed: ${message.error}`));
        } else {
          pendingRequest.resolve(message.value);
        }
        return;
      }
      const topic = message.Topic;
      const payload = message.Payload;
      if (topic === "datasource") {
        const changedPayload = payload;
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
    sendNetworkMessage(messageObject) {
      if (this.webSocketConnection.readyState === WebSocket.OPEN) {
        this.webSocketConnection.send(JSON.stringify(messageObject));
      }
    }
    generateRequestIdentifier() {
      return Math.random().toString(36).slice(2, 10);
    }
    read(keyDefinition) {
      const keyString = typeof keyDefinition === "object" ? keyDefinition.key : keyDefinition;
      const parseFunction = typeof keyDefinition === "object" ? keyDefinition.fromJson : null;
      return new Promise((resolve, reject) => {
        const requestIdentifier = this.generateRequestIdentifier();
        const timeoutIdentifier = setTimeout(() => {
          delete this.pendingReadRequests[requestIdentifier];
          reject(new Error(`Read operation for '${keyString}' timed out`));
        }, 5e3);
        this.pendingReadRequests[requestIdentifier] = {
          resolve: (value) => {
            resolve(parseFunction && value != null ? parseFunction(value) : value);
          },
          reject,
          timeoutIdentifier
        };
        this.sendNetworkMessage({ action: "read", key: keyString, req_id: requestIdentifier });
      });
    }
    write(keyDefinition, value) {
      const keyString = typeof keyDefinition === "object" ? keyDefinition.key : keyDefinition;
      let serializedValue = value;
      if (value && typeof value === "object" && "toJson" in value && typeof value.toJson === "function") {
        serializedValue = value.toJson();
      }
      this.sendNetworkMessage({ action: "write", key: keyString, value: serializedValue });
    }
    subscribe(topic, callback) {
      if (!this.eventSubscribers[topic]) {
        this.eventSubscribers[topic] = [];
        this.sendNetworkMessage({ action: "subscribe", topic });
      }
      this.eventSubscribers[topic].push(callback);
    }
    onStateChanged(callback) {
      this.stateChangedCallbacks.push(callback);
    }
  };
})();
