import 'dart:convert';
import 'package:http/http.dart' as http;
import '../models/music_assistant_models.dart';
import '../models/vinyl_album_record.dart';
import 'package:web_app/main.dart';

class OrchestratorApiClient {
  Future<VinylAlbumRecord> resolveMediaMetadata(
    String mediaResourceIdentifier,
  ) async {
    final Uri targetResolutionUri = constructMetadataResolutionUri(
      mediaResourceIdentifier,
    );
    final http.Response networkResponse = await executeNetworkGetRequest(
      targetResolutionUri,
    );

    validateNetworkResponseStatus(networkResponse);

    final Map<String, dynamic> decodedJsonPayload = decodeNetworkResponseBody(
      networkResponse,
    );
    return VinylAlbumRecord.fromJson(decodedJsonPayload);
  }

  Future<List<MediaPlayerInfo>> getAvailablePlayers() async {
    try {
      final response = await http.get(
        Uri.parse('http://$globalOrchestratorHost:8080/api/players'),
      );

      if (response.statusCode == 200) {
        final List<dynamic> decodedJson = jsonDecode(response.body);
        return decodedJson
            .map((json) => MediaPlayerInfo.fromJson(json))
            .toList();
      } else {
        throw Exception(
          'Orchestrator API rejected request: HTTP ${response.statusCode} - ${response.body}',
        );
      }
    } catch (e) {
      throw Exception('Failed to communicate with Orchestrator API: $e');
    }
  }

  Uri constructMetadataResolutionUri(String mediaResourceIdentifier) {
    return Uri.parse(
      'http://$globalOrchestratorHost:8080/api/metadata/resolve?uri=$mediaResourceIdentifier',
    );
  }

  Future<http.Response> executeNetworkGetRequest(
    Uri targetResolutionUri,
  ) async {
    try {
      return await http
          .get(targetResolutionUri)
          .timeout(const Duration(seconds: 10));
    } catch (networkException) {
      throw Exception(
        'Failed to connect to orchestrator web API: $networkException',
      );
    }
  }

  void validateNetworkResponseStatus(http.Response networkResponse) {
    if (networkResponse.statusCode < 200 || networkResponse.statusCode >= 300) {
      throw Exception(
        'Orchestrator API rejected request: HTTP ${networkResponse.statusCode} - ${networkResponse.body}',
      );
    }
  }

  Map<String, dynamic> decodeNetworkResponseBody(
    http.Response networkResponse,
  ) {
    try {
      final dynamic decodedData = jsonDecode(networkResponse.body);
      if (decodedData is Map<String, dynamic>) {
        return decodedData;
      }
      throw Exception('Response body is not a valid JSON object');
    } catch (decodingException) {
      throw Exception(
        'Failed to decode orchestrator JSON response: $decodingException',
      );
    }
  }

  Future<ConnectionTestResult> executeSystemConnectionTest() async {
    try {
      final Uri targetTestUri = Uri.parse(
        'http://$globalOrchestratorHost:8080/api/system/test',
      );

      final http.Response networkResponse = await http
          .get(targetTestUri)
          .timeout(const Duration(seconds: 8));

      if (networkResponse.statusCode >= 200 &&
          networkResponse.statusCode < 300) {
        return const ConnectionTestResult(
          success: true,
          message:
              'Successfully authenticated with Music Assistant via the Orchestrator.',
        );
      }

      return ConnectionTestResult(
        success: false,
        message:
            'Music Assistant rejected the credentials: ${networkResponse.body}',
      );
    } catch (networkException) {
      return ConnectionTestResult(
        success: false,
        message:
            'Failed to reach the Orchestrator API. Is the Go server running? Error: $networkException',
      );
    }
  }
}
