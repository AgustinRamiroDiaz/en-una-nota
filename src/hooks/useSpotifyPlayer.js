/**
 * Spotify Web Playback SDK Hook
 * Manages the Spotify player instance and playback state
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { getRandomAnimalName } from '../utils/animalNames';

export function useSpotifyPlayer(accessToken, autoPauseDuration = 200) {
  const [player, setPlayer] = useState(null);
  const [deviceId, setDeviceId] = useState(null);
  const [isReady, setIsReady] = useState(false);
  const [isPaused, setIsPaused] = useState(true);
  const [currentTrack, setCurrentTrack] = useState(null);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playerName, setPlayerName] = useState('');
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
      const animalName = getRandomAnimalName();
      const name = `En una pecota ${animalName}`;
      setPlayerName(name);

      spotifyPlayer = new window.Spotify.Player({
        name: name,
        getOAuthToken: cb => { cb(accessToken); },
        volume: 0.5
      });

      // Ready
      spotifyPlayer.addListener('ready', async ({ device_id }) => {
        console.log('Ready with Device ID', device_id);
        setDeviceId(device_id);
        setIsReady(true);

        // Transfer playback to this device
        try {
          const response = await fetch('https://api.spotify.com/v1/me/player', {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${accessToken}`
            },
            body: JSON.stringify({
              device_ids: [device_id],
              play: false
            })
          });
          if (response.ok || response.status === 204) {
            console.log('Playback transferred to web player');
          } else {
            console.log('Transfer playback returned:', response.status, '- this is normal if no previous playback session');
          }
        } catch (error) {
          console.error('Error transferring playback:', error);
        }
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

    // Load Spotify SDK dynamically
    const loadSpotifySDK = () => {
      // Check if already loaded
      if (window.Spotify) {
        initializePlayer();
        return;
      }

      // Define callback before loading script
      window.onSpotifyWebPlaybackSDKReady = initializePlayer;

      // Check if script is already in the document
      if (!document.querySelector('script[src="https://sdk.scdn.co/spotify-player.js"]')) {
        const script = document.createElement('script');
        script.src = 'https://sdk.scdn.co/spotify-player.js';
        script.async = true;
        document.body.appendChild(script);
      }
    };

    loadSpotifySDK();

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

  // Play next track and auto-pause after configured duration
  const playNextAndPause = useCallback(() => {
    if (!player) return;
    shouldAutoPauseRef.current = true;
    player.nextTrack();
  }, [player]);

  // Replay current track from beginning and auto-pause after configured duration
  const replayAndPause = useCallback(() => {
    if (!player) return;
    shouldAutoPauseRef.current = true;
    player.seek(0).then(() => {
      player.resume();
    });
  }, [player]);

  // Search for playlists
  const searchPlaylists = useCallback(async (query) => {
    if (!accessToken || !query.trim()) {
      return [];
    }

    try {
      const response = await fetch(
        `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=playlist&limit=10`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );

      if (!response.ok) {
        console.error('Search failed:', response.status);
        return [];
      }

      const data = await response.json();
      return data.playlists.items
        .filter((playlist) => playlist !== null)
        .map((playlist) => ({
          uri: playlist.uri,
          id: playlist.id,
          name: playlist.name,
          owner: playlist.owner?.display_name || 'Unknown',
          image: playlist.images?.[0]?.url || '',
          trackCount: playlist.tracks?.total || 0,
        }));
    } catch (error) {
      console.error('Error searching playlists:', error);
      return [];
    }
  }, [accessToken]);

  // Play a playlist and start auto-pause on first track
  const playPlaylist = useCallback(async (playlistUri, shuffle = true) => {
    if (!deviceId || !accessToken) {
      console.error('Device not ready or no access token');
      return;
    }

    try {
      // First, ensure this device is active
      await fetch('https://api.spotify.com/v1/me/player', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          device_ids: [deviceId],
          play: false
        })
      });

      // Enable shuffle if requested
      if (shuffle) {
        await fetch(`https://api.spotify.com/v1/me/player/shuffle?state=true&device_id=${deviceId}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        });
      }

      // Then play the playlist
      shouldAutoPauseRef.current = true;
      const response = await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          context_uri: playlistUri
        })
      });

      if (!response.ok && response.status !== 204) {
        console.error('Play request failed:', response.status);
      }
    } catch (error) {
      console.error('Error playing playlist:', error);
    }
  }, [deviceId, accessToken]);

  return {
    player,
    deviceId,
    isReady,
    isPaused,
    currentTrack,
    position,
    duration,
    playerName,
    playTrack,
    togglePlay,
    nextTrack,
    previousTrack,
    seek,
    setVolume,
    playNextAndPause,
    replayAndPause,
    searchPlaylists,
    playPlaylist,
  };
}
