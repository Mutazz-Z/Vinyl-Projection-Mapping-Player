import {
  AlbumTrackList_t,
  TrackLyrics_t,
  QrCodeData_t,
  TrackListWidgetData_t,
  RecordDesignData_t,
  ProgressData_t,
  OverlayData_t,
  TitleAndArtist_t
} from './state';

type TrackResolverApi = {
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
  show?: (qrCodeData?: QrCodeData_t) => void;
  hide?: () => void;
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

interface ProjectorMappingApi {
  updateLayout: (layoutData: unknown) => void;
  toggleMode: () => void;
}

interface WidgetPlaybackController {
  init: (dataSource: DataSource) => Promise<void>;
}

interface ProgressWidgetPlaybackController extends WidgetPlaybackController {
  onTrackListState?: (state: number) => void;
}

interface QrCodeWidgetPlaybackController extends WidgetPlaybackController { }

interface PlaybackClockSnapshot {
  progressSeconds: number;
  durationSeconds: number;
  playbackState: number;
  isPlaying: boolean;
}

interface PlaybackClockApi {
  init: (dataSource: DataSource) => Promise<void>;
  subscribe: (listener: (snapshot: PlaybackClockSnapshot) => void) => () => void;
  snapshot: () => PlaybackClockSnapshot;
}

declare global {
  const TrackResolver: TrackResolverApi;
  function Maptastic(targetSelector: string): MaptasticController;
  const QRCode: {
    new(element: HTMLElement, options: {
      text: string;
      width: number;
      height: number;
      correctLevel: number;
    }): unknown;
    CorrectLevel: {
      M: number;
    };
  };

  interface Window {
    resizeTimer?: ReturnType<typeof setTimeout>;
    AppDataSource: DataSource | null;
    PI_IP: string;
    ProjectorMapping: ProjectorMappingApi;
    PlaybackClock: PlaybackClockApi;
    LyricsWidget?: {
      hide?: (onHiddenCallback?: () => void) => void;
      updateData?: (options: {
        lyricsData?: TrackLyrics_t | null;
        progressSeconds?: number;
        previousTrackLine?: string;
        upcomingTrackLine?: string;
        enterInterTrackBridge?: boolean;
      }) => void;
      show?: (options?: {
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
    InfoWidget: {
      show: () => void;
      hide: () => void;
      updateData: (albumInfo: TitleAndArtist_t) => void;
    };
    InfoWidgetPlayback: WidgetPlaybackController;
    OverlayWidgetPlayback: WidgetPlaybackController;
    RecordWidgetPlayback: WidgetPlaybackController;
    TracklistWidgetPlayback: WidgetPlaybackController;
    ProgressWidgetPlayback: ProgressWidgetPlaybackController;
    LyricsWidgetPlayback: WidgetPlaybackController;
    VisualizerWidgetPlayback: WidgetPlaybackController;
    LoadingWidgetPlayback: WidgetPlaybackController;
    QrCodeWidgetPlayback: QrCodeWidgetPlaybackController;
    TrackResolver: TrackResolverApi;
  }
}