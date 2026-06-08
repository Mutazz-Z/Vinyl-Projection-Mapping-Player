declare class TitleAndArtist_t {
  title: string;
  artist: string;
  static fromJson(json: unknown): TitleAndArtist_t;
}

declare class OverlayData_t {
  overlayImage: string;
  readyForDisplay: boolean;
  static fromJson(json: unknown): OverlayData_t;
}

declare class LabelDesignData_t {
  usesImage: boolean;
  labelColor: string;
  labelImage: string;
  static fromJson(json: unknown): LabelDesignData_t;
}

declare class RingDesignData_t {
  usesImage: boolean;
  ringColor: string;
  ringImage: string;
  static fromJson(json: unknown): RingDesignData_t;
}

declare class RecordDesignData_t {
  labelDesign: LabelDesignData_t;
  ringDesign: RingDesignData_t;
  readyForDisplay: boolean;
  static fromJson(json: unknown): RecordDesignData_t;
}

declare class LyricLine_t {
  timeStart: number;
  text: string;
  static fromJson(json: unknown): LyricLine_t;
}

declare class TrackLyrics_t {
  lines: LyricLine_t[];
  static fromJson(json: unknown): TrackLyrics_t;
}

declare class TrackListItem_t {
  trackIndex: number;
  track: string;
  static fromJson(json: unknown): TrackListItem_t;
}

declare class TrackListWidgetData_t {
  tracks: TrackListItem_t[];
  currentPlayingIndex: number;
  readyForDisplay: boolean;
  static fromJson(json: unknown): TrackListWidgetData_t;
}

declare class ProgressData_t {
  currentDurationInTrack: number;
  totalDurationInTrack: number;
  readyForDisplay: boolean;
  static fromJson(json: unknown): ProgressData_t;
}

declare class ActiveTrack_t {
  trackName: string;
  trackIndex: number;
  provider: string;
  trackItemId: string;
  albumItemId: string;
  static fromJson(json: unknown): ActiveTrack_t;
}

declare class AlbumTrackList_t {
  track: string;
  duration: number;
  coverImage: string;
  lyrics: TrackLyrics_t;
  static fromJson(json: unknown): AlbumTrackList_t;
}

declare class VinylRecordTagData_t {
  tagUid: string;
  itemId: string;
  provider: string;
  mediaTitle: string;
  artist: string;
  trackList: AlbumTrackList_t[];
  coverImage: string;
  labelColor: string;
  labelImage: string;
  outerRingColor: string;
  outerRingImage: string;
  projectionOverlay: string;
  static fromJson(json: unknown): VinylRecordTagData_t;
}

declare class ProjectorData_t {
  tagData: VinylRecordTagData_t;
  visualDataState: number;
  registerTagUrl: string;
  errorMessage: string;
  static fromJson(json: unknown): ProjectorData_t;
}

declare const MediaPlaybackState: {
  readonly Playing: number;
  readonly Paused: number;
  readonly Idle: number;
};

declare const VisualDataState: {
  readonly DisplayAlbumVisuals: number;
  readonly DisplayErrorMessage: number;
  readonly DisplayTagRegistration: number;
  readonly DisplayIdle: number;
};

declare const ShelfStatus: {
  readonly Empty: boolean;
};

declare const WidgetState: {
  readonly Hide: number;
  readonly Show: number;
  readonly Loading: number;
  readonly Idle: number;
};

declare const Global_MediaPlaybackState: string;
declare const Global_CurrentMaptasticProjectorPositions: string;
declare const Global_ActiveTrackTotalDurationInSeconds: string;
declare const Global_ActiveTrackProgressInSeconds: string;
declare const Global_CurrentShelfStatus: string;
declare const Global_ProjectorHeartbeatSignal: { key: string };
declare const Global_ProjectorHeartbeat: string;
declare const Global_CurrentProjectorData: { key: string; fromJson: (json: unknown) => ProjectorData_t };
declare const Global_InfoWidgetData: { key: string; fromJson: (json: unknown) => TitleAndArtist_t };
declare const Global_InfoWidgetState: string;
declare const Global_OverlayWidgetData: { key: string; fromJson: (json: unknown) => OverlayData_t };
declare const Global_OverlayWidgetState: string;
declare const Global_RecordWidgetData: { key: string; fromJson: (json: unknown) => RecordDesignData_t };
declare const Global_RecordWidgetState: string;
declare const Global_TrackListWidgetData: { key: string; fromJson: (json: unknown) => TrackListWidgetData_t };
declare const Global_TrackListWidgetState: string;
declare const Global_ProgressWidgetData: { key: string; fromJson: (json: unknown) => ProgressData_t };
declare const Global_ProgressWidgetState: string;
declare const Global_LoadingWidgetState: string;
declare const Global_ActiveTrack: { key: string; fromJson: (json: unknown) => ActiveTrack_t };

declare const TrackResolver: {
  buildLyricsLookupFromTrackList: (trackList: AlbumTrackList_t[]) => void;
  getTrackNames: () => string[];
  setActiveTrackIndex: (index: number) => void;
  getLyricsByTrackIndex: (trackIndex: number) => TrackLyrics_t | null;
  setTrackNames: (names: string[]) => void;
  clear: () => void;
  clearTrackPositionOnly: () => void;
};

interface MaptasticController {
  getLayout: () => any;
  setLayout: (layout: any) => void;
}

declare function Maptastic(targetSelector: string): MaptasticController;

declare const QRCode: {
  new (element: HTMLElement, options: {
    text: string;
    width: number;
    height: number;
    correctLevel: number;
  }): unknown;
  CorrectLevel: {
    M: number;
  };
};

interface PlaybackControlWidget {
  play?: () => void;
  pause?: () => void;
  hide?: (options?: unknown) => void;
  show?: (options?: unknown) => void;
}

interface LoadingWidgetApi {
  loading?: () => Promise<void>;
  hide?: (options?: { immediate?: boolean; fadeOutDelayMs?: number; onBeforeFadeOut?: () => void }) => void;
  idle?: (options?: { fromOverlay?: boolean; delayMs?: number }) => void;
  error?: () => void;
}

interface QrCodeWidgetApi {
  show?: (projectorData: ProjectorData_t) => void;
  hide?: () => void;
}

interface ContextMessageWidgetApi {
  show: (message: string) => void;
  hide: () => void;
}

interface TracklistWidgetApi {
  show?: (options?: unknown) => void;
  hide?: (options?: unknown) => void;
  updateData?: (trackListWidgetData: TrackListWidgetData_t) => void;
}

interface RecordWidgetApi {
  show?: (options?: unknown) => void;
  hide?: (options?: unknown) => void;
  updateData?: (recordDesignData: RecordDesignData_t) => void;
  play?: () => void;
  pause?: () => void;
  ejectRecord?: () => void;
}

interface ProgressWidgetApi {
  show?: (options?: unknown) => void;
  hide?: (options?: unknown) => void;
  updateData?: (progressData: ProgressData_t) => void;
}

interface OverlayWidgetApi {
  show?: (options?: unknown) => void;
  hide?: (options?: unknown) => void;
  updateData?: (overlayData: OverlayData_t) => void;
}

interface ProjectorPlaybackApi {
  startPlayback: (projectorData: ProjectorData_t, options?: { restore?: boolean }) => void;
  stopPlayback: (isError?: boolean) => void;
  showUnknownTag: (projectorData: ProjectorData_t) => void;
  showPlaybackError: (message: string, projectorData?: ProjectorData_t) => void;
}

interface ProjectorMappingApi {
  updateLayout: (layoutData: unknown) => void;
  toggleMode: () => void;
}

interface Window {
  resizeTimer?: ReturnType<typeof setTimeout>;
  AppDataSource: DataSource | null;
  PI_IP: string;
  ProjectorPlayback: ProjectorPlaybackApi;
  ProjectorMapping: ProjectorMappingApi;
  LyricsWidget?: {
    hide?: (onHiddenCallback?: () => void) => void;
    show?: (options: {
      lyricsData?: TrackLyrics_t | null;
      progressSeconds?: number;
      isPlaybackVisualActive?: boolean;
      isPlaying?: boolean;
      previousTrackLine?: string;
      upcomingTrackLine?: string;
      enterInterTrackBridge?: boolean;
      awaitingMusicStart?: boolean;
    }) => void;
    hasLyrics?: () => boolean;
  };
  VisualizerWidget?: PlaybackControlWidget;
  RecordWidget?: RecordWidgetApi;
  OverlayWidget?: OverlayWidgetApi;
  ProgressWidget?: ProgressWidgetApi;
  TracklistWidget?: TracklistWidgetApi;
  LoadingWidget?: LoadingWidgetApi;
  QrCodeWidget?: QrCodeWidgetApi;
  ContextMessageWidget?: ContextMessageWidgetApi;
  InfoWidget: {
    show: () => void;
    hide: () => void;
    updateData: (albumInfo: TitleAndArtist_t) => void;
  };
}
