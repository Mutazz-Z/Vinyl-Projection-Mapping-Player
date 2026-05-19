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
        message: 'Missing Home Assistant URL or token.',
      );
    }

    try {
      // Point all traffic to the local proxy gateway
      final Uri baseProxyUri = getNormalizedBaseUri();
      final Map<String, String> headers = getAuthHeaders();

      final (:String? prefix, :Object? lastException) = await resolveApiPrefix(
        baseUri: baseProxyUri,
        headers: headers,
      );

      if (prefix == null) {
        if (lastException != null) {
          return ConnectionTestResult(
            success: false,
            message:
                'Gateway error — unable to reach the local proxy at $baseProxyUri. Error: $lastException',
          );
        }
        return ConnectionTestResult(
          success: false,
          message:
              'Target Home Assistant returned 404 for all known API paths via the proxy gateway.',
        );
      }

      final Uri statusUri = buildApiUri(
        baseProxyUri,
        buildApiRelativePath(prefix, ''),
      );

      final http.Response response = await http.get(
        statusUri,
        headers: headers,
      );

      if (response.statusCode == 401 || response.statusCode == 403) {
        return ConnectionTestResult(
          success: false,
          message:
              'API proxy is working, but Home Assistant rejected the token (${response.statusCode}).',
          statusCode: response.statusCode,
        );
      }

      if (response.statusCode >= 200 && response.statusCode < 300) {
        await settings.updateApiPath(prefix);
        return ConnectionTestResult(
          success: true,
          message:
              'Connected successfully to Home Assistant via proxy gateway.',
          statusCode: response.statusCode,
        );
      }

      return ConnectionTestResult(
        success: false,
        message:
            'Home Assistant responded with HTTP ${response.statusCode} via the gateway.',
        statusCode: response.statusCode,
      );
    } catch (error) {
      debugPrint('MusicAssistantApi: connection test failed: $error');
      return ConnectionTestResult(
        success: false,
        message:
            'Proxy gateway communication failed. Is the Go backend running? Error: $error',
      );
    }
  }

  /// NEW: Routes all frontend API calls to the dynamic Go backend proxy.
  /// The frontend no longer cares what the user's HA URL is; the backend handles it.
  Uri getNormalizedBaseUri() {
    // If running in local dev mode on a MacBook, hit the Go port directly
    if (Uri.base.host == 'localhost') {
      return Uri.parse('http://localhost:8100/api/ha-proxy/');
    }

    // In production, use a relative resolution to route through Nginx
    // Note: The trailing slash is CRUCIAL so Uri.resolve appends endpoints correctly!
    return Uri.base.resolve('/api/ha-proxy/');
  }

  Map<String, String> getAuthHeaders() {
    return {
      'Authorization': 'Bearer ${settings.token}',
      'Content-Type': 'application/json',
    };
  }

  Future<({String? prefix, Object? lastException})> resolveApiPrefix({
    required Uri baseUri,
    required Map<String, String> headers,
  }) async {
    Object? lastException;
    final List<String> candidatePrefixes = _getCandidateApiPrefixes();

    for (final String candidatePrefix in candidatePrefixes) {
      final Uri statusUri = buildApiUri(
        baseUri,
        buildApiRelativePath(candidatePrefix, ''),
      );

      try {
        final http.Response response = await http.get(
          statusUri,
          headers: headers,
        );
        if (response.statusCode != 404) {
          return (prefix: candidatePrefix, lastException: null);
        }
      } catch (error) {
        lastException = error;
      }
    }

    return (prefix: null, lastException: lastException);
  }

  Uri buildApiUri(Uri baseUri, String relativePath) {
    final String normalized = relativePath.startsWith('/')
        ? relativePath.substring(1)
        : relativePath;
    return baseUri.resolve(normalized);
  }

  String buildApiRelativePath(String apiPrefix, String suffix) {
    final String normalizedPrefix = settings.normalizeApiPath(apiPrefix);
    return suffix.isEmpty
        ? '${normalizedPrefix}api/'
        : '${normalizedPrefix}api/$suffix';
  }

  List<String> _getCandidateApiPrefixes() {
    final List<String> prefixes = [];
    final String configuredPrefix = settings.normalizeApiPath(settings.apiPath);

    if (configuredPrefix.isNotEmpty) prefixes.add(configuredPrefix);

    for (final String fallback in ['', 'homeassistant/', 'ha/']) {
      if (!prefixes.contains(fallback)) prefixes.add(fallback);
    }

    return prefixes;
  }
}
