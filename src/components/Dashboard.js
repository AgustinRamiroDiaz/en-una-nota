/**
 * Dashboard Component
 * Music guessing game with Spotify playback controls
 */

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useSpotifyPlayer } from '../hooks/useSpotifyPlayer';

function Dashboard() {
  const { accessToken, logout } = useAuth();
  const defaultDuration = parseInt(process.env.REACT_APP_DEFAULT_PREVIEW_DURATION || '1000', 10);
  const [defaultPreviewDuration, setDefaultPreviewDuration] = useState(defaultDuration);
  const [currentPreviewDuration, setCurrentPreviewDuration] = useState(defaultDuration);
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
  const profileMenuRef = useRef(null);
  const searchModalRef = useRef(null);
  const searchInputRef = useRef(null);

  // Initialize Spotify Player
  const {
    isReady,
    isPaused,
    currentTrack,
    playerName,
    togglePlay,
    previousTrack,
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
    setIsSearchModalOpen(false);
  };

  return (
    <div className="dashboard-container">
      {/* Top Right Actions */}
      <div className="top-right-actions">
        {/* Search Button */}
        {isReady && (
          <button
            className="search-icon-button"
            onClick={() => setIsSearchModalOpen(true)}
            aria-label="Search playlists"
          >
            🔍
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
          </div>
        </div>
      )}

      <div className="dashboard-content">
        <h1>{playerName || 'En Una Nota'}</h1>

        {!isReady && (
          <div className="player-status">
            Initializing Spotify Player...
          </div>
        )}

        {/* Song Counter */}
        {currentTrack && (
          <div className="playback-status">
            <div className="song-counter">
              <span className="counter-label">Song</span>
              <span className="counter-number">#{songNumber}</span>
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

          </div>
        )}

        {/* Spotify Player - Always visible when track exists */}
        {currentTrack && (
          <div className="player-controls">
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
                      <span className="revelar-hint">revelar</span>
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
                      <span className="track-hidden">Canción ??? <span className="revelar-hint">(revelar)</span></span>
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
                      <span className="track-hidden">Artista ??? <span className="revelar-hint">(revelar)</span></span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="control-buttons">
              <button onClick={previousTrack} className="control-btn">⏮</button>
              <button onClick={togglePlay} className={`control-btn play-pause ${!isPaused ? 'playing' : 'paused'}`}>
                {isPaused ? '▶' : '⏸'}
              </button>
              <button onClick={playNextAndPause} className="control-btn next-btn">
                Siguiente ⏭
              </button>
            </div>

            {/* Revelar button - only shown when not everything is revealed */}
            {!isFullyRevealed && (
              <button className="revelar-button" onClick={handleRevealAll}>
                Revelar Todo
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;
