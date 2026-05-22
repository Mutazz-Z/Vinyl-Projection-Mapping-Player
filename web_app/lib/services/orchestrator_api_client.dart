import 'dart:convert';
import 'package:http/http.dart' as http;
import '../models/music_assistant_models.dart';
import '../models/vinyl_album_record.dart';
import 'package:web_app/main.dart';

class OrchestratorApiClient {
  Future<VinylAlbumRecord> resolveMediaMetadata(
    String mediaResourceIdentifier,
  ) async {
    final Uri targetResolutionUri = buildMetadataResolutionUri(
      mediaResourceIdentifier,
    );
    final http.Response networkResponse = await executeGetRequest(
      targetResolutionUri,
    );

    validateResponseStatusIsSuccess(networkResponse);

    final Map<String, dynamic> decodedResponseBody = decodeJsonResponseBody(
      networkResponse,
    );
    return VinylAlbumRecord.fromJson(decodedResponseBody);
  }

  Uri buildMetadataResolutionUri(String mediaResourceIdentifier) {
    return Uri.parse(
      '${systemDataSource.httpBaseUrl}/api/metadata/resolve?uri=$mediaResourceIdentifier',
    );
  }

  Future<http.Response> executeGetRequest(Uri targetUri) async {
    try {
      return await http.get(targetUri).timeout(const Duration(seconds: 10));
    } catch (networkException) {
      throw Exception(
        'Failed to connect to orchestrator web API: $networkException',
      );
    }
  }

  void validateResponseStatusIsSuccess(http.Response networkResponse) {
    if (networkResponse.statusCode < 200 || networkResponse.statusCode >= 300) {
      throw Exception(
        'Orchestrator API rejected request: HTTP ${networkResponse.statusCode} - ${networkResponse.body}',
      );
    }
  }

  Map<String, dynamic> decodeJsonResponseBody(http.Response networkResponse) {
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
        '${systemDataSource.httpBaseUrl}/api/system/test',
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
