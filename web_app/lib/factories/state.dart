// ignore_for_file: camel_case_types, non_constant_identifier_names, constant_identifier_names
// ==========================================
// GENERATED CODE - DO NOT EDIT
// ==========================================

import 'typed_key.dart';

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

class AlbumTrackList_t {
  final String track;
  final int duration;
  final String coverImage;

  AlbumTrackList_t({
    required this.track,
    required this.duration,
    required this.coverImage,
  });

  factory AlbumTrackList_t.fromJson(Map<String, dynamic> json) {
    return AlbumTrackList_t(
      track: json['track']?.toString() ?? '',
      duration: json['duration'] ?? 0,
      coverImage: json['cover_image']?.toString() ?? '',
    );
  }
  Map<String, dynamic> toJson() {
    return {
      'track': track,
      'duration': duration,
      'cover_image': coverImage,
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

final globalLastKnownUidScanned = TypedKey<String>(
  'Global_LastKnownUidScanned',
);

final globalLastUnknownUidScanned = TypedKey<String>(
  'Global_LastUnknownUidScanned',
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

final globalMediaPlaybackState = TypedKey<MediaPlaybackState_t>(
  'Global_MediaPlaybackState',
  fromJson: (json) => MediaPlaybackState_t.fromJson(json),
  toJson: (data) => data.toJson(),
);

final globalActiveRecordTrackName = TypedKey<String>(
  'Global_ActiveRecordTrackName',
);

final globalActiveTrackProgressInSeconds = TypedKey<double>(
  'Global_ActiveTrackProgressInSeconds',
);

final globalActiveTrackTotalDurationInSeconds = TypedKey<double>(
  'Global_ActiveTrackTotalDurationInSeconds',
);

