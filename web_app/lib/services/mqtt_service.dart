import 'dart:async';
import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:mqtt_client/mqtt_client.dart';
import 'package:mqtt_client/mqtt_browser_client.dart';

class MqttService {
  static const String _brokerAddress = '192.168.50.214';
  static const int _brokerPort = 9001;

  MqttBrowserClient? _mqttClient;

  Stream<List<MqttReceivedMessage<MqttMessage>>>? get updates =>
      _mqttClient?.updates;

  bool get _isConnected =>
      _mqttClient?.connectionStatus?.state == MqttConnectionState.connected;

  bool _initializeClient() {
    if (_mqttClient != null) {
      return true;
    }
    try {
      final String uniqueClientIdentifier =
          'flutter_client_${DateTime.now().millisecondsSinceEpoch}';
      _mqttClient = MqttBrowserClient.withPort(
        'ws://$_brokerAddress',
        uniqueClientIdentifier,
        _brokerPort,
      );
      _mqttClient!.websocketProtocols =
          MqttClientConstants.protocolsSingleDefault;
      _mqttClient!.keepAlivePeriod = 20;
      _mqttClient!.onDisconnected = _onDisconnected;
      _mqttClient!.onConnected = _onConnected;
      _mqttClient!.setProtocolV311();
      _mqttClient!.logging(on: false);
      return true;
    } catch (error) {
      debugPrint('MqttService: Client initialization failed: $error');
      _mqttClient = null;
      return false;
    }
  }

  Future<bool> connect() async {
    if (!_initializeClient()) {
      return false;
    }
    try {
      debugPrint(
        'MqttService: Connecting to broker at ws://$_brokerAddress:$_brokerPort...',
      );
      final MqttClientConnectionStatus? connectionStatus = await _mqttClient!
          .connect()
          .timeout(
            const Duration(seconds: 10),
            onTimeout: () {
              debugPrint('MqttService: Connection attempt timed out.');
              _mqttClient?.disconnect();
              return null;
            },
          );
      if (connectionStatus?.state == MqttConnectionState.connected) {
        debugPrint('MqttService: Successfully connected to broker.');
        return true;
      } else {
        debugPrint(
          'MqttService: Connection failed with state: ${connectionStatus?.state}',
        );
        return false;
      }
    } on Exception catch (error) {
      debugPrint('MqttService: Connection exception: $error');
      _mqttClient?.disconnect();
      return false;
    }
  }

  void subscribe(String topic) {
    if (_isConnected) {
      debugPrint('MqttService: Subscribing to topic "$topic".');
      _mqttClient!.subscribe(topic, MqttQos.atLeastOnce);
    } else {
      debugPrint('MqttService: Cannot subscribe — client is not connected.');
    }
  }

  void Function(String id, double width, double height)? onProjectorDiscovered;

  void _onConnected() {
    debugPrint('MqttService: Connected to Pi MQTT broker.');

    _mqttClient!.subscribe('vinyl/shelf/mapping/status', MqttQos.atLeastOnce);

    _mqttClient!.updates!.listen((List<MqttReceivedMessage<MqttMessage>> c) {
      final MqttPublishMessage recMess = c[0].payload as MqttPublishMessage;
      final String topic = c[0].topic;
      final String pt = MqttPublishPayload.bytesToStringAsString(
        recMess.payload.message,
      );

      if (topic == 'vinyl/shelf/mapping/status') {
        try {
          final data = jsonDecode(pt);
          if (data['id'] != null &&
              data['width'] != null &&
              data['height'] != null) {
            onProjectorDiscovered?.call(
              data['id'].toString(),
              (data['width'] as num).toDouble(),
              (data['height'] as num).toDouble(),
            );
          }
        } catch (e) {
          debugPrint('Error parsing projector status: $e');
        }
      }
    });
  }

  void pingProjectors() {
    if (!_isConnected) return;
    final Map<String, dynamic> payload = {'action': 'ping'};
    final MqttClientPayloadBuilder payloadBuilder = MqttClientPayloadBuilder();
    payloadBuilder.addString(jsonEncode(payload));
    _mqttClient!.publishMessage(
      'vinyl/shelf/mapping',
      MqttQos.atLeastOnce,
      payloadBuilder.payload!,
    );
  }

  void _onDisconnected() {
    debugPrint('MqttService: Disconnected from Pi MQTT broker.');
  }

  void requestLibrary() {
    if (!_isConnected) {
      debugPrint('MqttService: Cannot request library — not connected.');
      return;
    }
    _mqttClient!.publishMessage(
      'vinyl/shelf/library/request',
      MqttQos.atMostOnce,
      MqttClientPayloadBuilder().payload!,
    );
  }

  void deleteVinyl({required String uid}) {
    if (!_isConnected) {
      debugPrint(
        'MqttService: Not connected — attempting reconnect before delete.',
      );
      connect().then((bool didConnect) {
        if (didConnect) _publishDeleteMessage(uid);
      });
    } else {
      _publishDeleteMessage(uid);
    }
  }

  void _publishDeleteMessage(String uid) {
    if (!_isConnected) {
      debugPrint(
        'MqttService: Delete skipped — still not connected after reconnect.',
      );
      return;
    }
    final MqttClientPayloadBuilder payloadBuilder = MqttClientPayloadBuilder();
    payloadBuilder.addString(uid);
    debugPrint('MqttService: Publishing delete for UID "$uid".');
    _mqttClient!.publishMessage(
      'vinyl/shelf/delete',
      MqttQos.atLeastOnce,
      payloadBuilder.payload!,
    );
  }

  void registerVinyl({
    required String uid,
    required String artist,
    required String album,
    required String tracks,
    required String mediaUri,
    required String innerRecordColor,
    required String innerRecordImage,
    required String outerDesignColor,
    required String outerDesignImage,
    required String overlayArt,
    required String albumCoverArt,
  }) {
    if (!_isConnected) {
      debugPrint(
        'MqttService: Not connected — attempting reconnect before register.',
      );
      connect().then((bool didConnect) {
        if (didConnect) {
          _publishRegisterMessage(
            uid,
            artist,
            album,
            tracks,
            mediaUri,
            innerRecordColor,
            innerRecordImage,
            outerDesignColor,
            outerDesignImage,
            overlayArt,
            albumCoverArt,
          );
        }
      });
    } else {
      _publishRegisterMessage(
        uid,
        artist,
        album,
        tracks,
        mediaUri,
        innerRecordColor,
        innerRecordImage,
        outerDesignColor,
        outerDesignImage,
        overlayArt,
        albumCoverArt,
      );
    }
  }

  void _publishRegisterMessage(
    String uid,
    String artist,
    String album,
    String tracks,
    String mediaUri,
    String innerRecordColor,
    String innerRecordImage,
    String outerDesignColor,
    String outerDesignImage,
    String overlayArt,
    String albumCoverArt,
  ) {
    _publishWithRetry(
      topic: 'vinyl/shelf/register',
      uid: uid,
      artist: artist,
      album: album,
      tracks: tracks,
      mediaUri: mediaUri,
      innerRecordColor: innerRecordColor,
      innerRecordImage: innerRecordImage,
      outerDesignColor: outerDesignColor,
      outerDesignImage: outerDesignImage,
      overlayArt: overlayArt,
      albumCoverArt: albumCoverArt,
      operationType: 'registration',
    );
  }

  Future<void> _publishWithRetry({
    required String topic,
    required String uid,
    required String artist,
    required String album,
    required String tracks,
    required String mediaUri,
    required String innerRecordColor,
    required String innerRecordImage,
    required String outerDesignColor,
    required String outerDesignImage,
    required String overlayArt,
    required String albumCoverArt,
    required String operationType,
    int attemptCount = 0,
    int maxAttempts = 3,
  }) async {
    if (!_isConnected) {
      debugPrint('MqttService: $operationType skipped — not connected.');
      return;
    }

    final Map<String, dynamic> payload = {
      'uid': uid,
      'artist': artist,
      'album': album,
      'tracks': tracks,
      'media_uri': mediaUri,
      'inner_record_color': innerRecordColor,
      'inner_record_image': innerRecordImage,
      'outer_design_color': outerDesignColor,
      'outer_design_image': outerDesignImage,
      'overlay_art': overlayArt,
      'album_cover_art': albumCoverArt,
    };

    final MqttClientPayloadBuilder payloadBuilder = MqttClientPayloadBuilder();
    payloadBuilder.addString(jsonEncode(payload));

    try {
      debugPrint(
        'MqttService: Publishing $operationType for "$album" (attempt ${attemptCount + 1}).',
      );
      _mqttClient!.publishMessage(
        topic,
        MqttQos.atLeastOnce,
        payloadBuilder.payload!,
      );
    } catch (error) {
      debugPrint('MqttService: Publish failed — $error');

      if (attemptCount < maxAttempts - 1) {
        await Future.delayed(Duration(milliseconds: 200 * (attemptCount + 1)));
        await _publishWithRetry(
          topic: topic,
          uid: uid,
          artist: artist,
          album: album,
          tracks: tracks,
          mediaUri: mediaUri,
          innerRecordColor: innerRecordColor,
          innerRecordImage: innerRecordImage,
          outerDesignColor: outerDesignColor,
          outerDesignImage: outerDesignImage,
          overlayArt: overlayArt,
          albumCoverArt: albumCoverArt,
          operationType: operationType,
          attemptCount: attemptCount + 1,
          maxAttempts: maxAttempts,
        );
      } else {
        debugPrint(
          'MqttService: $operationType exhausted retries after $maxAttempts attempts.',
        );
      }
    }
  }

  void updateVinyl({
    required String uid,
    required String artist,
    required String album,
    required String tracks,
    required String mediaUri,
    required String innerRecordColor,
    required String innerRecordImage,
    required String outerDesignColor,
    required String outerDesignImage,
    required String overlayArt,
    required String albumCoverArt,
  }) {
    if (!_isConnected) {
      debugPrint(
        'MqttService: Not connected — attempting reconnect before update.',
      );
      connect().then((bool didConnect) {
        if (didConnect) {
          _publishUpdateMessage(
            uid,
            artist,
            album,
            tracks,
            mediaUri,
            innerRecordColor,
            innerRecordImage,
            outerDesignColor,
            outerDesignImage,
            overlayArt,
            albumCoverArt,
          );
        }
      });
    } else {
      _publishUpdateMessage(
        uid,
        artist,
        album,
        tracks,
        mediaUri,
        innerRecordColor,
        innerRecordImage,
        outerDesignColor,
        outerDesignImage,
        overlayArt,
        albumCoverArt,
      );
    }
  }

  void _publishUpdateMessage(
    String uid,
    String artist,
    String album,
    String tracks,
    String mediaUri,
    String innerRecordColor,
    String innerRecordImage,
    String outerDesignColor,
    String outerDesignImage,
    String overlayArt,
    String albumCoverArt,
  ) {
    unawaited(
      _publishWithRetry(
        topic: 'vinyl/shelf/update',
        uid: uid,
        artist: artist,
        album: album,
        tracks: tracks,
        mediaUri: mediaUri,
        innerRecordColor: innerRecordColor,
        innerRecordImage: innerRecordImage,
        outerDesignColor: outerDesignColor,
        outerDesignImage: outerDesignImage,
        overlayArt: overlayArt,
        albumCoverArt: albumCoverArt,
        operationType: 'update',
      ),
    );
  }

  void publishPlaybackEvent({
    required String event,
    required int trackIndex,
    required String trackName,
    required int position,
    required int duration,
    String? state,
  }) {
    if (!_isConnected) {
      debugPrint(
        'MqttService: Not connected — attempting reconnect before playback event.',
      );
      connect().then((bool didConnect) {
        if (didConnect) {
          _publishPlaybackEventMessage(
            event: event,
            trackIndex: trackIndex,
            trackName: trackName,
            position: position,
            duration: duration,
            state: state,
          );
        } else {
          debugPrint('MqttService: Playback event skipped — reconnect failed.');
        }
      });
      return;
    }

    _publishPlaybackEventMessage(
      event: event,
      trackIndex: trackIndex,
      trackName: trackName,
      position: position,
      duration: duration,
      state: state,
    );
  }

  void _publishPlaybackEventMessage({
    required String event,
    required int trackIndex,
    required String trackName,
    required int position,
    required int duration,
    String? state,
  }) {
    if (!_isConnected) {
      debugPrint('MqttService: Playback event skipped — not connected.');
      return;
    }

    final Map<String, dynamic> payload = {
      'event': event,
      'track_index': trackIndex,
      'track_name': trackName,
      'position': position,
      'duration': duration,
      if (state != null && state.isNotEmpty) 'state': state,
      'timestamp': DateTime.now().toIso8601String(),
    };

    final MqttClientPayloadBuilder payloadBuilder = MqttClientPayloadBuilder();
    payloadBuilder.addString(jsonEncode(payload));

    if (event != 'progress') {
      debugPrint(
        'MqttService: Publishing playback event "$event" for track "$trackName" (index: $trackIndex).',
      );
    }

    _mqttClient!.publishMessage(
      'vinyl/shelf/playback/state',
      MqttQos.atLeastOnce,
      payloadBuilder.payload!,
    );
  }

  void publishRaw(
    String topic,
    String message, {
    MqttQos qos = MqttQos.atLeastOnce,
  }) {
    if (!_isConnected) {
      debugPrint('MqttService: Cannot publish raw — client is not connected.');
      return;
    }
    final MqttClientPayloadBuilder payloadBuilder = MqttClientPayloadBuilder();
    payloadBuilder.addString(message);

    _mqttClient!.publishMessage(topic, qos, payloadBuilder.payload!);
  }

  String decodePayload(dynamic rawPayload) {
    final MqttPublishMessage publishMessage = rawPayload as MqttPublishMessage;
    return MqttPublishPayload.bytesToStringAsString(
      publishMessage.payload.message,
    );
  }

  void toggleMappingMode({String targetId = 'all'}) {
    if (!_isConnected) return;
    final Map<String, dynamic> payload = {
      'action': 'toggle',
      'targetId': targetId,
    };
    final MqttClientPayloadBuilder builder = MqttClientPayloadBuilder();
    builder.addString(jsonEncode(payload));
    _mqttClient!.publishMessage(
      'vinyl/shelf/mapping',
      MqttQos.atLeastOnce,
      builder.payload!,
    );
  }

  void updateMappingLayout(
    List<Map<String, dynamic>> layoutData, {
    String targetId = 'all',
  }) {
    if (!_isConnected) return;
    final Map<String, dynamic> payload = {
      'action': 'layout',
      'targetId': targetId,
      'data': layoutData,
    };
    final MqttClientPayloadBuilder builder = MqttClientPayloadBuilder();
    builder.addString(jsonEncode(payload));
    _mqttClient!.publishMessage(
      'vinyl/shelf/mapping',
      MqttQos.atLeastOnce,
      builder.payload!,
    );
  }
}
