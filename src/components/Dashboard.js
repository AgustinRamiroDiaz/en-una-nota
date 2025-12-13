/**
 * Dashboard Component
 * Music guessing game with Spotify playback controls
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useSpotifyPlayer } from '../hooks/useSpotifyPlayer';

function Dashboard() {
  const { accessToken, logout } = useAuth();
  const defaultDuration = parseInt(process.env.REACT_APP_DEFAULT_PREVIEW_DURATION || '1000', 10);
  const [pauseDuration, setPauseDuration] = useState(defaultDuration);
  const [isRevealed, setIsRevealed] = useState(false);
  const [songNumber, setSongNumber] = useState(0);

  // Initialize Spotify Player
  const {
    isReady,
    isPaused,
    currentTrack,
    playTrack,
    togglePlay,
    nextTrack,
    previousTrack,
    playNextAndPause,
    replayAndPause,
  } = useSpotifyPlayer(accessToken, pauseDuration);

  // Reset revealed state and increment song number when track changes
  useEffect(() => {
    if (currentTrack) {
      setIsRevealed(false);
      setSongNumber(prev => prev + 1);
    }
  }, [currentTrack?.id]);

  return (
    <div className="dashboard-container">
      <div className="dashboard-content">
        <h1>En Una Nota</h1>

        {!isReady && (
          <div className="player-status">
            Initializing Spotify Player...
          </div>
        )}

        {/* Playing Status Indicator */}
        {currentTrack && (
          <div className="playback-status">
            <div className="song-counter">
              <span className="counter-label">Song</span>
              <span className="counter-number">#{songNumber}</span>
            </div>
            <div className={`status-indicator ${!isPaused ? 'playing' : 'paused'}`}>
              <span className="status-dot"></span>
              <span className="status-text">{!isPaused ? 'Playing' : 'Paused'}</span>
            </div>
          </div>
        )}

        {/* Game Controls */}
        {isReady && (
          <div className="game-controls">
            <div className="duration-control">
              <label htmlFor="duration-slider" className="duration-label">
                Preview Duration: <span className="duration-value">{(pauseDuration / 1000).toFixed(1)}s</span>
              </label>
              <input
                id="duration-slider"
                type="range"
                min="100"
                max="5000"
                step="100"
                value={pauseDuration}
                onChange={(e) => setPauseDuration(Number(e.target.value))}
                className="duration-slider"
              />
            </div>
            <div className="game-buttons">
              <button
                className="reintentar-button"
                onClick={replayAndPause}
                disabled={!currentTrack}
              >
                Reintentar
              </button>
              <button
                className="siguiente-button"
                onClick={playNextAndPause}
              >
                Siguiente
              </button>
            </div>
          </div>
        )}

        {/* Revelar Button */}
        {currentTrack && !isRevealed && (
          <div className="revelar-container">
            <button
              className="revelar-button"
              onClick={() => {
                setIsRevealed(true);
                if (isPaused) {
                  togglePlay();
                }
              }}
            >
              Revelar
            </button>
          </div>
        )}

        {/* Playback Controls */}
        {currentTrack && isRevealed && (
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
