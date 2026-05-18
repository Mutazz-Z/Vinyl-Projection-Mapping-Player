import 'dart:async';
import 'dart:convert';
import 'package:flutter/material.dart';
import '../models/enums.dart';
import '../screens/register_screen.dart';
import 'mqtt_service.dart';
import 'music_assistant_service.dart';

class AppCoordinator {
  final MqttService mqttService;
  final MusicAssistantService musicAssistant;
  final GlobalKey<NavigatorState> navigatorKey;

  String _lastPlaybackEventFingerprint = '';
  DateTime? _lastPlaybackEventAt;

  AppCoordinator({
    required this.mqttService,
    required this.musicAssistant,
    required this.navigatorKey,
  });

  void start() {
    final messageStream = mqttService.updates;

    messageStream.listen((List<dynamic> messages) {
      if (messages.isEmpty) return;

      final String topic = messages[0].topic;
      final String payload = mqttService.decodePayload(messages[0].payload);

      if (topic == 'vinyl/request_register') {
        _handleRegistrationRequest(payload);
      } else if (topic == 'vinyl/shelf/visuals') {
        _handleVisualPlaybackEvent(payload);
      }
    });

    mqttService.subscribe('vinyl/request_register');
    mqttService.subscribe('vinyl/shelf/visuals');
    debugPrint('AppCoordinator: Active background streams configured.');
  }

  void _handleRegistrationRequest(String uid) {
    debugPrint('AppCoordinator: Registration trigger received for UID "$uid".');
    navigatorKey.currentState?.push(
      MaterialPageRoute(builder: (_) => RegisterScreen(uid: uid)),
    );
  }

  void _handleVisualPlaybackEvent(String payload) {
    try {
      final dynamic decodedPayload = jsonDecode(payload);
      if (decodedPayload is! Map<String, dynamic>) return;

      final String effectStr = (decodedPayload['effect'] ?? '').toString();
      final VisualEffect effect = VisualEffect.fromJson(effectStr);
      final String mediaUri = (decodedPayload['media_uri'] ?? '')
          .toString()
          .trim();

      if (_isDuplicateEvent(effect, mediaUri)) return;

      if (effect == VisualEffect.play && mediaUri.isNotEmpty) {
        _executePlayback(musicAssistant.playMediaUri(mediaUri), 'play');
      } else if (effect == VisualEffect.stop) {
        _executePlayback(musicAssistant.stopPlayback(), 'stop');
      }
    } catch (error) {
      debugPrint('AppCoordinator: Failed to parse visual payload: $error');
    }
  }

  bool _isDuplicateEvent(VisualEffect effect, String mediaUri) {
    final String fingerprint = '$effect|$mediaUri';
    final DateTime now = DateTime.now();

    if (_lastPlaybackEventFingerprint == fingerprint &&
        _lastPlaybackEventAt != null &&
        now.difference(_lastPlaybackEventAt!) < const Duration(seconds: 2)) {
      return true;
    }

    _lastPlaybackEventFingerprint = fingerprint;
    _lastPlaybackEventAt = now;
    return false;
  }

  void _executePlayback(Future<void> action, String operationName) {
    unawaited(
      action.catchError((Object error) {
        debugPrint(
          'AppCoordinator: Music Assistant $operationName failed: ${_compactError(error)}',
        );
      }),
    );
  }

  String _compactError(Object error) {
    const int maxLength = 320;
    final String fullError = error.toString().replaceAll('\n', ' ').trim();
    return fullError.length <= maxLength
        ? fullError
        : '${fullError.substring(0, maxLength)}...';
  }
}
