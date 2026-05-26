class ConnectionTestResult {
  final bool success;
  final String message;
  final int? statusCode;

  const ConnectionTestResult({
    required this.success,
    required this.message,
    this.statusCode,
  });
}

class RegistrationResolutionResult {
  final String inputValue;
  final String resolvedUri;
  final Map<String, String> metadata;

  const RegistrationResolutionResult({
    required this.inputValue,
    required this.resolvedUri,
    required this.metadata,
  });
}

enum MusicAssistantServiceDomain {
  musicAssistant,
  mass,
  mediaPlayer;

  String toJson() {
    switch (this) {
      case MusicAssistantServiceDomain.musicAssistant:
        return 'music_assistant';
      case MusicAssistantServiceDomain.mass:
        return 'mass';
      case MusicAssistantServiceDomain.mediaPlayer:
        return 'media_player';
    }
  }

  static MusicAssistantServiceDomain fromJson(String json) {
    switch (json) {
      case 'music_assistant':
        return MusicAssistantServiceDomain.musicAssistant;
      case 'mass':
        return MusicAssistantServiceDomain.mass;
      case 'media_player':
        return MusicAssistantServiceDomain.mediaPlayer;
      default:
        return MusicAssistantServiceDomain.musicAssistant;
    }
  }
}

enum MusicAssistantServiceAction {
  playMedia,
  mediaPlayPause,
  mediaNextTrack,
  mediaPreviousTrack,
  mediaStop;

  String toJson() {
    switch (this) {
      case MusicAssistantServiceAction.playMedia:
        return 'play_media';
      case MusicAssistantServiceAction.mediaPlayPause:
        return 'media_play_pause';
      case MusicAssistantServiceAction.mediaNextTrack:
        return 'media_next_track';
      case MusicAssistantServiceAction.mediaPreviousTrack:
        return 'media_previous_track';
      case MusicAssistantServiceAction.mediaStop:
        return 'media_stop';
    }
  }

  static MusicAssistantServiceAction fromJson(String json) {
    switch (json) {
      case 'play_media':
        return MusicAssistantServiceAction.playMedia;
      case 'media_play_pause':
        return MusicAssistantServiceAction.mediaPlayPause;
      case 'media_next_track':
        return MusicAssistantServiceAction.mediaNextTrack;
      case 'media_previous_track':
        return MusicAssistantServiceAction.mediaPreviousTrack;
      case 'media_stop':
        return MusicAssistantServiceAction.mediaStop;
      default:
        return MusicAssistantServiceAction.playMedia;
    }
  }
}
