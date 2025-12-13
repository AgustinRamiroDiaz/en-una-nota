/**
 * Dashboard Component
 * Displays the user's top 5 tracks from Spotify
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getTopTracks } from '../utils/spotify';

function Dashboard() {
  const { accessToken, logout } = useAuth();
  const [tracks, setTracks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
        {tracks.length === 0 ? (
          <p>No tracks found. Start listening to some music on Spotify!</p>
        ) : (
          <ol className="tracks-list">
            {tracks.map((track, index) => (
              <li key={track.id} className="track-item">
                <span className="track-name">{track.name}</span>
                <span className="track-separator"> - </span>
                <span className="track-artist">
                  {track.artists.map(artist => artist.name).join(', ')}
                </span>
              </li>
            ))}
          </ol>
        )}
        <button className="logout-button" onClick={logout}>
          Logout
        </button>
      </div>
    </div>
  );
}

export default Dashboard;
