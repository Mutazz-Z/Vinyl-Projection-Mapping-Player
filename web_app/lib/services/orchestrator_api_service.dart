import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;

class OrchestratorApiService {
  static const int _orchestratorApiPort = 8100;

  Future<void> syncMqttConfig(String hostIp) async {
    try {
      final orchestratorUrl = Uri.parse(
        'http://127.0.0.1:$_orchestratorApiPort/api/config/mqtt',
      );

      await http
          .post(
            orchestratorUrl,
            headers: {'Content-Type': 'application/json'},
            body: jsonEncode({
              'mqtt_host': hostIp,
              'mqtt_port': '1883',
            }),
          )
          .timeout(const Duration(seconds: 3));

      debugPrint('OrchestratorApi: Successfully synced MQTT config.');
    } catch (e) {
      debugPrint('OrchestratorApi: Warning - Could not reach orchestrator: $e');
    }
  }
}

final OrchestratorApiService orchestratorApi = OrchestratorApiService();
