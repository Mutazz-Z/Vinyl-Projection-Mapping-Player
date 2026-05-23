export 'package:web_app/models/music_assistant_models.dart';
export 'package:web_app/models/vinyl_album_record.dart';

import 'package:flutter/material.dart';
import 'package:web_app/models/music_assistant_models.dart';
import 'package:web_app/models/vinyl_album_record.dart';
import 'package:web_app/services/music_assistant/music_assistant_settings.dart';
import 'package:web_app/services/orchestrator_api_client.dart';

class MusicAssistantService {
  late final MusicAssistantSettings applicationSettings;
  late final OrchestratorApiClient orchestratorApiClient;

  bool isServiceInitialized = false;

  bool get isSystemConfigured => applicationSettings.isConfigured;

  Future<void> initializeService() async {
    if (isServiceInitialized) {
      return;
    }

    applicationSettings = MusicAssistantSettings();
    await applicationSettings.load();

    orchestratorApiClient = OrchestratorApiClient();

    isServiceInitialized = true;
  }

  Future<ConnectionTestResult> testConnectionDetailed() async {
    return await orchestratorApiClient.executeSystemConnectionTest();
  }

  Future<RegistrationResolutionResult> resolveRegistrationInput(
    String mediaResourceIdentifier,
  ) async {
    final String sanitizedResourceIdentifier = mediaResourceIdentifier.trim();

    if (sanitizedResourceIdentifier.isEmpty) {
      return generateEmptyResolutionResult();
    }

    final VinylAlbumRecord fetchedAlbumRecord = await fetchCleanMetadataRecord(
      sanitizedResourceIdentifier,
    );

    return formatPopulatedResolutionResult(
      sanitizedResourceIdentifier,
      fetchedAlbumRecord,
    );
  }

  Future<List<MediaPlayerInfo>> fetchAvailablePlayers() async {
    try {
      return await orchestratorApiClient.getAvailablePlayers();
    } catch (e) {
      debugPrint('Failed to fetch players: $e');
      return [];
    }
  }

  Future<bool> verifyReaderConnection() async {
    return await orchestratorApiClient.verifyReaderConnection();
  }

  Future<String> fetchHostIp() async {
    try {
      final ip = await orchestratorApiClient.fetchHostIp();
      return ip.isNotEmpty ? ip : 'YOUR_MQTT_BROKER_IP';
    } catch (e) {
      return 'YOUR_MQTT_BROKER_IP';
    }
  }

  Future<List<String>> fetchAlbumCoverUrls() async {
    try {
      return await orchestratorApiClient.fetchAlbumCoverUrls();
    } catch (e) {
      return [];
    }
  }

  Future<VinylAlbumRecord> fetchCleanMetadataRecord(
    String mediaResourceIdentifier,
  ) async {
    try {
      return await orchestratorApiClient.resolveMediaMetadata(
        mediaResourceIdentifier,
      );
    } catch (resolutionException) {
      return generateFallbackEmptyAlbumRecord(mediaResourceIdentifier);
    }
  }

  RegistrationResolutionResult generateEmptyResolutionResult() {
    return const RegistrationResolutionResult(
      inputValue: '',
      resolvedUri: '',
      metadata: <String, String>{},
    );
  }

  RegistrationResolutionResult formatPopulatedResolutionResult(
    String sanitizedResourceIdentifier,
    VinylAlbumRecord fetchedAlbumRecord,
  ) {
    final Map<String, String> mappedMetadataPayload =
        mapVinylRecordToMetadataDictionary(fetchedAlbumRecord);

    return RegistrationResolutionResult(
      inputValue: sanitizedResourceIdentifier,
      resolvedUri: sanitizedResourceIdentifier,
      metadata: mappedMetadataPayload,
    );
  }

  Map<String, String> mapVinylRecordToMetadataDictionary(
    VinylAlbumRecord fetchedAlbumRecord,
  ) {
    return <String, String>{
      'artist': fetchedAlbumRecord.artistName,
      'album': fetchedAlbumRecord.albumTitle,
      'tracks': fetchedAlbumRecord.trackList,
      'album_cover_art': fetchedAlbumRecord.albumCoverArt,
    };
  }

  VinylAlbumRecord generateFallbackEmptyAlbumRecord(
    String mediaResourceIdentifier,
  ) {
    return VinylAlbumRecord(
      albumTitle: '',
      artistName: '',
      albumCoverArt: '',
      trackList: '',
      mediaResourceUri: mediaResourceIdentifier,
    );
  }
}
