import 'package:flutter/foundation.dart';
import 'package:web_app/factories/state.dart';
import 'package:web_app/main.dart';

class MusicAssistantSettings {
  String musicAssistantUrlString = '';
  String musicAssistantTokenString = '';
  String musicAssistantPlayerIdString = '';
  String mqttHostAddressString = '';
  int mqttWebSocketPortNumber = 9001;

  bool get isConfigured =>
      musicAssistantUrlString.isNotEmpty &&
      musicAssistantTokenString.isNotEmpty;

  Future<void> load() async {
    try {
      musicAssistantUrlString = (await systemDataSource.read(globalMusicAssistantUrl)).toString();
      musicAssistantTokenString = (await systemDataSource.read(globalMusicAssistantToken)).toString();
      musicAssistantPlayerIdString = (await systemDataSource.read(globalMusicAssistantTargetPlayerId)).toString();
      mqttHostAddressString = (await systemDataSource.read(globalMqttBrokerHostAddress)).toString();
      mqttWebSocketPortNumber = await systemDataSource.read(globalMqttWebSocketPort);
 
    } catch (error) {
      debugPrint('CRITICAL: Failed to load settings from registry: $error');
    }
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
      systemDataSource.write(globalMusicAssistantUrl, musicAssistantUrlString);
      systemDataSource.write(globalMusicAssistantToken, musicAssistantTokenString);
      systemDataSource.write(globalMusicAssistantTargetPlayerId, musicAssistantPlayerIdString);
      systemDataSource.write(globalMqttBrokerHostAddress, mqttHostAddressString);
      systemDataSource.write(globalMqttWebSocketPort, mqttWebSocketPortNumber);
      systemDataSource.write(globalMqttTcpPort, 1883);

      await Future.delayed(const Duration(milliseconds: 150));
    } catch (error) {
      throw Exception('Failed to save settings via SystemDataSource: $error');
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
