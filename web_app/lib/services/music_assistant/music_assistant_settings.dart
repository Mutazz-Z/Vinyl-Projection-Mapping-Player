import 'package:shared_preferences/shared_preferences.dart';

class MusicAssistantSettings {
  String url;
  String token;
  String playerEntityId;
  String apiPath;
  String mqttHost;
  int mqttPort;

  MusicAssistantSettings({
    this.url = const String.fromEnvironment('HOME_ASSISTANT_URL'),
    this.token = const String.fromEnvironment('HOME_ASSISTANT_TOKEN'),
    this.playerEntityId = const String.fromEnvironment(
      'MUSIC_ASSISTANT_PLAYER_ENTITY_ID',
    ),
    this.apiPath = const String.fromEnvironment('HOME_ASSISTANT_API_PATH'),
    this.mqttHost = const String.fromEnvironment(
      'MQTT_BROKER_HOST',
      defaultValue: '',
    ),
    this.mqttPort = const int.fromEnvironment(
      'MQTT_BROKER_PORT',
      defaultValue: 9001,
    ),
  });

  bool get isConfigured => url.isNotEmpty && token.isNotEmpty;

  Future<void> load() async {
    final prefs = await SharedPreferences.getInstance();
    url = prefs.getString('home_assistant_url') ?? url;
    token = prefs.getString('home_assistant_token') ?? token;
    playerEntityId =
        prefs.getString('music_assistant_player_entity_id') ?? playerEntityId;
    apiPath = prefs.getString('home_assistant_api_path') ?? apiPath;

    final String currentHostIp = Uri.base.host.isNotEmpty
        ? Uri.base.host
        : '127.0.0.1';

    final String savedMqttHost = prefs.getString('mqtt_host') ?? '';
    mqttHost = savedMqttHost.isNotEmpty ? savedMqttHost : currentHostIp;

    mqttPort = prefs.getInt('mqtt_port') ?? mqttPort;
  }

  Future<void> save({
    required String newUrl,
    required String newToken,
    required String newEntityId,
    required String newApiPath,
    required String newMqttHost,
    required int newMqttPort,
  }) async {
    final prefs = await SharedPreferences.getInstance();

    url = normalizeUrl(newUrl);
    token = newToken.trim();
    playerEntityId = newEntityId.trim();
    apiPath = normalizeApiPath(newApiPath);

    mqttHost = newMqttHost.trim();
    mqttPort = newMqttPort;

    await prefs.setString('home_assistant_url', url);
    await prefs.setString('home_assistant_token', token);
    await prefs.setString('music_assistant_player_entity_id', playerEntityId);
    await prefs.setString('home_assistant_api_path', apiPath);
    await prefs.setString('mqtt_host', mqttHost);
    await prefs.setInt('mqtt_port', mqttPort);
  }

  Future<void> updateApiPath(String newPath) async {
    final normalized = normalizeApiPath(newPath);
    if (apiPath != normalized) {
      apiPath = normalized;
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString('home_assistant_api_path', apiPath);
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
