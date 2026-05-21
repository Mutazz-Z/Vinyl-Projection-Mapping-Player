import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;

class MusicAssistantSettings {
  String musicAssistantUrlString = '';
  String musicAssistantTokenString = '';
  String musicAssistantPlayerIdString = '';
  String mqttHostAddressString = '';
  int mqttWebSocketPortNumber = 9001;

  bool get isConfigured =>
      musicAssistantUrlString.isNotEmpty &&
      musicAssistantTokenString.isNotEmpty;

  String retrieveConfigurationApiEndpoint() {
    if (kDebugMode && Uri.base.host == 'localhost') {
      return 'http://localhost:8080/api/config';
    }
    return '/api/config';
  }

  String retrieveFallbackOrchestratorHostAddress() {
    final String baseHostAddressString = Uri.base.host;
    if (baseHostAddressString.isNotEmpty &&
        baseHostAddressString != 'localhost' &&
        baseHostAddressString != '127.0.0.1') {
      return baseHostAddressString;
    }
    return '127.0.0.1';
  }

  Future<void> load() async {
    try {
      final Uri configurationEndpointUri = Uri.parse(
        retrieveConfigurationApiEndpoint(),
      );
      final http.Response networkResponse = await http
          .get(configurationEndpointUri)
          .timeout(const Duration(seconds: 3));

      if (networkResponse.statusCode == 200) {
        final Map<String, dynamic> decodedConfigurationDataMap = jsonDecode(
          networkResponse.body,
        );

        musicAssistantUrlString = extractStringValueFromMap(
          decodedConfigurationDataMap,
          'GLOBAL_MusicAssistantUrl',
        );
        musicAssistantTokenString = extractStringValueFromMap(
          decodedConfigurationDataMap,
          'GLOBAL_MusicAssistantToken',
        );
        musicAssistantPlayerIdString = extractStringValueFromMap(
          decodedConfigurationDataMap,
          'GLOBAL_MusicAssistantTargetPlayerId',
        );

        final String savedMqttHostAddressString = extractStringValueFromMap(
          decodedConfigurationDataMap,
          'mqtt_host',
        );
        mqttHostAddressString = savedMqttHostAddressString.isNotEmpty
            ? savedMqttHostAddressString
            : retrieveFallbackOrchestratorHostAddress();

        final String savedMqttPortString = extractStringValueFromMap(
          decodedConfigurationDataMap,
          'mqtt_ws_port',
        );
        mqttWebSocketPortNumber = int.tryParse(savedMqttPortString) ?? 9001;
      }
    } catch (networkException) {
      mqttHostAddressString = retrieveFallbackOrchestratorHostAddress();
    }
  }

  String extractStringValueFromMap(
    Map<String, dynamic> configurationDataMap,
    String targetKeyString,
  ) {
    final dynamic retrievedValue = configurationDataMap[targetKeyString];
    if (retrievedValue is String) {
      return retrievedValue;
    }
    return '';
  }

  Future<void> save({
    required String targetMusicAssistantUrl,
    required String targetMusicAssistantToken,
    required String targetMusicAssistantPlayerId,
    required String targetMqttHostAddress,
    required int targetMqttWebSocketPort,
  }) async {
    musicAssistantUrlString = normalizeUrlString(targetMusicAssistantUrl);
    musicAssistantTokenString = targetMusicAssistantToken.trim();
    musicAssistantPlayerIdString = targetMusicAssistantPlayerId.trim();
    mqttHostAddressString = targetMqttHostAddress.trim();
    mqttWebSocketPortNumber = targetMqttWebSocketPort;

    try {
      final Uri configurationEndpointUri = Uri.parse(
        retrieveConfigurationApiEndpoint(),
      );
      final Map<String, String> configurationPayloadMap = {
        'GLOBAL_MusicAssistantUrl': musicAssistantUrlString,
        'GLOBAL_MusicAssistantToken': musicAssistantTokenString,
        'GLOBAL_MusicAssistantTargetPlayerId': musicAssistantPlayerIdString,
        'mqtt_host': mqttHostAddressString,
        'mqtt_ws_port': mqttWebSocketPortNumber.toString(),
        'GLOBAL_MqttTcpPort': '1883',
      };

      await http
          .post(
            configurationEndpointUri,
            headers: {'Content-Type': 'application/json'},
            body: jsonEncode(configurationPayloadMap),
          )
          .timeout(const Duration(seconds: 3));
    } catch (networkException) {
      throw Exception('Failed to save settings to backend.');
    }
  }

  String normalizeUrlString(String rawUrlString) {
    String normalizedUrlString = rawUrlString.trim();
    if (!normalizedUrlString.startsWith('http://') &&
        !normalizedUrlString.startsWith('https://')) {
      normalizedUrlString = 'http://$normalizedUrlString';
    }
    return normalizedUrlString
        .replaceAll(RegExp(r'/api/?$'), '')
        .replaceAll(RegExp(r'/$'), '');
  }
}
