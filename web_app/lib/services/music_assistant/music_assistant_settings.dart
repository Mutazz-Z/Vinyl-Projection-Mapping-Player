import 'package:flutter/foundation.dart';
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
      musicAssistantUrlString = (await systemDataSource.read('GLOBAL_MusicAssistantUrl')).toString();
      musicAssistantTokenString = (await systemDataSource.read('GLOBAL_MusicAssistantToken')).toString();
      musicAssistantPlayerIdString = (await systemDataSource.read('GLOBAL_MusicAssistantTargetPlayerId')).toString();
      mqttHostAddressString = (await systemDataSource.read('GLOBAL_MqttBrokerHostAddress')).toString();
      mqttWebSocketPortNumber = await systemDataSource.read('GLOBAL_MqttWebSocketPort');
 
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
      systemDataSource.write('GLOBAL_MusicAssistantUrl', musicAssistantUrlString);
      systemDataSource.write('GLOBAL_MusicAssistantToken', musicAssistantTokenString);
      systemDataSource.write('GLOBAL_MusicAssistantTargetPlayerId', musicAssistantPlayerIdString);
      systemDataSource.write('GLOBAL_MqttBrokerHostAddress', mqttHostAddressString);
      systemDataSource.write('GLOBAL_MqttWebSocketPort', mqttWebSocketPortNumber);
      systemDataSource.write('GLOBAL_MqttTcpPort', 1883);

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
