import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import 'package:web_app/models/music_assistant_models.dart';
import 'music_assistant_settings.dart';

class MusicAssistantApi {
  final MusicAssistantSettings settings;

  MusicAssistantApi(this.settings);

  Future<ConnectionTestResult> testConnection() async {
    if (!settings.isConfigured) {
      return const ConnectionTestResult(
        success: false,
        message: 'Missing Music Assistant URL or token.',
      );
    }

    try {
      final Uri baseProxyUri = getNormalizedBaseUri();
      final Map<String, String> headers = getAuthHeaders();

      final http.Response response = await http.get(
        baseProxyUri,
        headers: headers,
      );

      if (response.statusCode == 401 || response.statusCode == 403) {
        return ConnectionTestResult(
          success: false,
          message:
              'API proxy working, but Music Assistant rejected the token (${response.statusCode}).',
          statusCode: response.statusCode,
        );
      }

      if (response.statusCode >= 200 && response.statusCode < 300) {
        return const ConnectionTestResult(
          success: true,
          message:
              'Connected successfully to Music Assistant via Orchestrator.',
        );
      }

      return ConnectionTestResult(
        success: false,
        message: 'Music Assistant responded with HTTP ${response.statusCode}.',
        statusCode: response.statusCode,
      );
    } catch (error) {
      debugPrint('MusicAssistantApi: connection test failed: $error');
      return ConnectionTestResult(
        success: false,
        message:
            'Orchestrator communication failed. Is the Go backend running? Error: $error',
      );
    }
  }

  Uri getNormalizedBaseUri() {
    if (Uri.base.host == 'localhost') {
      return Uri.parse('http://localhost:8099/api/');
    }
    return Uri.base.resolve('/api/');
  }

  Map<String, String> getAuthHeaders() {
    return {
      'Authorization': 'Bearer ${settings.musicAssistantTokenString}',
      'Content-Type': 'application/json',
    };
  }
}
