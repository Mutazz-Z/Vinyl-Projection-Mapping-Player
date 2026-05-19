import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;

class MusicAssistantSettings {
  String url = '';
  String token = '';
  String playerEntityId = '';
  String apiPath = '';
  String mqttHost = '';
  int mqttPort = 9001;

  bool get isConfigured => url.isNotEmpty && token.isNotEmpty;

  String get _apiUrl {
    if (kDebugMode && Uri.base.host == 'localhost') {
      return 'http://localhost:8100/api/config';
    }
    return '/api/config';
  }

  // Fallback helper for local states
  String get _orchestratorIp {
    final String host = Uri.base.host;
    return (host.isNotEmpty && host != 'localhost' && host != '127.0.0.1')
        ? host
        : '127.0.0.1';
  }

  Future<void> load() async {
    try {
      final response = await http
          .get(Uri.parse(_apiUrl))
          .timeout(const Duration(seconds: 3));

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);

        url = data['home_assistant_url'] ?? '';
        token = data['home_assistant_token'] ?? '';
        playerEntityId = data['home_assistant_player'] ?? '';
        apiPath = data['home_assistant_api_path'] ?? '';

        final savedHost = data['mqtt_host'] ?? '';
        mqttHost = savedHost.isNotEmpty ? savedHost : _orchestratorIp;

        final savedPort = data['mqtt_port'] ?? '';
        mqttPort = int.tryParse(savedPort.toString()) ?? 9001;
      }
    } catch (e) {
      debugPrint(
        'Settings Load Warning: Could not reach Go DB. Assuming fresh install. ($e)',
      );
      mqttHost = _orchestratorIp;
    }
  }

  Future<void> save({
    required String newUrl,
    required String newToken,
    required String newEntityId,
    required String newApiPath,
    required String newMqttHost,
    required int newMqttPort,
  }) async {
    url = normalizeUrl(newUrl);
    token = newToken.trim();
    playerEntityId = newEntityId.trim();
    apiPath = normalizeApiPath(newApiPath);
    mqttHost = newMqttHost.trim();
    mqttPort = newMqttPort;

    try {
      await http
          .post(
            Uri.parse(_apiUrl),
            headers: {'Content-Type': 'application/json'},
            body: jsonEncode({
              'home_assistant_url': url,
              'home_assistant_token': token,
              'home_assistant_player': playerEntityId,
              'home_assistant_api_path': apiPath,
              'mqtt_host': mqttHost,
              'mqtt_ws_port': mqttPort.toString(),
              'mqtt_tcp_port': '1883',
            }),
          )
          .timeout(const Duration(seconds: 3));
      debugPrint('Settings successfully synced to Go Database.');
    } catch (e) {
      debugPrint('Settings Save Error: Could not sync to Go Database. ($e)');
      throw Exception('Failed to save settings to backend.');
    }
  }

  Future<void> updateApiPath(String newPath) async {
    final normalized = normalizeApiPath(newPath);
    if (apiPath != normalized) {
      apiPath = normalized;
      await save(
        newUrl: url,
        newToken: token,
        newEntityId: playerEntityId,
        newApiPath: apiPath,
        newMqttHost: mqttHost,
        newMqttPort: mqttPort,
      );
    }
  }

  String normalizeUrl(String value) {
    String normalized = value.trim();
    if (!normalized.startsWith('http://') &&
        !normalized.startsWith('https://')) {
      normalized = 'https://$normalized';
    }
    return normalized.replaceAll(RegExp(r'/api/?$'), '');
  }

  String normalizeApiPath(String value) {
    String normalized = value.trim();
    if (normalized.isEmpty) return '';
    if (normalized.startsWith('/')) normalized = normalized.substring(1);
    if (!normalized.endsWith('/')) normalized = '$normalized/';
    return normalized;
  }
}
