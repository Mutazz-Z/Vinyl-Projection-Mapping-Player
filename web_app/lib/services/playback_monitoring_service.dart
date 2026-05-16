import 'dart:async';
import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import 'package:web_app/services/mqtt_service.dart';
import 'package:web_app/main.dart';

class PlaybackMonitoringService {
  static const Duration _pollInterval = Duration(milliseconds: 500);
  static const int _seekThresholdSeconds = 2;

  PlaybackMonitoringService({required MqttService mqttService})
    : _mqttService = mqttService;

  final MqttService _mqttService;

  Timer? _pollTimer;
  String? _lastPlayerState;
  int? _lastTrackIndex;
  String? _lastTrackName;
  int? _lastPositionInMsec;
  DateTime? _lastPlayingStateAt;
  bool _pollInFlight = false;
  DateTime? _lastTimeoutLoggedAt;

  bool get isMonitoring => _pollTimer != null;

  void startMonitoring() {
    if (_pollTimer != null) {
      debugPrint('PlaybackMonitoringService: Already monitoring.');
      return;
    }

    debugPrint('PlaybackMonitoringService: Starting 500ms poll interval.');
    _pollTimer = Timer.periodic(_pollInterval, (_) async {
      await _checkPlaybackState();
    });

    unawaited(_checkPlaybackState());
  }

  void stopMonitoring() {
    _pollTimer?.cancel();
    _pollTimer = null;
    debugPrint('PlaybackMonitoringService: Stopped monitoring.');
  }

  Future<void> _checkPlaybackState() async {
    if (_pollInFlight) {
      return;
    }

    _pollInFlight = true;
    try {
      final settings = musicAssistant.settings;

      if (settings.playerEntityId.isEmpty) {
        return;
      }

      final String? haUrl = settings.url.isNotEmpty ? settings.url : null;
      final String? token = settings.token.isNotEmpty ? settings.token : null;

      if (haUrl == null || token == null) {
        return;
      }

      final Uri stateUri = Uri.parse(
        '$haUrl/api/states/${settings.playerEntityId}',
      );

      final http.Response response = await http
          .get(
            stateUri,
            headers: <String, String>{
              'Authorization': 'Bearer $token',
              'Content-Type': 'application/json',
            },
          )
          .timeout(const Duration(seconds: 5));

      if (response.statusCode == 200) {
        final Map<String, dynamic> stateData =
            jsonDecode(response.body) as Map<String, dynamic>;
        await _processStateChange(stateData);
      }
    } on TimeoutException catch (error) {
      final DateTime now = DateTime.now();
      if (_lastTimeoutLoggedAt == null ||
          now.difference(_lastTimeoutLoggedAt!) > const Duration(seconds: 15)) {
        _lastTimeoutLoggedAt = now;
        debugPrint('PlaybackMonitoringService: Poll timeout: $error');
      }
    } catch (error) {
      debugPrint('PlaybackMonitoringService: Poll error: $error');
    } finally {
      _pollInFlight = false;
    }
  }

  Future<void> _processStateChange(Map<String, dynamic> stateData) async {
    final String state = (stateData['state'] ?? 'unknown').toString();
    final Map<String, dynamic> attributes =
        (stateData['attributes'] ?? <String, dynamic>{})
            as Map<String, dynamic>;

    final int? rawTrackIndex = _firstPresentInt(attributes, <String>[
      'queue_position',
      'queue_index',
      'current_track_index',
      'media_track',
      'track_index',
    ]);
    final int? currentTrackIndex = rawTrackIndex == null
        ? null
        : (rawTrackIndex > 0 ? rawTrackIndex - 1 : rawTrackIndex);

    final int? mediaDuration = _firstPresentInt(attributes, <String>[
      'media_duration',
      'duration',
      'media_length',
    ]);
    final int? mediaPosition = _resolvePlaybackPositionSeconds(
      attributes: attributes,
      state: state,
      mediaDuration: mediaDuration,
    );
    final Map<String, dynamic>? currentTrack =
        attributes['current_track'] as Map<String, dynamic>?;
    final String currentTrackName =
        _firstPresentString(<String?>[
          currentTrack?['name'] as String?,
          currentTrack?['title'] as String?,
          attributes['media_title'] as String?,
          attributes['title'] as String?,
        ]) ??
        'Unknown';

    if (_lastPlayerState != state) {
      if (_isTransientIdleBounce(state: state, mediaPosition: mediaPosition)) {
        return;
      }

      _lastPlayerState = state;
      debugPrint('PlaybackMonitoringService: State changed to "$state"');

      if (state == 'playing') {
        _lastPlayingStateAt = DateTime.now();
        _mqttService.publishPlaybackEvent(
          event: 'play',
          trackIndex: currentTrackIndex ?? -1,
          trackName: currentTrackName,
          position: mediaPosition ?? 0,
          duration: mediaDuration ?? 0,
          state: state,
        );
      } else if (state == 'paused') {
        _mqttService.publishPlaybackEvent(
          event: 'pause',
          trackIndex: currentTrackIndex ?? -1,
          trackName: currentTrackName,
          position: mediaPosition ?? 0,
          duration: mediaDuration ?? 0,
          state: state,
        );
      }
    }

    if (_lastTrackIndex != null &&
        currentTrackIndex != null &&
        _lastTrackIndex != currentTrackIndex) {
      debugPrint(
        'PlaybackMonitoringService: Track changed from $_lastTrackIndex to $currentTrackIndex',
      );

      final int diff = (currentTrackIndex - _lastTrackIndex!).abs();
      if (diff > 1) {
        if (currentTrackIndex > _lastTrackIndex!) {
          _mqttService.publishPlaybackEvent(
            event: 'skip_forward',
            trackIndex: currentTrackIndex,
            trackName: currentTrackName,
            position: mediaPosition ?? 0,
            duration: mediaDuration ?? 0,
          );
        } else {
          _mqttService.publishPlaybackEvent(
            event: 'skip_backward',
            trackIndex: currentTrackIndex,
            trackName: currentTrackName,
            position: mediaPosition ?? 0,
            duration: mediaDuration ?? 0,
          );
        }
      } else {
        _mqttService.publishPlaybackEvent(
          event: 'track_changed',
          trackIndex: currentTrackIndex,
          trackName: currentTrackName,
          position: mediaPosition ?? 0,
          duration: mediaDuration ?? 0,
        );
      }
    }

    final bool hasUsableTrackName =
        currentTrackName.isNotEmpty &&
        currentTrackName.toLowerCase() != 'unknown';
    final bool previousNameUsable =
        (_lastTrackName ?? '').isNotEmpty &&
        (_lastTrackName ?? '').toLowerCase() != 'unknown';
    if (state == 'playing' &&
        hasUsableTrackName &&
        previousNameUsable &&
        _lastTrackName != null &&
        _lastTrackName != currentTrackName) {
      debugPrint(
        'PlaybackMonitoringService: Track title changed from "$_lastTrackName" to "$currentTrackName"',
      );
      _mqttService.publishPlaybackEvent(
        event: 'track_changed',
        trackIndex: currentTrackIndex ?? -1,
        trackName: currentTrackName,
        position: mediaPosition ?? 0,
        duration: mediaDuration ?? 0,
        state: state,
      );
    }

    if (_lastPositionInMsec != null &&
        mediaPosition != null &&
        state == 'playing' &&
        (_lastPositionInMsec! - mediaPosition).abs() > _seekThresholdSeconds) {
      debugPrint(
        'PlaybackMonitoringService: Seek detected: $_lastPositionInMsec -> $mediaPosition',
      );
      _mqttService.publishPlaybackEvent(
        event: 'seek',
        trackIndex: currentTrackIndex ?? -1,
        trackName: currentTrackName,
        position: mediaPosition,
        duration: mediaDuration ?? 0,
        state: state,
      );
    }

    if (state == 'playing' &&
        mediaPosition != null &&
        mediaDuration != null &&
        mediaDuration > 0) {
      _mqttService.publishPlaybackEvent(
        event: 'progress',
        trackIndex: currentTrackIndex ?? -1,
        trackName: currentTrackName,
        position: mediaPosition,
        duration: mediaDuration,
        state: state,
      );
    }

    _lastTrackIndex = currentTrackIndex;
    _lastTrackName = currentTrackName;
    _lastPositionInMsec = mediaPosition;
  }

  int? _firstPresentInt(Map<String, dynamic> source, List<String> keys) {
    for (final String key in keys) {
      final dynamic value = source[key];
      if (value is num) {
        return value.toInt();
      }
      if (value is String) {
        final int? parsed = int.tryParse(value.trim());
        if (parsed != null) {
          return parsed;
        }
      }
    }
    return null;
  }

  String? _firstPresentString(List<String?> values) {
    for (final String? value in values) {
      if (value != null && value.trim().isNotEmpty) {
        return value.trim();
      }
    }
    return null;
  }

  int? _resolvePlaybackPositionSeconds({
    required Map<String, dynamic> attributes,
    required String state,
    required int? mediaDuration,
  }) {
    final int? basePosition = _firstPresentInt(attributes, <String>[
      'media_position',
      'position',
      'elapsed_time',
      'elapsed',
    ]);

    if (basePosition == null) {
      return null;
    }

    int resolved = basePosition;
    if (state == 'playing') {
      final dynamic updatedAtRaw = attributes['media_position_updated_at'];
      if (updatedAtRaw is String && updatedAtRaw.trim().isNotEmpty) {
        final DateTime? updatedAt = DateTime.tryParse(updatedAtRaw);
        if (updatedAt != null) {
          final int elapsedSeconds = DateTime.now()
              .toUtc()
              .difference(updatedAt.toUtc())
              .inSeconds;
          if (elapsedSeconds > 0) {
            resolved += elapsedSeconds;
          }
        }
      }
    }

    if (resolved < 0) {
      resolved = 0;
    }
    if (mediaDuration != null &&
        mediaDuration > 0 &&
        resolved > mediaDuration) {
      resolved = mediaDuration;
    }

    return resolved;
  }

  bool _isTransientIdleBounce({
    required String state,
    required int? mediaPosition,
  }) {
    if (state != 'idle' || _lastPlayingStateAt == null) {
      return false;
    }

    final Duration sinceLastPlaying = DateTime.now().difference(
      _lastPlayingStateAt!,
    );
    final bool stillNearStart = mediaPosition == null || mediaPosition <= 2;
    final bool isTransitionWindow =
        sinceLastPlaying < const Duration(seconds: 3);

    if (stillNearStart && isTransitionWindow) {
      debugPrint('PlaybackMonitoringService: Ignoring transient idle bounce.');
      return true;
    }

    return false;
  }
}
