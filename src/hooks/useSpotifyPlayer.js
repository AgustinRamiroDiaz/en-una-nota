/**
 * Spotify Web Playback SDK Hook
 * Manages the Spotify player instance and playback state
 */

import { useState, useEffect, useCallback, useRef } from 'react';

export function useSpotifyPlayer(accessToken, autoPauseDuration = 200) {
  const [player, setPlayer] = useState(null);
  const [deviceId, setDeviceId] = useState(null);
  const [isReady, setIsReady] = useState(false);
  const [isPaused, setIsPaused] = useState(true);
  const [currentTrack, setCurrentTrack] = useState(null);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const autoPauseTimeoutRef = useRef(null);
  const shouldAutoPauseRef = useRef(false);
  const autoPauseDurationRef = useRef(autoPauseDuration);

  // Update the duration ref when it changes
  useEffect(() => {
    autoPauseDurationRef.current = autoPauseDuration;
  }, [autoPauseDuration]);

  // Initialize the Spotify Player
  useEffect(() => {
    if (!accessToken) return;

    let spotifyPlayer = null;

    const initializePlayer = () => {
      spotifyPlayer = new window.Spotify.Player({
        name: 'En una pecota',
        getOAuthToken: cb => { cb(accessToken); },
        volume: 0.5
      });

      // Ready
      spotifyPlayer.addListener('ready', ({ device_id }) => {
        console.log('Ready with Device ID', device_id);
        setDeviceId(device_id);
        setIsReady(true);
      });

      // Not Ready
      spotifyPlayer.addListener('not_ready', ({ device_id }) => {
        console.log('Device ID has gone offline', device_id);
        setIsReady(false);
      });

      // Player state changed
      spotifyPlayer.addListener('player_state_changed', (state) => {
        if (!state) return;

        setCurrentTrack(state.track_window.current_track);
        setIsPaused(state.paused);
        setPosition(state.position);
        setDuration(state.duration);

        // Auto-pause logic: if track is playing and we should auto-pause
        if (!state.paused && shouldAutoPauseRef.current) {
          // Clear any existing timeout
          if (autoPauseTimeoutRef.current) {
            clearTimeout(autoPauseTimeoutRef.current);
          }

          // Pause after configured duration
          autoPauseTimeoutRef.current = setTimeout(() => {
            spotifyPlayer.pause();
            shouldAutoPauseRef.current = false;
          }, autoPauseDurationRef.current);
        }
      });

      // Error handling
      spotifyPlayer.addListener('initialization_error', ({ message }) => {
        console.error('Initialization Error:', message);
      });

      spotifyPlayer.addListener('authentication_error', ({ message }) => {
        console.error('Authentication Error:', message);
      });

      spotifyPlayer.addListener('account_error', ({ message }) => {
        console.error('Account Error:', message);
      });

      spotifyPlayer.addListener('playback_error', ({ message }) => {
        console.error('Playback Error:', message);
      });

      // Connect to the player
      spotifyPlayer.connect();

      setPlayer(spotifyPlayer);
    };

    // Check if Spotify SDK is already loaded
    if (window.Spotify) {
      initializePlayer();
    } else {
      // Define the callback for when SDK loads
      window.onSpotifyWebPlaybackSDKReady = initializePlayer;
    }

    // Cleanup
    return () => {
      if (autoPauseTimeoutRef.current) {
        clearTimeout(autoPauseTimeoutRef.current);
      }
      if (spotifyPlayer) {
        spotifyPlayer.disconnect();
      }
    };
  }, [accessToken]);

  // Play a track on this device
  const playTrack = useCallback(async (trackUri) => {
    if (!deviceId || !accessToken) {
      console.error('Device not ready or no access token');
      return;
    }

    try {
      await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          uris: [trackUri]
        })
      });
    } catch (error) {
      console.error('Error playing track:', error);
    }
  }, [deviceId, accessToken]);

  // Toggle play/pause
  const togglePlay = useCallback(() => {
    if (!player) return;
    player.togglePlay();
  }, [player]);

  // Next track
  const nextTrack = useCallback(() => {
    if (!player) return;
    player.nextTrack();
  }, [player]);

  // Previous track
  const previousTrack = useCallback(() => {
    if (!player) return;
    player.previousTrack();
  }, [player]);

  // Seek to position
  const seek = useCallback((positionMs) => {
    if (!player) return;
    player.seek(positionMs);
  }, [player]);

  // Set volume (0-1)
  const setVolume = useCallback((volume) => {
    if (!player) return;
    player.setVolume(volume);
  }, [player]);

  // Play next track and auto-pause after 200ms
  const playNextAndPause = useCallback(() => {
    if (!player) return;
    shouldAutoPauseRef.current = true;
    player.nextTrack();
  }, [player]);

  return {
    player,
    deviceId,
    isReady,
    isPaused,
    currentTrack,
    position,
    duration,
    playTrack,
    togglePlay,
    nextTrack,
    previousTrack,
    seek,
    setVolume,
    playNextAndPause,
  };
}
