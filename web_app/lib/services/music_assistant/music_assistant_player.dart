import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:web_app/models/music_assistant_models.dart';
import 'music_assistant_settings.dart';
import 'music_assistant_api.dart';
import 'music_assistant_metadata.dart';
import 'playback_strategies.dart';

class MusicAssistantPlayer {
  final MusicAssistantSettings settings;
  final MusicAssistantApi api;
  final MusicAssistantMetadata metadata;

  MusicAssistantPlayer(this.settings, this.api, this.metadata);

  Future<void> playMediaUri(String mediaUri) async {
    if (!settings.isConfigured) {
      throw StateError('Missing Home Assistant URL or token.');
    }
    if (settings.playerEntityId.isEmpty) {
      throw StateError('Music Assistant Player Entity ID is required.');
    }

    final String trimmedUri = mediaUri.trim();
    if (trimmedUri.isEmpty) throw ArgumentError('Media URI cannot be empty.');

    final bool isLibraryUri =
        trimmedUri.contains('://track/') ||
        trimmedUri.contains('://album/') ||
        trimmedUri.contains('://playlist/');

    final List<String> candidateUris = metadata.getPlaybackCandidateUris(
      trimmedUri,
    );

    final List<PlaybackAttempt> playbackAttempts =
        PlaybackStrategies.generateAttempts(
          entityId: settings.playerEntityId,
          candidateUris: candidateUris,
          isLibraryUri: isLibraryUri,
        );

    final List<String> failedAttempts = [];

    for (final PlaybackAttempt attempt in playbackAttempts) {
      try {
        await _callService(
          domain: attempt.domain,
          service: attempt.service,
          body: attempt.body,
        );
        return;
      } catch (error) {
        failedAttempts.add(
          '${attempt.domain.toJson()}.${attempt.service.toJson()}: $error',
        );
      }
    }

    throw StateError(
      'Playback failed for URI "$trimmedUri". Attempts: ${_summarizeAttemptErrors(failedAttempts)}',
    );
  }

  Future<void> togglePlayPause() =>
      _callMediaService(MusicAssistantServiceAction.mediaPlayPause);
  Future<void> nextTrack() =>
      _callMediaService(MusicAssistantServiceAction.mediaNextTrack);
  Future<void> previousTrack() =>
      _callMediaService(MusicAssistantServiceAction.mediaPreviousTrack);
  Future<void> stopPlayback() =>
      _callMediaService(MusicAssistantServiceAction.mediaStop);

  Future<void> _callMediaService(
    MusicAssistantServiceAction service, [
    Map<String, dynamic> body = const {},
  ]) async {
    await _callService(
      domain: MusicAssistantServiceDomain.mediaPlayer,
      service: service,
      body: {'entity_id': settings.playerEntityId, ...body},
    );
  }

  Future<void> _callService({
    required MusicAssistantServiceDomain domain,
    required MusicAssistantServiceAction service,
    Map<String, dynamic> body = const {},
  }) async {
    final Uri baseUri = api.getNormalizedBaseUri();
    final (:String? prefix, :Object? lastException) = await api
        .resolveApiPrefix(baseUri: baseUri, headers: api.getAuthHeaders());

    if (prefix == null) {
      throw StateError('Unable to reach Home Assistant API: $lastException');
    }

    final Uri serviceUri = api.buildApiUri(
      baseUri,
      api.buildApiRelativePath(
        prefix,
        'services/${domain.toJson()}/${service.toJson()}',
      ),
    );

    final http.Response response = await http
        .post(serviceUri, headers: api.getAuthHeaders(), body: jsonEncode(body))
        .timeout(const Duration(seconds: 10));

    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw StateError(
        'Service call failed (${response.statusCode}) at $serviceUri. Response: ${response.body}',
      );
    }
  }

  String _summarizeAttemptErrors(List<String> errors) {
    final uniqueErrors = errors
        .where((e) => e.trim().isNotEmpty)
        .toSet()
        .toList();
    if (uniqueErrors.isEmpty) return 'No detailed attempt errors.';

    final compactErrors = uniqueErrors.take(6).toList();
    final int hiddenCount = uniqueErrors.length - compactErrors.length;
    final String summary = compactErrors.join(' | ');

    return hiddenCount > 0 ? '$summary | ...($hiddenCount more)' : summary;
  }
}
