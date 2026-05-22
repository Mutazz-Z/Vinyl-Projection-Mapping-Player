import 'package:flutter/material.dart';
import '../models/enums.dart';
import '../screens/register_screen.dart';
import 'system_data_source.dart';
import 'music_assistant/music_assistant_service.dart';

class AppCoordinator {
  final SystemDataSource dataSource;
  final MusicAssistantService musicAssistant;
  final GlobalKey<NavigatorState> navigatorKey;

  String _lastPlaybackEventFingerprint = '';
  DateTime? _lastPlaybackEventAt;

  AppCoordinator({
    required this.dataSource,
    required this.musicAssistant,
    required this.navigatorKey,
  });

  void start() {
    dataSource.onDataSourceChanged.listen((args) {
      if (args.variable == 'GLOBAL_LastUnknownNfcTag') {
        _handleRegistrationRequest(args.data.toString());
      } else if (args.variable == 'GLOBAL_CurrentProjectorData') {
        _handleVisualPlaybackEvent(args.data);
      }
    });

    debugPrint('AppCoordinator: Active DataSource stream configured.');
  }

  void _handleRegistrationRequest(String uid) {
    if (uid.isEmpty) return;
    debugPrint('AppCoordinator: Registration trigger received for UID "$uid".');
    navigatorKey.currentState?.push(MaterialPageRoute(builder: (_) => RegisterScreen(uid: uid)));
  }

  void _handleVisualPlaybackEvent(dynamic decodedPayload) {
    try {
      if (decodedPayload is! Map<String, dynamic>) return;

      final String effectStr = (decodedPayload['effect'] ?? '').toString();
      final VisualEffect effect = VisualEffect.fromJson(effectStr);
      final String mediaUri = (decodedPayload['media_uri'] ?? '')
          .toString()
          .trim();

      if (_isDuplicateEvent(effect, mediaUri)) return;
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
}
