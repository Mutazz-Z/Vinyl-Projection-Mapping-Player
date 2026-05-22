import 'dart:async';
import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:web_socket_channel/web_socket_channel.dart';

class DataSourceChangedArgs {
  final String variable;
  final dynamic data;
  const DataSourceChangedArgs({required this.variable, this.data});
}

class SystemDataSource {
  WebSocketChannel? _activeChannel;
  final int port;

  final String orchestratorHost;

  int _requestIdCounter = 0;
  final Map<String, Completer<dynamic>> _pendingReadRequests = {};

  final StreamController<DataSourceChangedArgs> _changedArgsStreamController =
      StreamController<DataSourceChangedArgs>.broadcast();

  SystemDataSource({required this.orchestratorHost, this.port = 8080});

  static SystemDataSource fromCurrentBrowserContext({int port = 8080}) {
    final String detectedHost = Uri.base.host;
    final String resolvedHost =
        (detectedHost.isNotEmpty && detectedHost != 'localhost')
        ? detectedHost
        : '127.0.0.1';
    return SystemDataSource(orchestratorHost: resolvedHost, port: port);
  }

  String get httpBaseUrl => 'http://$orchestratorHost:$port';

  Stream<DataSourceChangedArgs> get onDataSourceChanged =>
      _changedArgsStreamController.stream;

  void connect() {
    final Uri webSocketUri = Uri.parse('ws://$orchestratorHost:$port/ws');
    _activeChannel = WebSocketChannel.connect(webSocketUri);

    _activeChannel!.stream.listen(
      _dispatchIncomingMessage,
      onDone: _handleConnectionClosed,
      onError: (Object connectionError) =>
          debugPrint('SystemDataSource error: $connectionError'),
    );
  }

  void disconnect() {
    _activeChannel?.sink.close();
    _activeChannel = null;
  }

  Future<dynamic> read(String registryKey) {
    if (_activeChannel == null) {
      return Future.error('SystemDataSource is not connected');
    }

    final String requestId = 'req_${++_requestIdCounter}';
    final Completer<dynamic> responseCompleter = Completer<dynamic>();
    _pendingReadRequests[requestId] = responseCompleter;

    _activeChannel!.sink.add(
      jsonEncode({'action': 'read', 'key': registryKey, 'req_id': requestId}),
    );

    return responseCompleter.future.timeout(
      const Duration(seconds: 5),
      onTimeout: () {
        _pendingReadRequests.remove(requestId);
        throw TimeoutException('Read request timed out for key: $registryKey');
      },
    );
  }

  void write(String registryKey, dynamic value) {
    if (_activeChannel == null) return;

    _activeChannel!.sink.add(
      jsonEncode({'action': 'write', 'key': registryKey, 'value': value}),
    );
  }

  void _dispatchIncomingMessage(dynamic rawMessage) {
    try {
      final dynamic decodedMessage = jsonDecode(rawMessage as String);

      if (decodedMessage['Topic'] == 'datasource' &&
          decodedMessage['Payload'] != null) {
        _handleDataSourceChangedEvent(decodedMessage['Payload']);
        return;
      }

      if (decodedMessage['action'] == 'read_response' ||
          decodedMessage['action'] == 'read_error') {
        _handleReadResponse(decodedMessage);
      }
    } catch (parseError) {
      debugPrint('SystemDataSource message parse error: $parseError');
    }
  }

  void _handleDataSourceChangedEvent(dynamic eventPayload) {
    _changedArgsStreamController.add(
      DataSourceChangedArgs(
        variable: eventPayload['variable'] as String,
        data: eventPayload['data'],
      ),
    );
  }

  void _handleReadResponse(dynamic decodedMessage) {
    final String? requestId = decodedMessage['req_id'] as String?;
    if (requestId == null || !_pendingReadRequests.containsKey(requestId)) {
      return;
    }

    final Completer<dynamic> pendingCompleter = _pendingReadRequests.remove(
      requestId,
    )!;

    if (decodedMessage['action'] == 'read_error') {
      pendingCompleter.completeError(
        decodedMessage['error'] ?? 'Unknown read error',
      );
    } else {
      pendingCompleter.complete(decodedMessage['value']);
    }
  }

  void _handleConnectionClosed() {
    debugPrint('SystemDataSource disconnected. Reconnecting in 5s...');
    Future.delayed(const Duration(seconds: 5), connect);
  }
}
