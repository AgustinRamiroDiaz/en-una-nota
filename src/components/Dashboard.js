/**
 * Dashboard Component
 * Music guessing game with Spotify playback controls
 */

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useSpotifyPlayer } from '../hooks/useSpotifyPlayer';

function Dashboard() {
  const { accessToken, logout } = useAuth();
  const envDefaultDuration = parseInt(process.env.REACT_APP_DEFAULT_PREVIEW_DURATION || '1000', 10);
  
  // Load default preview duration from localStorage or use env variable
  const getInitialDefaultDuration = () => {
    const saved = localStorage.getItem('defaultPreviewDuration');
    return saved ? parseInt(saved, 10) : envDefaultDuration;
  };
  
  const [defaultPreviewDuration, setDefaultPreviewDuration] = useState(getInitialDefaultDuration);
  const [currentPreviewDuration, setCurrentPreviewDuration] = useState(getInitialDefaultDuration);
  const [isArtistRevealed, setIsArtistRevealed] = useState(false);
  const [isTitleRevealed, setIsTitleRevealed] = useState(false);
  const [isAlbumRevealed, setIsAlbumRevealed] = useState(false);
  const [songNumber, setSongNumber] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [showDefaultDuration, setShowDefaultDuration] = useState(false);
  const profileMenuRef = useRef(null);
  const searchModalRef = useRef(null);
  const searchInputRef = useRef(null);

  // Initialize Spotify Player
  const {
    isReady,
    isPaused,
    currentTrack,
    position,
    duration,
    playerName,
    togglePlay,
    seek,
    playNextAndPause,
    replayAndPause,
    searchPlaylists,
    playPlaylist,
  } = useSpotifyPlayer(accessToken, currentPreviewDuration);

  // Fetch user profile on mount
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!accessToken) return;
      try {
        const response = await fetch('https://api.spotify.com/v1/me', {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (response.ok) {
          const data = await response.json();
          setUserProfile(data);
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
      }
    };
    fetchUserProfile();
  }, [accessToken]);

  // Close profile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setIsProfileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus search input when modal opens
  useEffect(() => {
    if (isSearchModalOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isSearchModalOpen]);

  // Close search modal on Escape key
  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setIsSearchModalOpen(false);
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  // Save default preview duration to localStorage
  useEffect(() => {
    localStorage.setItem('defaultPreviewDuration', defaultPreviewDuration.toString());
  }, [defaultPreviewDuration]);

  // Reset revealed state and increment song number when track changes
  useEffect(() => {
    if (currentTrack) {
      setIsArtistRevealed(false);
      setIsTitleRevealed(false);
      setIsAlbumRevealed(false);
      setSongNumber(prev => prev + 1);
      setCurrentPreviewDuration(defaultPreviewDuration);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTrack?.id]);

  // Helper to check if everything is revealed
  const isFullyRevealed = isArtistRevealed && isTitleRevealed && isAlbumRevealed;

  // Format milliseconds to mm:ss
  const formatTime = (ms) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Reveal all and play
  const handleRevealAll = () => {
    setIsArtistRevealed(true);
    setIsTitleRevealed(true);
    setIsAlbumRevealed(true);
    if (isPaused) {
      togglePlay();
    }
  };

  const handleDefaultDurationChange = (value) => {
    setDefaultPreviewDuration((prevDefault) => {
      // Keep current preview in sync when user has not customized it
      if (currentPreviewDuration === prevDefault) {
        setCurrentPreviewDuration(value);
      }
      return value;
    });
  };

  // Debounced auto-search when typing
  useEffect(() => {
    // Clear results if query is too short
    if (searchQuery.trim().length < 3) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    const debounceTimer = setTimeout(async () => {
      const results = await searchPlaylists(searchQuery);
      setSearchResults(results);
      setIsSearching(false);
    }, 400);

    return () => {
      clearTimeout(debounceTimer);
    };
  }, [searchQuery, searchPlaylists]);

  // Handle playlist selection from search results
  const handleSelectPlaylist = async (playlistUri) => {
    await playPlaylist(playlistUri);
    setSearchResults([]);
    setSearchQuery('');
    setIsSearchModalOpen(false);
  };

  return (
    <div className="dashboard-container">
      {/* Search Modal */}
      {isSearchModalOpen && (
        <div className="search-modal-overlay" onClick={() => setIsSearchModalOpen(false)}>
          <div className="search-modal" ref={searchModalRef} onClick={(e) => e.stopPropagation()}>
            <div className="search-modal-header">
              <h2>Buscar Playlist</h2>
              <button
                className="search-modal-close"
                onClick={() => setIsSearchModalOpen(false)}
                aria-label="Close"
              >
                ✕
              </button>
            </div>
            <div className="search-modal-content">
              <div className="search-input-wrapper">
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar playlist..."
                  className="search-input"
                />
                {isSearching && <span className="search-loading">...</span>}
              </div>

              {searchQuery.trim().length > 0 && searchQuery.trim().length < 3 && (
                <div className="search-hint">Escribe al menos 3 caracteres</div>
              )}

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
          </div>
        </div>
      )}

      <div className="dashboard-content">
        <div className="dashboard-header">
          <h1>{playerName || 'En Una Nota'}</h1>
          <div className="header-actions">
            {/* Search Button */}
            {isReady && (
              <button
                className="search-icon-button"
                onClick={() => setIsSearchModalOpen(true)}
                aria-label="Search playlists"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8"></circle>
                  <path d="m21 21-4.35-4.35"></path>
                </svg>
              </button>
            )}

            {/* Profile Menu */}
            <div className="profile-menu-container" ref={profileMenuRef}>
              <button
                className="profile-button"
                onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                aria-label="User menu"
              >
                {userProfile?.images?.[0]?.url ? (
                  <img
                    src={userProfile.images[0].url}
                    alt={userProfile.display_name || 'User'}
                    className="profile-avatar"
                  />
                ) : (
                  <div className="profile-avatar-placeholder">
                    {userProfile?.display_name?.[0]?.toUpperCase() || '?'}
                  </div>
                )}
              </button>
              {isProfileMenuOpen && (
                <div className="profile-dropdown">
                  {userProfile && (
                    <div className="profile-info">
                      <span className="profile-name">{userProfile.display_name}</span>
                      <span className="profile-email">{userProfile.email}</span>
                    </div>
                  )}
                  <button className="profile-logout-button" onClick={logout}>
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {!isReady && (
          <div className="player-status">
            Initializing Spotify Player...
          </div>
        )}

        {/* Game Controls */}
        {isReady && (
          <div className="game-controls">
            <div className="duration-controls">
              <div className="duration-row">
                <label htmlFor="current-duration-slider" className="duration-label">
                  Preview: <span className="duration-value">{(currentPreviewDuration / 1000).toFixed(1)}s</span>
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
                <button
                  className="duration-toggle-btn"
                  onClick={() => setShowDefaultDuration(!showDefaultDuration)}
                  title="Default duration settings"
                >
                  ⚙
                </button>
              </div>

              {showDefaultDuration && (
                <div className="duration-row secondary">
                  <label htmlFor="default-duration-slider" className="duration-label">
                    Default: <span className="duration-value">{(defaultPreviewDuration / 1000).toFixed(1)}s</span>
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
                </div>
              )}
            </div>
          </div>
        )}

        {/* Bottom Section - Player and Reintentar */}
        <div className="bottom-section">
          {/* Spotify Player - Always visible when track exists */}
          {currentTrack && (
            <div className="player-controls">
              <div className="song-counter-badge">#{songNumber}</div>
              <div className="now-playing">
                <div className="track-info">
                  {/* Album Art - Hidden or Revealed */}
                  <div 
                    className={`album-art-container ${isAlbumRevealed ? 'revealed' : 'hidden'}`}
                    onClick={() => !isAlbumRevealed && setIsAlbumRevealed(true)}
                    role={!isAlbumRevealed ? 'button' : undefined}
                    tabIndex={!isAlbumRevealed ? 0 : undefined}
                  >
                    {isAlbumRevealed && currentTrack.album.images[0] ? (
                      <img
                        src={currentTrack.album.images[0].url}
                        alt={currentTrack.name}
                        className="album-art"
                      />
                    ) : (
                    <div className="album-art-hidden">
                      <span>?</span>
                      <span className="revelar-hint">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                          <circle cx="12" cy="12" r="3"></circle>
                        </svg>
                      </span>
                    </div>
                    )}
                  </div>

                  {/* Track Details - Each can be revealed individually */}
                  <div className="track-details">
                    <div 
                      className={`track-name-container ${isTitleRevealed ? 'revealed' : 'hidden'}`}
                      onClick={() => !isTitleRevealed && setIsTitleRevealed(true)}
                      role={!isTitleRevealed ? 'button' : undefined}
                      tabIndex={!isTitleRevealed ? 0 : undefined}
                    >
                      {isTitleRevealed ? (
                        <span className="track-name">{currentTrack.name}</span>
                      ) : (
                        <span className="track-hidden">
                        Canción ??? 
                        <span className="revelar-hint">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                            <circle cx="12" cy="12" r="3"></circle>
                          </svg>
                        </span>
                      </span>
                      )}
                    </div>
                    <div 
                      className={`track-artist-container ${isArtistRevealed ? 'revealed' : 'hidden'}`}
                      onClick={() => !isArtistRevealed && setIsArtistRevealed(true)}
                      role={!isArtistRevealed ? 'button' : undefined}
                      tabIndex={!isArtistRevealed ? 0 : undefined}
                    >
                      {isArtistRevealed ? (
                        <span className="track-artist">
                          {currentTrack.artists.map(artist => artist.name).join(', ')}
                        </span>
                      ) : (
                        <span className="track-hidden">
                        Artista ??? 
                        <span className="revelar-hint">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                            <circle cx="12" cy="12" r="3"></circle>
                          </svg>
                        </span>
                      </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Seek Slider */}
              <div className="seek-container">
                <span className="seek-time">{formatTime(position)}</span>
                <input
                  type="range"
                  min="0"
                  max={duration || 100}
                  value={position}
                  onChange={(e) => seek(Number(e.target.value))}
                  className="seek-slider"
                />
                <span className="seek-time">{formatTime(duration)}</span>
              </div>

              <div className="control-buttons">
                <button 
                  onClick={handleRevealAll} 
                  className={`control-btn reveal-btn ${isFullyRevealed ? 'revealed' : ''}`}
                  disabled={isFullyRevealed}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                  </svg>
                </button>
                <button onClick={togglePlay} className={`control-btn play-pause ${!isPaused ? 'playing' : 'paused'}`}>
                  {isPaused ? '▶' : '⏸'}
                </button>
                <button onClick={playNextAndPause} className="control-btn next-btn">
                  Siguiente ⏭
                </button>
              </div>
            </div>
          )}

          {/* Reintentar Section */}
          {isReady && (
            <div className="reintentar-section">
              <span className="reintentar-label">Reintentar</span>
              <div className="reintentar-buttons">
                {[0, 20, 50, 100].map((percent) => (
                  <button
                    key={percent}
                    className="reintentar-button"
                    onClick={() => {
                      if (percent > 0) {
                        setCurrentPreviewDuration(prev => Math.round(prev * (1 + percent / 100)));
                      }
                      replayAndPause();
                    }}
                    disabled={!currentTrack}
                  >
                    {percent === 0 ? '=' : `+${percent}%`}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
