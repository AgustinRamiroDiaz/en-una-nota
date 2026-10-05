/**
 * Dashboard Component
 * Music guessing game with Spotify playback controls
 */

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useSpotifyPlayer } from '../hooks/useSpotifyPlayer';
import { useI18n } from '../i18n/I18nContext';
import type { SpotifyUserProfile, PlaylistSearchResult } from '../types/spotify.d';

function Dashboard(): React.ReactElement {
  const { accessToken, logout } = useAuth();
  const { t, locale, setLocale } = useI18n();
  const envDefaultDuration = parseInt(process.env.REACT_APP_DEFAULT_PREVIEW_DURATION || '1000', 10);
  
  // Load default preview duration from localStorage or use env variable
  const getInitialDefaultDuration = (): number => {
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
  const [searchResults, setSearchResults] = useState<PlaylistSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [playlistName, setPlaylistName] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<SpotifyUserProfile | null>(null);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [showDefaultDuration, setShowDefaultDuration] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const searchModalRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

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
    const handleClickOutside = (event: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
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
    const handleEscape = (event: KeyboardEvent) => {
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
  const formatTime = (ms: number): string => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Reveal all and play
  const handleRevealAll = (): void => {
    setIsArtistRevealed(true);
    setIsTitleRevealed(true);
    setIsAlbumRevealed(true);
    if (isPaused) {
      togglePlay();
    }
  };

  const handleDefaultDurationChange = (value: number): void => {
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
  const handleSelectPlaylist = async (playlist: PlaylistSearchResult): Promise<void> => {
    await playPlaylist(playlist.uri);
    setPlaylistName(playlist.name);
    setSearchResults([]);
    setSearchQuery('');
    setIsSearchModalOpen(false);
  };

  // Slider fill for the custom range track, as a percentage of the slider's span
  const rangeFill = (value: number, min: number, max: number): React.CSSProperties =>
    ({ '--fill': `${((value - min) / (max - min || 1)) * 100}%` } as React.CSSProperties);

  return (
    <div className="dashboard">
      {/* Search Modal */}
      {isSearchModalOpen && (
        <div className="search-overlay" onClick={() => setIsSearchModalOpen(false)}>
          <div
            className="search-modal nb-card"
            ref={searchModalRef}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="search-modal-title"
          >
            <div className="search-modal-header">
              <h2 id="search-modal-title">{t('searchPlaylist')}</h2>
              <button
                className="nb-icon"
                onClick={() => setIsSearchModalOpen(false)}
                aria-label={t('close')}
              >
                <CloseIcon />
              </button>
            </div>
            <div className="search-input-wrapper">
              <SearchIcon />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('searchPlaceholder')}
                className="search-input"
              />
              {isSearching && <span className="search-loading" aria-label="Loading" />}
            </div>

            {searchQuery.trim().length > 0 && searchQuery.trim().length < 3 && (
              <p className="search-hint">{t('searchHint')}</p>
            )}

            {searchResults.length > 0 && (
              <div className="search-results">
                {searchResults.map((playlist) => (
                  <button
                    key={playlist.id}
                    onClick={() => handleSelectPlaylist(playlist)}
                    className="search-result"
                  >
                    {playlist.image ? (
                      <img src={playlist.image} alt="" className="search-result-image" />
                    ) : (
                      <span className="search-result-image placeholder" />
                    )}
                    <span className="search-result-info">
                      <span className="search-result-name">{playlist.name}</span>
                      <span className="search-result-meta">
                        {playlist.owner} · {playlist.trackCount} {t('songs')}
                      </span>
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <header className="topbar">
        <div className="topbar-titles">
          <h1 className="brand">{t('appName')}</h1>
          {playerName && (
            <p className="topbar-sub">
              {playlistName ? (
                <>
                  <b>{playlistName}</b> {t('playingOn')} {playerName}
                </>
              ) : (
                playerName
              )}
            </p>
          )}
        </div>
        <div className="topbar-actions">
          {isReady && (
            <button
              className="nb-icon"
              onClick={() => setIsSearchModalOpen(true)}
              aria-label={t('searchPlaylist')}
            >
              <SearchIcon />
            </button>
          )}

          <div className="profile-menu" ref={profileMenuRef}>
            <button
              className="nb-icon nb-icon--yellow profile-button"
              onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
              aria-label="User menu"
              aria-expanded={isProfileMenuOpen}
            >
              {userProfile?.images?.[0]?.url ? (
                <img
                  src={userProfile.images[0].url}
                  alt={userProfile.display_name || 'User'}
                  className="profile-avatar"
                />
              ) : (
                <span className="profile-initial">
                  {userProfile?.display_name?.[0]?.toUpperCase() || '?'}
                </span>
              )}
            </button>
            {isProfileMenuOpen && (
              <div className="profile-dropdown nb-card">
                {userProfile && (
                  <div className="profile-info">
                    <span className="profile-name">{userProfile.display_name}</span>
                    <span className="profile-email">{userProfile.email}</span>
                  </div>
                )}
                <div className="lang-switch" role="group" aria-label="Language">
                  <button
                    className={`lang-btn ${locale === 'es' ? 'active' : ''}`}
                    onClick={() => setLocale('es')}
                    aria-pressed={locale === 'es'}
                  >
                    ES
                  </button>
                  <button
                    className={`lang-btn ${locale === 'en' ? 'active' : ''}`}
                    onClick={() => setLocale('en')}
                    aria-pressed={locale === 'en'}
                  >
                    EN
                  </button>
                </div>
                <button className="nb-btn logout-button" onClick={logout}>
                  {t('logout')}
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {!isReady && (
        <div className="status-card nb-card">
          <span className="status-dot" />
          {t('initializing')}
        </div>
      )}

      {isReady && !currentTrack && (
        <section className="empty-card nb-card">
          <h2>{t('emptyTitle')}</h2>
          <p>{t('emptyBody')}</p>
          <button className="nb-btn nb-btn--yellow" onClick={() => setIsSearchModalOpen(true)}>
            <SearchIcon />
            {t('searchPlaylist')}
          </button>
        </section>
      )}

      {/* Stage: song number, hidden cover, and the two answers */}
      {currentTrack && (
        <section className="stage">
          <div className="round" aria-label={`${t('song')} ${songNumber}`}>
            <span className="round-label">{t('song')}</span>
            <span className="round-num">{songNumber}</span>
          </div>

          <button
            className={`cover ${isAlbumRevealed ? 'is-shown' : 'is-hidden'}`}
            onClick={() => setIsAlbumRevealed(true)}
            disabled={isAlbumRevealed}
            aria-label={isAlbumRevealed ? currentTrack.album.name : `${t('reveal')} ${t('album')}`}
          >
            {isAlbumRevealed && currentTrack.album.images[0] ? (
              <img src={currentTrack.album.images[0].url} alt="" className="cover-image" />
            ) : (
              <>
                <span className="cover-q">?</span>
                <span className="cover-hint">
                  {isAlbumRevealed ? currentTrack.album.name : t('album')}
                </span>
              </>
            )}
          </button>

          <div className="answers">
            <button
              className={`answer ${isTitleRevealed ? 'is-shown' : 'is-hidden'}`}
              onClick={() => setIsTitleRevealed(true)}
              disabled={isTitleRevealed}
            >
              <span className="answer-key">{t('song')}</span>
              <span className="answer-value">
                {isTitleRevealed ? currentTrack.name : t('tapToReveal')}
              </span>
            </button>
            <button
              className={`answer ${isArtistRevealed ? 'is-shown' : 'is-hidden'}`}
              onClick={() => setIsArtistRevealed(true)}
              disabled={isArtistRevealed}
            >
              <span className="answer-key">{t('artist')}</span>
              <span className="answer-value">
                {isArtistRevealed
                  ? currentTrack.artists.map((artist) => artist.name).join(', ')
                  : t('tapToReveal')}
              </span>
            </button>
          </div>

          <div className="seek">
            <span className="seek-time">{formatTime(position)}</span>
            <input
              type="range"
              min="0"
              max={duration || 100}
              value={position}
              onChange={(e) => seek(Number(e.target.value))}
              className="nb-range nb-range--thin"
              style={rangeFill(position, 0, duration || 100)}
              aria-label="Seek"
            />
            <span className="seek-time">{formatTime(duration)}</span>
          </div>
        </section>
      )}

      {/* Deck: snippet length, retry, and transport */}
      {currentTrack && (
        <section className="deck">
          <div className="snippet-card nb-card">
            <div className="snippet-head">
              <label htmlFor="current-duration-slider">{t('preview')}</label>
              <output htmlFor="current-duration-slider" className="snippet-value">
                {(currentPreviewDuration / 1000).toFixed(1)}s
              </output>
            </div>
            <div className="snippet-row">
              <input
                id="current-duration-slider"
                type="range"
                min="100"
                max="5000"
                step="100"
                value={currentPreviewDuration}
                onChange={(e) => setCurrentPreviewDuration(Number(e.target.value))}
                className="nb-range"
                style={rangeFill(currentPreviewDuration, 100, 5000)}
              />
              <button
                className={`nb-icon nb-icon--small ${showDefaultDuration ? 'nb-icon--yellow' : ''}`}
                onClick={() => setShowDefaultDuration(!showDefaultDuration)}
                aria-label={t('defaultSettings')}
                aria-expanded={showDefaultDuration}
              >
                <GearIcon />
              </button>
            </div>

            {showDefaultDuration && (
              <div className="snippet-default">
                <div className="snippet-head">
                  <label htmlFor="default-duration-slider">{t('default')}</label>
                  <output htmlFor="default-duration-slider" className="snippet-value small">
                    {(defaultPreviewDuration / 1000).toFixed(1)}s
                  </output>
                </div>
                <input
                  id="default-duration-slider"
                  type="range"
                  min="100"
                  max="5000"
                  step="100"
                  value={defaultPreviewDuration}
                  onChange={(e) => handleDefaultDurationChange(Number(e.target.value))}
                  className="nb-range"
                  style={rangeFill(defaultPreviewDuration, 100, 5000)}
                />
              </div>
            )}
          </div>

          <div className="retry" role="group" aria-label={t('retry')}>
            {[0, 20, 50, 100].map((percent) => (
              <button
                key={percent}
                className={`nb-btn ${percent === 0 ? 'nb-btn--green' : ''}`}
                onClick={() => {
                  if (percent > 0) {
                    setCurrentPreviewDuration(prev => Math.round(prev * (1 + percent / 100)));
                  }
                  replayAndPause();
                }}
              >
                {percent === 0 ? t('replay') : `+${percent}%`}
              </button>
            ))}
          </div>

          <div className="transport">
            <button
              onClick={handleRevealAll}
              className="nb-btn"
              disabled={isFullyRevealed}
            >
              {t('revealAll')}
            </button>
            <button
              onClick={togglePlay}
              className="nb-btn nb-btn--yellow play-button"
              aria-label={isPaused ? t('play') : t('pause')}
            >
              {isPaused ? <PlayIcon /> : <PauseIcon />}
            </button>
            <button
              onClick={playNextAndPause}
              className="nb-btn nb-btn--blue"
            >
              {t('next')}
            </button>
          </div>
        </section>
      )}
    </div>
  );
}

function SearchIcon(): React.ReactElement {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" aria-hidden="true">
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}

function CloseIcon(): React.ReactElement {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" aria-hidden="true">
      <path d="M6 6l12 12M18 6 6 18" />
    </svg>
  );
}

function GearIcon(): React.ReactElement {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}

function PlayIcon(): React.ReactElement {
  return (
    <svg width="30" height="30" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M7 4.5v15l13-7.5z" />
    </svg>
  );
}

function PauseIcon(): React.ReactElement {
  return (
    <svg width="30" height="30" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M6 4.5h4.5v15H6zM13.5 4.5H18v15h-4.5z" />
    </svg>
  );
}

export default Dashboard;
