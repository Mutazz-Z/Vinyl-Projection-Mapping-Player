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
      final Uri baseUri = getNormalizedBaseUri();
      final Map<String, String> headers = getAuthHeaders();

      final (:String? prefix, :Object? lastException) = await resolveApiPrefix(
        baseUri: baseUri,
        headers: headers,
      );

      if (prefix == null) {
        if (lastException != null) {
          return ConnectionTestResult(
            success: false,
            message:
                'CORS or network error — the browser blocked the request to $baseUri. Error: $lastException',
          );
        }
        return ConnectionTestResult(
          success: false,
          message: 'All known API paths at $baseUri returned 404.',
        );
      }

      final Uri statusUri = buildApiUri(
        baseUri,
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
              'API is reachable, but the token was rejected (${response.statusCode}).',
          statusCode: response.statusCode,
        );
      }

      if (response.statusCode >= 200 && response.statusCode < 300) {
        await settings.updateApiPath(prefix);
        return ConnectionTestResult(
          success: true,
          message: 'Connected successfully at $statusUri',
          statusCode: response.statusCode,
        );
      }

      return ConnectionTestResult(
        success: false,
        message:
            'Home Assistant responded with HTTP ${response.statusCode} at $statusUri.',
        statusCode: response.statusCode,
      );
    } catch (error) {
      debugPrint('MusicAssistantApi: connection test failed: $error');
      return ConnectionTestResult(
        success: false,
        message:
            'Network/CORS error while contacting Home Assistant. Error: $error',
      );
    }
  }

  Uri getNormalizedBaseUri() {
    final Uri parsedUri = Uri.parse(settings.url);
    final String normalizedPath = parsedUri.path.endsWith('/')
        ? parsedUri.path
        : '${parsedUri.path}/';
    return parsedUri.replace(path: normalizedPath);
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
