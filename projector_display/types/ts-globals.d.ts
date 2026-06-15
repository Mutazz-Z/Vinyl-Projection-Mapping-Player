import {
  AlbumTrackList_t,
  TrackLyrics_t,
  QrCodeData_t,
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

interface ProjectorMappingApi {
  updateLayout: (layoutData: unknown) => void;
  toggleMode: () => void;
}

interface WidgetPlaybackController {
  init: (dataSource: DataSource) => Promise<void>;
}

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

  interface Window {
    resizeTimer?: ReturnType<typeof setTimeout>;
    AppDataSource: DataSource | null;
    PI_IP: string;
    ProjectorMapping: ProjectorMappingApi;
    PlaybackClock: PlaybackClockApi;
    VisualizerWidget?: PlaybackControlWidget;
    VisualizerWidgetPlayback: WidgetPlaybackController;
    TrackResolver: TrackResolverApi;
  }
}