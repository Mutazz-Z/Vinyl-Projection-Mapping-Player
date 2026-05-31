import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:web_app/factories/state.dart';
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

  /*
   Grabs list of available players from Music Assistant
  */
  Future<List<AvailableMediaPlayers_t>> getAvailablePlayers() async {
    try {
      final response = await http.get(
        Uri.parse('http://$globalOrchestratorHostAddress:8099/api/players/'),
      );

      if (response.statusCode == 200) {
        final List<dynamic> decodedJson = jsonDecode(response.body);
        return decodedJson
            .map((json) => AvailableMediaPlayers_t.fromJson(json))
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

  // TODO: Fix whatever this does, right now it just sends out 127.0.0.1... Do we even need this?
  Future<String> fetchHostIp() async {
    final Uri requestUri = Uri.parse(
      'http://$globalOrchestratorHostAddress:8099/api/system/network',
    );

    try {
      final response = await http.get(requestUri);

      if (response.statusCode == 200) {
        final decodedData = jsonDecode(response.body);
        return decodedData['host_ip'] ?? '';
      }
      return '';
    } catch (e) {
      debugPrint('Failed to fetch host IP: $e');
      return '';
    }
  }

  Future<bool> verifyReaderConnection() async {
    final Uri requestUri = Uri.parse(
      'http://$globalOrchestratorHostAddress:8099/api/system/verify_reader',
    );
    try {
      final response = await http.get(requestUri);
      return response.statusCode == 200;
    } catch (e) {
      debugPrint('Failed to verify reader: $e');
      return false;
    }
  }

  Uri constructMetadataResolutionUri(String mediaResourceIdentifier) {
    return Uri.parse(
      'http://$globalOrchestratorHostAddress:8099/api/metadata/resolve?uri=$mediaResourceIdentifier',
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

  /*
    Utility method to check if the HTTP response from the Orchestrator API indicates a successful request.
    Throws an exception with details if the response status code indicates an error.
  */
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

  /*
    Executes a simple connectivity and authentication test against the Orchestrator API.
    This can be used to verify that the Go server is running and that Music Assistant credentials are valid.
  */
  Future<ConnectionTestResult> executeSystemConnectionTest(
    String targetUrl,
    String targetToken,
  ) async {
    try {
      final Uri targetTestUri = Uri.parse(
        'http://$globalOrchestratorHostAddress:8099/api/system/test',
      );

      // Changed from GET to POST to actually send the payload to the Pi
      final http.Response networkResponse = await http
          .post(
            targetTestUri,
            headers: {'Content-Type': 'application/json'},
            body: jsonEncode({'url': targetUrl, 'token': targetToken}),
          )
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

  /*
   Fetches all albums from our Music Assistant library
  */
  Future<List<AlbumsInLibrary_t>>
  getAllAlbumsFromMusicAssistantLibrary() async {
    try {
      final response = await http.get(
        Uri.parse('http://$globalOrchestratorHostAddress:8099/api/library/'),
      );

      if (response.statusCode == 200) {
        final List<dynamic> decodedData = jsonDecode(response.body);
        return decodedData
            .map((json) => AlbumsInLibrary_t.fromJson(json))
            .toList();
      }
    } catch (error) {
      debugPrint('Network/Parsing Error fetching albums: $error');
    }
    return [];
  }

  /*
   Fetches the tracklist and metadata for a given album in our Music Assistant library
  */
  Future<List<AlbumTrackList_t>> fetchAlbumTrackList(
    String itemId,
    String provider,
  ) async {
    try {
      final http.Response response = await http.get(
        Uri.parse(
          'http://$globalOrchestratorHostAddress:8099/api/library/$provider/$itemId',
        ),
      );
      if (response.statusCode == 200) {
        List<dynamic> rawList = jsonDecode(response.body);
        List<AlbumTrackList_t> tracks = rawList
            .map((jsonItem) => AlbumTrackList_t.fromJson(jsonItem))
            .toList();
        return tracks;
      }
    } catch (error) {
      debugPrint('Error fetching album tracklist: $error');
    }
    return [];
  }
}
