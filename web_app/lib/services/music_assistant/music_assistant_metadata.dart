import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import 'package:web_app/services/music_assistant_metadata_parser.dart';
import 'package:web_app/models/music_assistant_models.dart';
import 'music_assistant_settings.dart';
import 'music_assistant_api.dart';

class MusicAssistantMetadata {
  final MusicAssistantSettings settings;
  final MusicAssistantApi api;

  MusicAssistantMetadata(this.settings, this.api);

  Future<RegistrationResolutionResult> resolveRegistrationInput(
    String input,
  ) async {
    final String trimmedInput = input.trim();
    if (trimmedInput.isEmpty) {
      return const RegistrationResolutionResult(
        inputValue: '',
        resolvedUri: '',
        metadata: <String, String>{},
      );
    }

    Map<String, String> metadata = await fetchMetadata(trimmedInput);

    return RegistrationResolutionResult(
      inputValue: trimmedInput,
      resolvedUri: trimmedInput,
      metadata: metadata,
    );
  }

  Future<Map<String, String>> fetchMetadata(String mediaUri) async {
    if (!settings.isConfigured || mediaUri.trim().isEmpty) {
      return {};
    }

    final Uri baseUri = api.getNormalizedBaseUri();
    final Map<String, String> headers = api.getAuthHeaders();

    try {
      final (:String? prefix, lastException: _) = await api.resolveApiPrefix(
        baseUri: baseUri,
        headers: headers,
      );

      if (prefix == null) return {};

      final List<String> candidateUris = getPlaybackCandidateUris(mediaUri);

      for (final String candidateUri in candidateUris) {
        final String? candidateMediaType = _mediaTypeFromProviderUri(
          candidateUri,
        );

        final Map<String, String> browseMetadata = await _fetchViaBrowseMedia(
          baseUri: baseUri,
          apiPrefix: prefix,
          headers: headers,
          mediaUri: candidateUri,
          mediaType: candidateMediaType,
        );

        if (browseMetadata.isNotEmpty) {
          if (candidateMediaType == 'album' &&
              !MusicAssistantMetadataParser.isCompleteAlbumMetadata(
                browseMetadata,
              )) {
            final Map<String, String> libraryMetadata =
                await _fetchViaGetLibrary(
                  baseUri: baseUri,
                  apiPrefix: prefix,
                  headers: headers,
                  mediaUri: candidateUri,
                  mediaType: candidateMediaType,
                );
            if (libraryMetadata.isNotEmpty) {
              return MusicAssistantMetadataParser.mergeMetadata(
                primary: browseMetadata,
                secondary: libraryMetadata,
              );
            }
          }
          return browseMetadata;
        }

        final Map<String, String> libraryMetadata = await _fetchViaGetLibrary(
          baseUri: baseUri,
          apiPrefix: prefix,
          headers: headers,
          mediaUri: candidateUri,
          mediaType: candidateMediaType,
        );

        if (libraryMetadata.isNotEmpty) return libraryMetadata;
      }

      if (settings.playerEntityId.isNotEmpty) {
        return await _fetchViaPlayerState(baseUri, prefix, headers);
      }
    } catch (error) {
      debugPrint('MusicAssistantMetadata: metadata lookup failed: $error');
    }

    return {};
  }

  Future<Map<String, String>> _fetchViaBrowseMedia({
    required Uri baseUri,
    required String apiPrefix,
    required Map<String, String> headers,
    required String mediaUri,
    String? mediaType,
  }) async {
    if (settings.playerEntityId.isEmpty) return {};

    final Uri browseServiceUri = api
        .buildApiUri(
          baseUri,
          api.buildApiRelativePath(
            apiPrefix,
            'services/media_player/browse_media',
          ),
        )
        .replace(queryParameters: {'return_response': '1'});

    final List<Map<String, dynamic>> payloads = [
      {'entity_id': settings.playerEntityId, 'media_content_id': mediaUri},
      if (mediaType != null)
        {
          'entity_id': settings.playerEntityId,
          'media_content_id': mediaUri,
          'media_content_type': mediaType,
        },
    ];

    for (final Map<String, dynamic> payload in payloads) {
      try {
        final http.Response response = await http.post(
          browseServiceUri,
          headers: headers,
          body: jsonEncode(payload),
        );
        if (response.statusCode < 200 || response.statusCode >= 300) continue;

        final dynamic responseBody = jsonDecode(response.body);

        Map<String, String> metadata =
            MusicAssistantMetadataParser.extractFromBrowseResponse(
              responseBody: responseBody,
              mediaType: mediaType,
            );

        if (metadata.isEmpty) {
          metadata = MusicAssistantMetadataParser.extractFromUnknownResponse(
            responseBody,
          );
        }

        if (metadata.isNotEmpty) return metadata;
      } catch (error) {
        debugPrint(
          'MusicAssistantMetadata: browse_media failed for $mediaUri: $error',
        );
      }
    }
    return {};
  }

  Future<Map<String, String>> _fetchViaGetLibrary({
    required Uri baseUri,
    required String apiPrefix,
    required Map<String, String> headers,
    required String mediaUri,
    String? mediaType,
  }) async {
    if (mediaType == null) return {};

    final String? mediaId = _mediaIdFromProviderUri(mediaUri);
    final List<String> searchTerms = {
      if (mediaId != null && mediaId.isNotEmpty) mediaId,
      mediaUri,
      mediaUri.replaceAll(RegExp(r'--[^:]+://'), '://'),
    }.toList();

    const List<Map<String, String>> libraryServices = [
      {'domain': 'music_assistant', 'service': 'get_library'},
      {'domain': 'mass', 'service': 'get_library'},
    ];

    for (final Map<String, String> service in libraryServices) {
      final Uri serviceUri = api
          .buildApiUri(
            baseUri,
            api.buildApiRelativePath(
              apiPrefix,
              'services/${service['domain']}/${service['service']}',
            ),
          )
          .replace(queryParameters: {'return_response': '1'});

      for (final String searchTerm in searchTerms) {
        final Map<String, dynamic> payload = {
          'media_type': mediaType,
          'limit': 50,
          'search': searchTerm,
        };

        try {
          final http.Response response = await http.post(
            serviceUri,
            headers: headers,
            body: jsonEncode(payload),
          );
          if (response.statusCode < 200 || response.statusCode >= 300) continue;

          final Map<String, String> metadata =
              MusicAssistantMetadataParser.extractFromUnknownResponse(
                jsonDecode(response.body),
              );
          if (metadata.isNotEmpty) return metadata;
        } catch (error) {
          debugPrint(
            'MusicAssistantMetadata: get_library failed for $mediaUri: $error',
          );
        }
      }
    }
    return {};
  }

  Future<Map<String, String>> _fetchViaPlayerState(
    Uri baseUri,
    String prefix,
    Map<String, String> headers,
  ) async {
    final Uri stateUri = api.buildApiUri(
      baseUri,
      api.buildApiRelativePath(prefix, 'states/${settings.playerEntityId}'),
    );

    final http.Response stateResponse = await http.get(
      stateUri,
      headers: headers,
    );
    if (stateResponse.statusCode >= 200 && stateResponse.statusCode < 300) {
      final Map<String, String> metadata =
          MusicAssistantMetadataParser.extractFromPlayerState(
            jsonDecode(stateResponse.body),
          );
      if (metadata.isNotEmpty) return metadata;
    }
    return {};
  }

  List<String> getPlaybackCandidateUris(String uri) {
    final String trimmedUri = uri.trim();
    final List<String> candidates = [trimmedUri];

    final RegExp providerWithInstancePattern = RegExp(
      r'^([a-z0-9_]+)--[^:]+://',
    );
    final RegExp providerTrackPattern = RegExp(r'^([a-z0-9_]+)://track/(.+)$');

    final Match? providerWithInstanceMatch = providerWithInstancePattern
        .firstMatch(trimmedUri);
    if (providerWithInstanceMatch != null) {
      final String provider = providerWithInstanceMatch.group(1)!;
      final String withoutInstance = uri.replaceFirst(
        providerWithInstancePattern,
        '$provider://',
      );
      candidates.add(withoutInstance);

      final Match? trackMatch = providerTrackPattern.firstMatch(
        withoutInstance,
      );
      if (trackMatch != null) {
        candidates.add('${trackMatch.group(1)}:track:${trackMatch.group(2)}');
      }
    }

    return candidates.toSet().where((c) => c.isNotEmpty).toList();
  }

  String? _mediaTypeFromProviderUri(String uri) {
    final Match? match = RegExp(
      r'^[a-z0-9_]+(?:--[^:]+)?://(track|album|playlist|artist)/',
      caseSensitive: false,
    ).firstMatch(uri.trim());
    return match?.group(1)?.toLowerCase();
  }

  String? _mediaIdFromProviderUri(String uri) {
    final Match? match = RegExp(
      r'^[a-z0-9_]+(?:--[^:]+)?://(?:track|album|playlist|artist)/(.+)$',
      caseSensitive: false,
    ).firstMatch(uri.trim());
    return match?.group(1);
  }
}
