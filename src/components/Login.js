/**
 * Login Component
 * Displays the landing page with Spotify login button
 */

import React from 'react';
import { useAuth } from '../contexts/AuthContext';

function Login() {
  const { login } = useAuth();

  return (
    <div className="login-container">
      <div className="login-content">
        <h1>Spotify Top Tracks</h1>
        <p>Discover your most played songs on Spotify</p>
        <button className="login-button" onClick={login}>
          Login with Spotify
        </button>
      </div>
    </div>
  );
}

export default Login;
