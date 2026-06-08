// ignore_for_file: camel_case_types, non_constant_identifier_names, constant_identifier_names
// ==========================================
// GENERATED CODE - DO NOT EDIT
// ==========================================

import 'typed_key.dart';

enum WidgetState_t {
  WidgetState_Hide,
  WidgetState_Show,
  WidgetState_Pause,
  WidgetState_Resume,
  WidgetState_Loading,
  WidgetState_Idle,
  ;

  static WidgetState_t fromJson(dynamic json) {
    final idx = (json ?? 0) as int;
    return WidgetState_t.values[idx.clamp(0, WidgetState_t.values.length - 1)];
  }

  int toJson() => index;
}

enum MediaPlaybackState_t {
  PlayerState_Playing,
  PlayerState_Paused,
  PlayerState_Idle,
  PlayerState_Buffering,
  PlayerState_Unknown,
  PlayerState_Stopped,
  PlayerState_Error,
  PlayerState_Offline,
  ;

  static MediaPlaybackState_t fromJson(dynamic json) {
    final idx = (json ?? 0) as int;
    return MediaPlaybackState_t.values[idx.clamp(0, MediaPlaybackState_t.values.length - 1)];
  }

  int toJson() => index;
}

enum VisualDataState_t {
  VisualDataState_DisplayAlbumVisuals,
  VisualDataState_DisplayErrorMessage,
  VisualDataState_DisplayTagRegistration,
  VisualDataState_DisplayIdle,
  ;

  static VisualDataState_t fromJson(dynamic json) {
    final idx = (json ?? 0) as int;
    return VisualDataState_t.values[idx.clamp(0, VisualDataState_t.values.length - 1)];
  }

  int toJson() => index;
}

enum ReaderStatus_t {
  ReaderStatus_Offline,
  ReaderStatus_Online,
  ;

  static ReaderStatus_t fromJson(dynamic json) {
    return (json == true) ? ReaderStatus_t.ReaderStatus_Online : ReaderStatus_t.ReaderStatus_Offline;
  }

  bool toJson() => this == ReaderStatus_t.ReaderStatus_Online;
}

enum ShelfStatus_t {
  ShelfStatus_Empty,
  ShelfStatus_Occupied,
  ;

  static ShelfStatus_t fromJson(dynamic json) {
    return (json == true) ? ShelfStatus_t.ShelfStatus_Occupied : ShelfStatus_t.ShelfStatus_Empty;
  }

  bool toJson() => this == ShelfStatus_t.ShelfStatus_Occupied;
}

class ActiveTrack_t {
  final String trackName;
  final int trackIndex;
  final String provider;
  final String trackItemId;
  final String albumItemId;

  ActiveTrack_t({
    required this.trackName,
    required this.trackIndex,
    required this.provider,
    required this.trackItemId,
    required this.albumItemId,
  });

  factory ActiveTrack_t.fromJson(Map<String, dynamic> json) {
    return ActiveTrack_t(
      trackName: json['track_name']?.toString() ?? '',
      trackIndex: int.tryParse(json['track_index']?.toString() ?? '') ?? 0,
      provider: json['provider']?.toString() ?? '',
      trackItemId: json['track_item_id']?.toString() ?? '',
      albumItemId: json['album_item_id']?.toString() ?? '',
    );
  }
  Map<String, dynamic> toJson() {
    return {
      'track_name': trackName,
      'track_index': trackIndex,
      'provider': provider,
      'track_item_id': trackItemId,
      'album_item_id': albumItemId,
    };
  }
}

class OverlayData_t {
  final String overlayImage;
  final bool readyForDisplay;

  OverlayData_t({
    required this.overlayImage,
    required this.readyForDisplay,
  });

  factory OverlayData_t.fromJson(Map<String, dynamic> json) {
    return OverlayData_t(
      overlayImage: json['overlayImage']?.toString() ?? '',
      readyForDisplay: json['readyForDisplay'] ?? false,
    );
  }
  Map<String, dynamic> toJson() {
    return {
      'overlayImage': overlayImage,
      'readyForDisplay': readyForDisplay,
    };
  }
}

class AlbumTrackList_t {
  final String track;
  final int duration;
  final String coverImage;
  final TrackLyrics_t lyrics;

  AlbumTrackList_t({
    required this.track,
    required this.duration,
    required this.coverImage,
    required this.lyrics,
  });

  factory AlbumTrackList_t.fromJson(Map<String, dynamic> json) {
    return AlbumTrackList_t(
      track: json['track']?.toString() ?? '',
      duration: int.tryParse(json['duration']?.toString() ?? '') ?? 0,
      coverImage: json['cover_image']?.toString() ?? '',
      lyrics: TrackLyrics_t.fromJson(json['lyrics'] ?? {}),
    );
  }
  Map<String, dynamic> toJson() {
    return {
      'track': track,
      'duration': duration,
      'cover_image': coverImage,
      'lyrics': lyrics.toJson(),
    };
  }
}

class VinylRecordTagData_t {
  final String tagUid;
  final String itemId;
  final String provider;
  final String mediaTitle;
  final String artist;
  final List<AlbumTrackList_t> trackList;
  final String coverImage;
  final String labelColor;
  final String labelImage;
  final String outerRingColor;
  final String outerRingImage;
  final String projectionOverlay;

  VinylRecordTagData_t({
    required this.tagUid,
    required this.itemId,
    required this.provider,
    required this.mediaTitle,
    required this.artist,
    required this.trackList,
    required this.coverImage,
    required this.labelColor,
    required this.labelImage,
    required this.outerRingColor,
    required this.outerRingImage,
    required this.projectionOverlay,
  });

  factory VinylRecordTagData_t.fromJson(Map<String, dynamic> json) {
    return VinylRecordTagData_t(
      tagUid: json['tag_uid']?.toString() ?? '',
      itemId: json['item_id']?.toString() ?? '',
      provider: json['provider']?.toString() ?? '',
      mediaTitle: json['media_title']?.toString() ?? '',
      artist: json['artist']?.toString() ?? '',
      trackList: (json['track_list'] as List?)?.map((e) => AlbumTrackList_t.fromJson(e)).toList() ?? [],
      coverImage: json['cover_image']?.toString() ?? '',
      labelColor: json['label_color']?.toString() ?? '',
      labelImage: json['label_image']?.toString() ?? '',
      outerRingColor: json['outer_ring_color']?.toString() ?? '',
      outerRingImage: json['outer_ring_image']?.toString() ?? '',
      projectionOverlay: json['projection_overlay']?.toString() ?? '',
    );
  }
  Map<String, dynamic> toJson() {
    return {
      'tag_uid': tagUid,
      'item_id': itemId,
      'provider': provider,
      'media_title': mediaTitle,
      'artist': artist,
      'track_list': trackList.map((e) => e.toJson()).toList(),
      'cover_image': coverImage,
      'label_color': labelColor,
      'label_image': labelImage,
      'outer_ring_color': outerRingColor,
      'outer_ring_image': outerRingImage,
      'projection_overlay': projectionOverlay,
    };
  }
}

class ProjectorData_t {
  final VinylRecordTagData_t tagData;
  final VisualDataState_t visualDataState;
  final String registerTagUrl;
  final String errorMessage;

  ProjectorData_t({
    required this.tagData,
    required this.visualDataState,
    required this.registerTagUrl,
    required this.errorMessage,
  });

  factory ProjectorData_t.fromJson(Map<String, dynamic> json) {
    return ProjectorData_t(
      tagData: VinylRecordTagData_t.fromJson(json['tag_data'] ?? {}),
      visualDataState: VisualDataState_t.fromJson(json['visual_data_state']),
      registerTagUrl: json['register_tag_url']?.toString() ?? '',
      errorMessage: json['error_message']?.toString() ?? '',
    );
  }
  Map<String, dynamic> toJson() {
    return {
      'tag_data': tagData.toJson(),
      'visual_data_state': visualDataState.toJson(),
      'register_tag_url': registerTagUrl,
      'error_message': errorMessage,
    };
  }
}

class QueueList_t {
  final List<TrackListItem_t> tracks;
  final int currentPlayingIndex;

  QueueList_t({
    required this.tracks,
    required this.currentPlayingIndex,
  });

  factory QueueList_t.fromJson(Map<String, dynamic> json) {
    return QueueList_t(
      tracks: (json['tracks'] as List?)?.map((e) => TrackListItem_t.fromJson(e)).toList() ?? [],
      currentPlayingIndex: int.tryParse(json['currentPlayingIndex']?.toString() ?? '') ?? 0,
    );
  }
  Map<String, dynamic> toJson() {
    return {
      'tracks': tracks.map((e) => e.toJson()).toList(),
      'currentPlayingIndex': currentPlayingIndex,
    };
  }
}

class AlbumsInLibrary_t {
  final String itemId;
  final String provider;
  final String mediaTitle;
  final String artist;
  final String coverImage;

  AlbumsInLibrary_t({
    required this.itemId,
    required this.provider,
    required this.mediaTitle,
    required this.artist,
    required this.coverImage,
  });

  factory AlbumsInLibrary_t.fromJson(Map<String, dynamic> json) {
    return AlbumsInLibrary_t(
      itemId: json['item_id']?.toString() ?? '',
      provider: json['provider']?.toString() ?? '',
      mediaTitle: json['media_title']?.toString() ?? '',
      artist: json['artist']?.toString() ?? '',
      coverImage: json['cover_image']?.toString() ?? '',
    );
  }
  Map<String, dynamic> toJson() {
    return {
      'item_id': itemId,
      'provider': provider,
      'media_title': mediaTitle,
      'artist': artist,
      'cover_image': coverImage,
    };
  }
}

class AvailableMediaPlayers_t {
  final String playerID;
  final String displayName;

  AvailableMediaPlayers_t({
    required this.playerID,
    required this.displayName,
  });

  factory AvailableMediaPlayers_t.fromJson(Map<String, dynamic> json) {
    return AvailableMediaPlayers_t(
      playerID: json['player_id']?.toString() ?? '',
      displayName: json['display_name']?.toString() ?? '',
    );
  }
  Map<String, dynamic> toJson() {
    return {
      'player_id': playerID,
      'display_name': displayName,
    };
  }
}

class LyricLine_t {
  final double timeStart;
  final String text;

  LyricLine_t({
    required this.timeStart,
    required this.text,
  });

  factory LyricLine_t.fromJson(Map<String, dynamic> json) {
    return LyricLine_t(
      timeStart: double.tryParse(json['time_start']?.toString() ?? '') ?? 0.0,
      text: json['text']?.toString() ?? '',
    );
  }
  Map<String, dynamic> toJson() {
    return {
      'time_start': timeStart,
      'text': text,
    };
  }
}

class TrackLyrics_t {
  final List<LyricLine_t> lines;

  TrackLyrics_t({
    required this.lines,
  });

  factory TrackLyrics_t.fromJson(Map<String, dynamic> json) {
    return TrackLyrics_t(
      lines: (json['lines'] as List?)?.map((e) => LyricLine_t.fromJson(e)).toList() ?? [],
    );
  }
  Map<String, dynamic> toJson() {
    return {
      'lines': lines.map((e) => e.toJson()).toList(),
    };
  }
}

class TrackListItem_t {
  final int trackIndex;
  final String track;

  TrackListItem_t({
    required this.trackIndex,
    required this.track,
  });

  factory TrackListItem_t.fromJson(Map<String, dynamic> json) {
    return TrackListItem_t(
      trackIndex: int.tryParse(json['trackIndex']?.toString() ?? '') ?? 0,
      track: json['track']?.toString() ?? '',
    );
  }
  Map<String, dynamic> toJson() {
    return {
      'trackIndex': trackIndex,
      'track': track,
    };
  }
}

class TrackListWidgetData_t {
  final List<TrackListItem_t> tracks;
  final int currentPlayingIndex;
  final bool readyForDisplay;

  TrackListWidgetData_t({
    required this.tracks,
    required this.currentPlayingIndex,
    required this.readyForDisplay,
  });

  factory TrackListWidgetData_t.fromJson(Map<String, dynamic> json) {
    return TrackListWidgetData_t(
      tracks: (json['tracks'] as List?)?.map((e) => TrackListItem_t.fromJson(e)).toList() ?? [],
      currentPlayingIndex: int.tryParse(json['currentPlayingIndex']?.toString() ?? '') ?? 0,
      readyForDisplay: json['readyForDisplay'] ?? false,
    );
  }
  Map<String, dynamic> toJson() {
    return {
      'tracks': tracks.map((e) => e.toJson()).toList(),
      'currentPlayingIndex': currentPlayingIndex,
      'readyForDisplay': readyForDisplay,
    };
  }
}

class UidScanned_t {
  final String uid;
  final int signal;

  UidScanned_t({
    required this.uid,
    required this.signal,
  });

  factory UidScanned_t.fromJson(Map<String, dynamic> json) {
    return UidScanned_t(
      uid: json['uid']?.toString() ?? '',
      signal: int.tryParse(json['signal']?.toString() ?? '') ?? 0,
    );
  }
  Map<String, dynamic> toJson() {
    return {
      'uid': uid,
      'signal': signal,
    };
  }
}

class TitleAndArtist_t {
  final String title;
  final String artist;
  final bool readyForDisplay;

  TitleAndArtist_t({
    required this.title,
    required this.artist,
    required this.readyForDisplay,
  });

  factory TitleAndArtist_t.fromJson(Map<String, dynamic> json) {
    return TitleAndArtist_t(
      title: json['title']?.toString() ?? '',
      artist: json['artist']?.toString() ?? '',
      readyForDisplay: json['readyForDisplay'] ?? false,
    );
  }
  Map<String, dynamic> toJson() {
    return {
      'title': title,
      'artist': artist,
      'readyForDisplay': readyForDisplay,
    };
  }
}

class ProgressData_t {
  final int currentDurationInTrack;
  final int totalDurationInTrack;
  final bool readyForDisplay;

  ProgressData_t({
    required this.currentDurationInTrack,
    required this.totalDurationInTrack,
    required this.readyForDisplay,
  });

  factory ProgressData_t.fromJson(Map<String, dynamic> json) {
    return ProgressData_t(
      currentDurationInTrack: int.tryParse(json['currentDurationInTrack']?.toString() ?? '') ?? 0,
      totalDurationInTrack: int.tryParse(json['totalDurationInTrack']?.toString() ?? '') ?? 0,
      readyForDisplay: json['readyForDisplay'] ?? false,
    );
  }
  Map<String, dynamic> toJson() {
    return {
      'currentDurationInTrack': currentDurationInTrack,
      'totalDurationInTrack': totalDurationInTrack,
      'readyForDisplay': readyForDisplay,
    };
  }
}

class RecordDesignData_t {
  final LabelDesignData_t labelDesign;
  final RingDesignData_t ringDesign;
  final bool readyForDisplay;

  RecordDesignData_t({
    required this.labelDesign,
    required this.ringDesign,
    required this.readyForDisplay,
  });

  factory RecordDesignData_t.fromJson(Map<String, dynamic> json) {
    return RecordDesignData_t(
      labelDesign: LabelDesignData_t.fromJson(json['labelDesign'] ?? {}),
      ringDesign: RingDesignData_t.fromJson(json['ringDesign'] ?? {}),
      readyForDisplay: json['readyForDisplay'] ?? false,
    );
  }
  Map<String, dynamic> toJson() {
    return {
      'labelDesign': labelDesign.toJson(),
      'ringDesign': ringDesign.toJson(),
      'readyForDisplay': readyForDisplay,
    };
  }
}

class LabelDesignData_t {
  final bool usesImage;
  final String labelColor;
  final String labelImage;

  LabelDesignData_t({
    required this.usesImage,
    required this.labelColor,
    required this.labelImage,
  });

  factory LabelDesignData_t.fromJson(Map<String, dynamic> json) {
    return LabelDesignData_t(
      usesImage: json['usesImage'] ?? false,
      labelColor: json['labelColor']?.toString() ?? '',
      labelImage: json['labelImage']?.toString() ?? '',
    );
  }
  Map<String, dynamic> toJson() {
    return {
      'usesImage': usesImage,
      'labelColor': labelColor,
      'labelImage': labelImage,
    };
  }
}

class RingDesignData_t {
  final bool usesImage;
  final String ringColor;
  final String ringImage;

  RingDesignData_t({
    required this.usesImage,
    required this.ringColor,
    required this.ringImage,
  });

  factory RingDesignData_t.fromJson(Map<String, dynamic> json) {
    return RingDesignData_t(
      usesImage: json['usesImage'] ?? false,
      ringColor: json['ringColor']?.toString() ?? '',
      ringImage: json['ringImage']?.toString() ?? '',
    );
  }
  Map<String, dynamic> toJson() {
    return {
      'usesImage': usesImage,
      'ringColor': ringColor,
      'ringImage': ringImage,
    };
  }
}



final globalMusicAssistantUrl = TypedKey<String>(
  'Global_MusicAssistantUrl',
);

final globalMusicAssistantToken = TypedKey<String>(
  'Global_MusicAssistantToken',
);

final globalMusicAssistantTargetPlayerId = TypedKey<String>(
  'Global_MusicAssistantTargetPlayerId',
);

final globalFlutterWebUrl = TypedKey<String>(
  'Global_FlutterWebUrl',
);

final globalFlutterWebPort = TypedKey<String>(
  'Global_FlutterWebPort',
);

final globalMqttBrokerHostAddress = TypedKey<String>(
  'Global_MqttBrokerHostAddress',
);

final globalMqttWebSocketPort = TypedKey<int>(
  'Global_MqttWebSocketPort',
);

final globalMqttTcpPort = TypedKey<int>(
  'Global_MqttTcpPort',
);

final globalLastKnownUidScanned = TypedKey<UidScanned_t>(
  'Global_LastKnownUidScanned',
  fromJson: (json) => UidScanned_t.fromJson(json),
  toJson: (data) => data.toJson(),
);

final globalLastUnknownUidScanned = TypedKey<UidScanned_t>(
  'Global_LastUnknownUidScanned',
  fromJson: (json) => UidScanned_t.fromJson(json),
  toJson: (data) => data.toJson(),
);

final globalCurrentShelfStatus = TypedKey<ShelfStatus_t>(
  'Global_CurrentShelfStatus',
  fromJson: (json) => ShelfStatus_t.fromJson(json),
  toJson: (data) => data.toJson(),
);

final globalReaderConnectionStatus = TypedKey<ReaderStatus_t>(
  'Global_ReaderConnectionStatus',
  fromJson: (json) => ReaderStatus_t.fromJson(json),
  toJson: (data) => data.toJson(),
);

final globalCurrentProjectorData = TypedKey<ProjectorData_t>(
  'Global_CurrentProjectorData',
  fromJson: (json) => ProjectorData_t.fromJson(json),
  toJson: (data) => data.toJson(),
);

final globalProjectorHeartbeatSignal = TypedKey<dynamic>(
  'Global_ProjectorHeartbeatSignal',
);

final globalDefinedProjectorErrorMessage = TypedKey<String>(
  'Global_DefinedProjectorErrorMessage',
);

final globalProjectorHeartbeat = TypedKey<dynamic>(
  'Global_ProjectorHeartbeat',
);

final globalTargetDisplayWidthInPixels = TypedKey<int>(
  'Global_TargetDisplayWidthInPixels',
);

final globalTargetDisplayHeightInPixels = TypedKey<int>(
  'Global_TargetDisplayHeightInPixels',
);

final globalCurrentMaptasticProjectorPositions = TypedKey<String>(
  'Global_CurrentMaptasticProjectorPositions',
);

final globalSavedMaptasticProjectorPositions = TypedKey<String>(
  'Global_SavedMaptasticProjectorPositions',
);

final globalLoadingWidgetState = TypedKey<WidgetState_t>(
  'Global_LoadingWidgetState',
  fromJson: (json) => WidgetState_t.fromJson(json),
  toJson: (data) => data.toJson(),
);

final globalInfoWidgetData = TypedKey<TitleAndArtist_t>(
  'Global_InfoWidgetData',
  fromJson: (json) => TitleAndArtist_t.fromJson(json),
  toJson: (data) => data.toJson(),
);

final globalInfoWidgetState = TypedKey<WidgetState_t>(
  'Global_InfoWidgetState',
  fromJson: (json) => WidgetState_t.fromJson(json),
  toJson: (data) => data.toJson(),
);

final globalOverlayWidgetData = TypedKey<OverlayData_t>(
  'Global_OverlayWidgetData',
  fromJson: (json) => OverlayData_t.fromJson(json),
  toJson: (data) => data.toJson(),
);

final globalOverlayWidgetState = TypedKey<WidgetState_t>(
  'Global_OverlayWidgetState',
  fromJson: (json) => WidgetState_t.fromJson(json),
  toJson: (data) => data.toJson(),
);

final globalRecordWidgetData = TypedKey<RecordDesignData_t>(
  'Global_RecordWidgetData',
  fromJson: (json) => RecordDesignData_t.fromJson(json),
  toJson: (data) => data.toJson(),
);

final globalRecordWidgetState = TypedKey<WidgetState_t>(
  'Global_RecordWidgetState',
  fromJson: (json) => WidgetState_t.fromJson(json),
  toJson: (data) => data.toJson(),
);

final globalTrackListWidgetData = TypedKey<TrackListWidgetData_t>(
  'Global_TrackListWidgetData',
  fromJson: (json) => TrackListWidgetData_t.fromJson(json),
  toJson: (data) => data.toJson(),
);

final globalTrackListWidgetState = TypedKey<WidgetState_t>(
  'Global_TrackListWidgetState',
  fromJson: (json) => WidgetState_t.fromJson(json),
  toJson: (data) => data.toJson(),
);

final globalProgressWidgetData = TypedKey<ProgressData_t>(
  'Global_ProgressWidgetData',
  fromJson: (json) => ProgressData_t.fromJson(json),
  toJson: (data) => data.toJson(),
);

final globalProgressWidgetState = TypedKey<WidgetState_t>(
  'Global_ProgressWidgetState',
  fromJson: (json) => WidgetState_t.fromJson(json),
  toJson: (data) => data.toJson(),
);

final globalMediaPlaybackState = TypedKey<MediaPlaybackState_t>(
  'Global_MediaPlaybackState',
  fromJson: (json) => MediaPlaybackState_t.fromJson(json),
  toJson: (data) => data.toJson(),
);

final globalActiveTrack = TypedKey<ActiveTrack_t>(
  'Global_ActiveTrack',
  fromJson: (json) => ActiveTrack_t.fromJson(json),
  toJson: (data) => data.toJson(),
);

