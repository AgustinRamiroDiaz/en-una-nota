/**
 * Dashboard Component
 * Displays the user's top 5 tracks from Spotify with playback controls
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getTopTracks } from '../utils/spotify';
import { useSpotifyPlayer } from '../hooks/useSpotifyPlayer';

function Dashboard() {
  const { accessToken, logout } = useAuth();
  const [tracks, setTracks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Initialize Spotify Player
  const {
    isReady,
    isPaused,
    currentTrack,
    playTrack,
    togglePlay,
    nextTrack,
    previousTrack,
  } = useSpotifyPlayer(accessToken);

  useEffect(() => {
    async function fetchTracks() {
      try {
        setLoading(true);
        const data = await getTopTracks(accessToken, 5);
        setTracks(data.items);
        setError(null);
      } catch (err) {
        console.error('Error fetching tracks:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    if (accessToken) {
      fetchTracks();
    }
  }, [accessToken]);

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="loading">Loading your top tracks...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-container">
        <div className="error">
          <h2>Error</h2>
          <p>{error}</p>
          <button className="logout-button" onClick={logout}>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-content">
        <h1>Your Top 5 Songs</h1>

        {!isReady && (
          <div className="player-status">
            Initializing Spotify Player...
          </div>
        )}

        {tracks.length === 0 ? (
          <p>No tracks found. Start listening to some music on Spotify!</p>
        ) : (
          <ol className="tracks-list">
            {tracks.map((track) => (
              <li
                key={track.id}
                className={`track-item ${currentTrack?.id === track.id ? 'playing' : ''}`}
                onClick={() => isReady && playTrack(track.uri)}
                style={{ cursor: isReady ? 'pointer' : 'default' }}
              >
                <span className="track-name">{track.name}</span>
                <span className="track-separator"> - </span>
                <span className="track-artist">
                  {track.artists.map(artist => artist.name).join(', ')}
                </span>
                {currentTrack?.id === track.id && !isPaused && (
                  <span className="now-playing-indicator"> ♫</span>
                )}
              </li>
            ))}
          </ol>
        )}

        {/* Playback Controls */}
        {currentTrack && (
          <div className="player-controls">
            <div className="now-playing">
              <div className="track-info">
                {currentTrack.album.images[0] && (
                  <img
                    src={currentTrack.album.images[0].url}
                    alt={currentTrack.name}
                    className="album-art"
                  />
                )}
                <div className="track-details">
                  <div className="track-name">{currentTrack.name}</div>
                  <div className="track-artist">
                    {currentTrack.artists.map(artist => artist.name).join(', ')}
                  </div>
                </div>
              </div>
            </div>

            <div className="control-buttons">
              <button onClick={previousTrack} className="control-btn">⏮</button>
              <button onClick={togglePlay} className="control-btn play-pause">
                {isPaused ? '▶' : '⏸'}
              </button>
              <button onClick={nextTrack} className="control-btn">⏭</button>
            </div>
          </div>
        )}

        <button className="logout-button" onClick={logout}>
          Logout
        </button>
      </div>
    </div>
  );
}

export default Dashboard;
