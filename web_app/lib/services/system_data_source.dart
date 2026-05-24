import 'dart:async';
import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:web_socket_channel/web_socket_channel.dart';

class DataSourceChangedArgs {
  final String variable;
  final dynamic data;
  DataSourceChangedArgs({required this.variable, this.data});
}

class SystemDataSource {
  WebSocketChannel? _channel;
  final String host;
  final int port;

  int _reqIdCounter = 0;
  final Map<String, Completer<dynamic>> _pendingReads = {};

  final StreamController<DataSourceChangedArgs> _updatesController =
      StreamController<DataSourceChangedArgs>.broadcast();

  SystemDataSource({required this.host, this.port = 8080});

  String get orchestratorHost => host;
  String get httpBaseUrl => 'http://$host:$port';

  Stream<DataSourceChangedArgs> get onDataSourceChanged =>
      _updatesController.stream;

  void connect() {
    final wsUrl = Uri.parse('ws://$host:$port/ws');
    _channel = WebSocketChannel.connect(wsUrl);

    _channel!.stream.listen(
      (message) {
        try {
          final data = jsonDecode(message);

          if (data['Topic'] == 'datasource' && data['Payload'] != null) {
            final payload = data['Payload'];
            _updatesController.add(
              DataSourceChangedArgs(
                variable: payload['variable'],
                data: payload['data'],
              ),
            );
            return;
          }

          if (data['action'] == 'read_response' ||
              data['action'] == 'read_error') {
            final reqId = data['req_id'];
            if (reqId != null && _pendingReads.containsKey(reqId)) {
              if (data['action'] == 'read_error') {
                _pendingReads[reqId]!.completeError(
                  data['error'] ?? 'Unknown read error',
                );
              } else {
                _pendingReads[reqId]!.complete(data['value']);
              }
              _pendingReads.remove(reqId);
            }
          }
        } catch (e) {
          debugPrint('DataSource parse error: $e');
        }
      },
      onDone: () {
        debugPrint('SystemDataSource disconnected. Reconnecting in 5s...');
        Future.delayed(const Duration(seconds: 5), connect);
      },
      onError: (error) => debugPrint('SystemDataSource Error: $error'),
    );
  }

  void disconnect() {
    _channel?.sink.close();
    _channel = null;
  }

  Future<dynamic> read(String key) {
    if (_channel == null) return Future.error('Not connected');

    final reqId = 'req_${++_reqIdCounter}';
    final completer = Completer<dynamic>();
    _pendingReads[reqId] = completer;

    _channel!.sink.add(
      jsonEncode({'action': 'read', 'key': key, 'req_id': reqId}),
    );

    return completer.future.timeout(
      const Duration(seconds: 5),
      onTimeout: () {
        _pendingReads.remove(reqId);
        throw TimeoutException('Read request timed out for key: $key');
      },
    );
  }

  void write(String key, dynamic value) {
    if (_channel == null) return;

    _channel!.sink.add(
      jsonEncode({'action': 'write', 'key': key, 'value': value}),
    );
  }
}
