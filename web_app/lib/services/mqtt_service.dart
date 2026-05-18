import 'dart:async';
import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:mqtt_client/mqtt_client.dart';
import 'package:mqtt_client/mqtt_browser_client.dart';

class MqttService {
  MqttBrowserClient? _mqttClient;
  String? _currentBrokerAddress;
  int? _currentBrokerPort;

  final StreamController<List<MqttReceivedMessage<MqttMessage>>>
  _updatesController =
      StreamController<List<MqttReceivedMessage<MqttMessage>>>.broadcast();
  StreamSubscription? _rawUpdatesSubscription;

  final Set<String> _activeSubscriptions = {};

  Stream<List<MqttReceivedMessage<MqttMessage>>> get updates =>
      _updatesController.stream;

  bool get _isConnected =>
      _mqttClient?.connectionStatus?.state == MqttConnectionState.connected;

  void disconnect() {
    if (_mqttClient != null) {
      debugPrint('MqttService: Disconnecting current client...');
      try {
        _mqttClient!.disconnect();
      } catch (_) {}
      _mqttClient = null;
    }
    _rawUpdatesSubscription?.cancel();
  }

  bool _initializeClient(String brokerAddress, int brokerPort) {
    if (_mqttClient != null) {
      if (_mqttClient!.server == 'ws://$brokerAddress' &&
          _mqttClient!.port == brokerPort) {
        return true;
      } else {
        debugPrint(
          'MqttService: Broker config changed. Tearing down old client.',
        );
        disconnect();
      }
    }

    try {
      final String uniqueClientIdentifier =
          'flutter_client_${DateTime.now().millisecondsSinceEpoch}';
      _mqttClient = MqttBrowserClient.withPort(
        'ws://$brokerAddress',
        uniqueClientIdentifier,
        brokerPort,
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

  Future<bool> connect(String brokerAddress, int brokerPort) async {
    _currentBrokerAddress = brokerAddress;
    _currentBrokerPort = brokerPort;

    if (!_initializeClient(brokerAddress, brokerPort)) return false;

    if (_isConnected) {
      debugPrint(
        'MqttService: Already connected to $brokerAddress. Skipping request.',
      );
      return true;
    }

    try {
      debugPrint(
        'MqttService: Connecting to ws://$brokerAddress:$brokerPort...',
      );
      final MqttClientConnectionStatus? connectionStatus = await _mqttClient!
          .connect()
          .timeout(
            const Duration(seconds: 10),
            onTimeout: () {
              debugPrint('MqttService: Connection attempt timed out.');
              disconnect();
              return null;
            },
          );

      if (connectionStatus?.state == MqttConnectionState.connected) {
        debugPrint('MqttService: Successfully connected to broker.');
        return true;
      } else {
        return false;
      }
    } on Exception catch (error) {
      debugPrint('MqttService: Connection exception: $error');
      disconnect();
      return false;
    }
  }

  void subscribe(String topic) {
    _activeSubscriptions.add(topic);
    if (_isConnected) {
      debugPrint('MqttService: Subscribing to topic "$topic".');
      _mqttClient!.subscribe(topic, MqttQos.atLeastOnce);
    } else {
      debugPrint('MqttService: Saved subscription "$topic" for later.');
    }
  }

  void Function(String id, double width, double height)? onProjectorDiscovered;

  void _onConnected() {
    debugPrint('MqttService: Connected to MQTT broker.');

    _rawUpdatesSubscription?.cancel();
    if (_mqttClient!.updates != null) {
      _rawUpdatesSubscription = _mqttClient!.updates!.listen((messages) {
        _updatesController.add(messages);

        if (messages.isNotEmpty) {
          final String topic = messages[0].topic;
          final MqttPublishMessage recMess =
              messages[0].payload as MqttPublishMessage;
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
        }
      });
    }

    for (final topic in _activeSubscriptions) {
      _mqttClient!.subscribe(topic, MqttQos.atLeastOnce);
    }

    subscribe('vinyl/shelf/mapping/status');
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
      debugPrint(
        'MqttService: Cannot request library — not connected. Queuing request...',
      );
      if (_currentBrokerAddress == null || _currentBrokerPort == null) return;

      connect(_currentBrokerAddress!, _currentBrokerPort!).then((
        bool didConnect,
      ) {
        if (didConnect) {
          Future.delayed(
            const Duration(milliseconds: 250),
            _publishLibraryRequest,
          );
        }
      });
      return;
    }

    _publishLibraryRequest();
  }

  void _publishLibraryRequest() {
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
      if (_currentBrokerAddress == null || _currentBrokerPort == null) {
        return;
      }

      connect(_currentBrokerAddress!, _currentBrokerPort!).then((
        bool didConnect,
      ) {
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
      if (_currentBrokerAddress == null || _currentBrokerPort == null) {
        return;
      }

      connect(_currentBrokerAddress!, _currentBrokerPort!).then((
        bool didConnect,
      ) {
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
      if (_currentBrokerAddress == null || _currentBrokerPort == null) {
        return;
      }

      connect(_currentBrokerAddress!, _currentBrokerPort!).then((
        bool didConnect,
      ) {
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
      if (_currentBrokerAddress == null || _currentBrokerPort == null) {
        return;
      }

      connect(_currentBrokerAddress!, _currentBrokerPort!).then((
        bool didConnect,
      ) {
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
