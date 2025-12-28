/**
 * Spotify Web Playback SDK Type Definitions
 */

declare global {
  interface Window {
    Spotify: {
      Player: new (options: SpotifyPlayerOptions) => SpotifyPlayer;
    };
    onSpotifyWebPlaybackSDKReady: () => void;
  }
}

interface SpotifyPlayerOptions {
  name: string;
  getOAuthToken: (callback: (token: string) => void) => void;
  volume?: number;
}

interface SpotifyPlayer {
  connect(): Promise<boolean>;
  disconnect(): void;
  togglePlay(): Promise<void>;
  nextTrack(): Promise<void>;
  previousTrack(): Promise<void>;
  seek(positionMs: number): Promise<void>;
  resume(): Promise<void>;
  pause(): Promise<void>;
  setVolume(volume: number): Promise<void>;
  addListener(event: 'ready', callback: (state: { device_id: string }) => void): void;
  addListener(event: 'not_ready', callback: (state: { device_id: string }) => void): void;
  addListener(event: 'player_state_changed', callback: (state: SpotifyPlayerState | null) => void): void;
  addListener(event: 'initialization_error', callback: (error: { message: string }) => void): void;
  addListener(event: 'authentication_error', callback: (error: { message: string }) => void): void;
  addListener(event: 'account_error', callback: (error: { message: string }) => void): void;
  addListener(event: 'playback_error', callback: (error: { message: string }) => void): void;
}

interface SpotifyPlayerState {
  paused: boolean;
  position: number;
  duration: number;
  track_window: {
    current_track: SpotifyTrackInfo;
    previous_tracks: SpotifyTrackInfo[];
    next_tracks: SpotifyTrackInfo[];
  };
}

interface SpotifyTrackInfo {
  id: string;
  name: string;
  artists: { name: string }[];
  album: {
    name: string;
    images: { url: string }[];
  };
}

interface SpotifyUserProfile {
  id: string;
  display_name: string;
  email: string;
  images: { url: string }[];
}

interface PlaylistSearchResult {
  uri: string;
  id: string;
  name: string;
  owner: string;
  image: string;
  trackCount: number;
}

export {
  SpotifyPlayer,
  SpotifyPlayerOptions,
  SpotifyPlayerState,
  SpotifyTrackInfo,
  SpotifyUserProfile,
  PlaylistSearchResult,
};

