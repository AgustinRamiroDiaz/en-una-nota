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
  const [defaultPreviewDuration, setDefaultPreviewDuration] = useState(defaultDuration);
  const [currentPreviewDuration, setCurrentPreviewDuration] = useState(defaultDuration);
  const [isRevealed, setIsRevealed] = useState(false);
  const [isHintShown, setIsHintShown] = useState(false);
  const [songNumber, setSongNumber] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  // Initialize Spotify Player
  const {
    isReady,
    isPaused,
    currentTrack,
    playerName,
    togglePlay,
    nextTrack,
    previousTrack,
    playNextAndPause,
    replayAndPause,
    searchPlaylists,
    playPlaylist,
  } = useSpotifyPlayer(accessToken, currentPreviewDuration);

  // Reset revealed/hint state and increment song number when track changes
  useEffect(() => {
    if (currentTrack) {
      setIsRevealed(false);
      setIsHintShown(false);
      setSongNumber(prev => prev + 1);
      setCurrentPreviewDuration(defaultPreviewDuration);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTrack?.id]);

  const handleDefaultDurationChange = (value) => {
    setDefaultPreviewDuration((prevDefault) => {
      // Keep current preview in sync when user has not customized it
      if (currentPreviewDuration === prevDefault) {
        setCurrentPreviewDuration(value);
      }
      return value;
    });
  };

  // Handle search
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    const results = await searchPlaylists(searchQuery);
    setSearchResults(results);
    setIsSearching(false);
  };

  // Handle playlist selection from search results
  const handleSelectPlaylist = async (playlistUri) => {
    await playPlaylist(playlistUri);
    setSearchResults([]);
    setSearchQuery('');
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-content">
        <h1>{playerName || 'En Una Nota'}</h1>

        {!isReady && (
          <div className="player-status">
            Initializing Spotify Player...
          </div>
        )}

        {/* Search */}
        {isReady && (
          <div className="search-container">
            <div className="search-input-wrapper">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Buscar playlist..."
                className="search-input"
              />
              <button
                onClick={handleSearch}
                disabled={isSearching}
                className="search-button"
              >
                {isSearching ? '...' : 'Buscar'}
              </button>
            </div>

            {searchResults.length > 0 && (
              <div className="search-results">
                {searchResults.map((playlist) => (
                  <button
                    key={playlist.id}
                    onClick={() => handleSelectPlaylist(playlist.uri)}
                    className="search-result-item"
                  >
                    {playlist.image && (
                      <img src={playlist.image} alt="" className="search-result-image" />
                    )}
                    <div className="search-result-info">
                      <span className="search-result-name">{playlist.name}</span>
                      <span className="search-result-artist">{playlist.owner} · {playlist.trackCount} canciones</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
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
            <div className="duration-controls">
              <div className="duration-control">
                <label htmlFor="current-duration-slider" className="duration-label">
                  Current preview duration: <span className="duration-value">{(currentPreviewDuration / 1000).toFixed(1)}s</span>
                </label>
                <input
                  id="current-duration-slider"
                  type="range"
                  min="100"
                  max="5000"
                  step="100"
                  value={currentPreviewDuration}
                  onChange={(e) => setCurrentPreviewDuration(Number(e.target.value))}
                  className="duration-slider"
                />
                <div className="duration-helper">Applies only to the song that is playing now.</div>
                <button
                  className="reset-button"
                  onClick={() => setCurrentPreviewDuration(defaultPreviewDuration)}
                  disabled={currentPreviewDuration === defaultPreviewDuration}
                >
                  Reset to default
                </button>
              </div>

              <div className="duration-control secondary">
                <label htmlFor="default-duration-slider" className="duration-label">
                  Default preview duration: <span className="duration-value">{(defaultPreviewDuration / 1000).toFixed(1)}s</span>
                </label>
                <input
                  id="default-duration-slider"
                  type="range"
                  min="100"
                  max="5000"
                  step="100"
                  value={defaultPreviewDuration}
                  onChange={(e) => handleDefaultDurationChange(Number(e.target.value))}
                  className="duration-slider"
                />
                <div className="duration-helper">New songs reset to this duration.</div>
              </div>
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
                className="pause-button"
                onClick={togglePlay}
                disabled={!currentTrack}
              >
                {isPaused ? '▶ Play' : '⏸ Pausa'}
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

        {/* Hint Display */}
        {currentTrack && !isRevealed && isHintShown && (
          <div className="hint-display">
            <span className="hint-label">Artista:</span>
            <span className="hint-value">{currentTrack.artists.map(artist => artist.name).join(', ')}</span>
          </div>
        )}

        {/* Hint and Revelar Buttons */}
        {currentTrack && !isRevealed && (
          <div className="revelar-container">
            {!isHintShown && (
              <button
                className="hint-button"
                onClick={() => setIsHintShown(true)}
              >
                Pista
              </button>
            )}
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
