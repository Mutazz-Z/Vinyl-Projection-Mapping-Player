import 'package:web_app/models/music_assistant_models.dart';

class PlaybackAttempt {
  final MusicAssistantServiceDomain domain;
  final MusicAssistantServiceAction service;
  final Map<String, dynamic> body;

  const PlaybackAttempt({
    required this.domain,
    required this.service,
    required this.body,
  });
}

class PlaybackStrategies {
  static List<PlaybackAttempt> generateAttempts({
    required String entityId,
    required List<String> candidateUris,
    required bool isLibraryUri,
  }) {
    final List<PlaybackAttempt> attempts = [];

    for (final String candidateUri in candidateUris) {
      if (!isLibraryUri) {
        attempts.add(
          PlaybackAttempt(
            domain: MusicAssistantServiceDomain.mediaPlayer,
            service: MusicAssistantServiceAction.playMedia,
            body: {
              'entity_id': entityId,
              'media_content_id': candidateUri,
              'media_content_type': 'music',
            },
          ),
        );
      }

      for (final domain in [
        MusicAssistantServiceDomain.musicAssistant,
        MusicAssistantServiceDomain.mass,
      ]) {
        attempts.addAll([
          PlaybackAttempt(
            domain: domain,
            service: MusicAssistantServiceAction.playMedia,
            body: {
              'target': {'entity_id': [entityId]},
              'media_id': [candidateUri],
              'media_type': 'track',
              'enqueue': 'replace',
            },
          ),
          PlaybackAttempt(
            domain: domain,
            service: MusicAssistantServiceAction.playMedia,
            body: {
              'target': {'entity_id': [entityId]},
              'media_id': candidateUri,
              'enqueue': 'replace',
            },
          ),
          PlaybackAttempt(
            domain: domain,
            service: MusicAssistantServiceAction.playMedia,
            body: {
              'target': {'entity_id': [entityId]},
              'uri': candidateUri,
              'enqueue': 'replace',
            },
          ),
          PlaybackAttempt(
            domain: domain,
            service: MusicAssistantServiceAction.playMedia,
            body: {
              'target': {'entity_id': entityId},
              'entity_id': entityId,
              'media_id': candidateUri,
              'media_type': 'track',
              'enqueue': 'replace',
            },
          ),
        ]);
      }

      if (isLibraryUri) {
        attempts.add(
          PlaybackAttempt(
            domain: MusicAssistantServiceDomain.mediaPlayer,
            service: MusicAssistantServiceAction.playMedia,
            body: {
              'entity_id': entityId,
              'media_content_id': candidateUri,
              'media_content_type': 'music',
            },
          ),
        );
      }
    }
    return attempts;
  }
}