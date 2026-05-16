export 'package:web_app/models/music_assistant_models.dart';

import 'package:web_app/models/music_assistant_models.dart';
import 'package:web_app/services/music_assistant/music_assistant_settings.dart';
import 'package:web_app/services/music_assistant/music_assistant_api.dart';
import 'package:web_app/services/music_assistant/music_assistant_metadata.dart';
import 'package:web_app/services/music_assistant/music_assistant_player.dart';

class MusicAssistantService {
  late final MusicAssistantSettings settings;
  late final MusicAssistantApi api;
  late final MusicAssistantMetadata metadata;
  late final MusicAssistantPlayer player;

  bool _isInitialized = false;

  bool get isConfigured => settings.isConfigured;

  Future<void> init() async {
    if (_isInitialized) return;

    settings = MusicAssistantSettings();
    await settings.load();

    api = MusicAssistantApi(settings);
    metadata = MusicAssistantMetadata(settings, api);
    player = MusicAssistantPlayer(settings, api, metadata);

    _isInitialized = true;
  }

  Future<void> saveSettings({
    required String homeAssistantUrl,
    required String homeAssistantToken,
    required String musicAssistantPlayerEntityId,
    required String homeAssistantApiPath,
  }) async {
    await settings.save(
      newUrl: homeAssistantUrl,
      newToken: homeAssistantToken,
      newEntityId: musicAssistantPlayerEntityId,
      newApiPath: homeAssistantApiPath,
    );
  }

  Future<bool> testConnection() async {
    final result = await api.testConnection();
    return result.success;
  }

  Future<ConnectionTestResult> testConnectionDetailed() => api.testConnection();

  Future<Map<String, String>> fetchMetadata(String mediaUri) =>
      metadata.fetchMetadata(mediaUri);

  Future<RegistrationResolutionResult> resolveRegistrationInput(String input) =>
      metadata.resolveRegistrationInput(input);

  Future<void> playMediaUri(String mediaUri) => player.playMediaUri(mediaUri);
  Future<void> togglePlayPause() => player.togglePlayPause();
  Future<void> nextTrack() => player.nextTrack();
  Future<void> previousTrack() => player.previousTrack();
  Future<void> stopPlayback() => player.stopPlayback();
}
