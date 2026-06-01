// ==========================================
// GENERATED CODE - DO NOT EDIT
// ==========================================

// ── Enum value maps ───────────────────────────────────────────────────────────
// Mirror of Go/Dart enum definitions — use these instead of raw numbers/bools.

const MediaPlaybackState = Object.freeze({
    Playing: 0,
    Paused: 1,
    Idle: 2,
    Buffering: 3,
    Unknown: 4,
    Stopped: 5,
    Error: 6,
    Offline: 7,
});

const VisualDataState = Object.freeze({
    DisplayAlbumVisuals: 0,
    DisplayErrorMessage: 1,
    DisplayTagRegistration: 2,
    DisplayIdle: 3,
});

const ReaderStatus = Object.freeze({
    Offline: false,
    Online: true,
});

const ShelfStatus = Object.freeze({
    Empty: false,
    Occupied: true,
});

// ── State key constants ───────────────────────────────────────────────────────
// Use these with DataSource_Read / DataSource_Write / DataSource_OnChanged.
//
//   DataSource_Write(dataSource, Global_ActiveRecordTrackName, trackName);
//   const value = await DataSource_Read(dataSource, Global_CurrentProjectorData);
//   DataSource_OnChanged(dataSource, function (variable, data) {
//       if (variable === Global_MediaPlaybackState) { ... }
//   });

/** @type {string} string (NonVolatile) */
const Global_MusicAssistantUrl = 'Global_MusicAssistantUrl';

/** @type {string} string (NonVolatile) */
const Global_MusicAssistantToken = 'Global_MusicAssistantToken';

/** @type {string} string (NonVolatile) */
const Global_MusicAssistantTargetPlayerId = 'Global_MusicAssistantTargetPlayerId';

/** @type {string} string (NonVolatile) */
const Global_FlutterWebUrl = 'Global_FlutterWebUrl';

/** @type {string} string (NonVolatile) */
const Global_FlutterWebPort = 'Global_FlutterWebPort';

/** @type {string} string (NonVolatile) */
const Global_MqttBrokerHostAddress = 'Global_MqttBrokerHostAddress';

/** @type {string} number (NonVolatile) */
const Global_MqttWebSocketPort = 'Global_MqttWebSocketPort';

/** @type {string} number (NonVolatile) */
const Global_MqttTcpPort = 'Global_MqttTcpPort';

/** @type {string} string (Volatile) */
const Global_LastKnownUidScanned = 'Global_LastKnownUidScanned';

/** @type {string} string (Volatile) */
const Global_LastUnknownUidScanned = 'Global_LastUnknownUidScanned';

/** @type {string} ShelfStatus_t (Volatile) */
const Global_CurrentShelfStatus = 'Global_CurrentShelfStatus';

/** @type {string} ReaderStatus_t (Volatile) */
const Global_ReaderConnectionStatus = 'Global_ReaderConnectionStatus';

/** @type {string} ProjectorData_t (Volatile) */
const Global_CurrentProjectorData = 'Global_CurrentProjectorData';

/** @type {string} * (Volatile) */
const Global_ProjectorHeartbeatSignal = 'Global_ProjectorHeartbeatSignal';

/** @type {string} string (Volatile) */
const Global_DefinedProjectorErrorMessage = 'Global_DefinedProjectorErrorMessage';

/** @type {string} * (Volatile) */
const Global_ProjectorHeartbeat = 'Global_ProjectorHeartbeat';

/** @type {string} number (NonVolatile) */
const Global_TargetDisplayWidthInPixels = 'Global_TargetDisplayWidthInPixels';

/** @type {string} number (NonVolatile) */
const Global_TargetDisplayHeightInPixels = 'Global_TargetDisplayHeightInPixels';

/** @type {string} string (NonVolatile) */
const Global_CurrentMaptasticProjectorPositions = 'Global_CurrentMaptasticProjectorPositions';

/** @type {string} string (NonVolatile) */
const Global_SavedMaptasticProjectorPositions = 'Global_SavedMaptasticProjectorPositions';

/** @type {string} MediaPlaybackState_t (Volatile) */
const Global_MediaPlaybackState = 'Global_MediaPlaybackState';

/** @type {string} string (Volatile) */
const Global_ActiveRecordTrackName = 'Global_ActiveRecordTrackName';

/** @type {string} number (Volatile) */
const Global_ActiveTrackProgressInSeconds = 'Global_ActiveTrackProgressInSeconds';

/** @type {string} number (Volatile) */
const Global_ActiveTrackTotalDurationInSeconds = 'Global_ActiveTrackTotalDurationInSeconds';
