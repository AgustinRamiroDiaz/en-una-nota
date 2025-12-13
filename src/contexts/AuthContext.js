/**
 * Authentication Context
 * Manages Spotify OAuth authentication state and token management
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { generateRandomString, generateCodeChallenge } from '../utils/pkce';
import { getAuthorizationUrl, exchangeCodeForToken } from '../utils/spotify';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [accessToken, setAccessToken] = useState(null);
  const [expiresAt, setExpiresAt] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Check for existing token in localStorage on mount
  useEffect(() => {
    const storedToken = localStorage.getItem('spotify_access_token');
    const storedExpiresAt = localStorage.getItem('spotify_expires_at');

    if (storedToken && storedExpiresAt) {
      const expirationTime = parseInt(storedExpiresAt, 10);

      // Check if token is still valid
      if (Date.now() < expirationTime) {
        setAccessToken(storedToken);
        setExpiresAt(expirationTime);
        setIsAuthenticated(true);
      } else {
        // Token expired, clear it
        logout();
      }
    }
  }, []);

  /**
   * Initiates the Spotify login flow with PKCE
   */
  const login = async () => {
    setIsLoading(true);
    try {
      // Generate PKCE code verifier and challenge
      const codeVerifier = generateRandomString(128);
      const codeChallenge = await generateCodeChallenge(codeVerifier);

      // Store code verifier for later use in callback
      sessionStorage.setItem('code_verifier', codeVerifier);

      // Redirect to Spotify authorization
      const authUrl = getAuthorizationUrl(codeChallenge);
      window.location.href = authUrl;
    } catch (error) {
      console.error('Login failed:', error);
      setIsLoading(false);
    }
  };

  /**
   * Handles the OAuth callback and exchanges code for token
   * @param {string} code - Authorization code from Spotify
   */
  const handleCallback = async (code) => {
    setIsLoading(true);
    try {
      // Retrieve the code verifier from session storage
      const codeVerifier = sessionStorage.getItem('code_verifier');

      if (!codeVerifier) {
        throw new Error('Code verifier not found. Please try logging in again.');
      }

      // Exchange authorization code for access token
      const tokenData = await exchangeCodeForToken(code, codeVerifier);

      // Calculate token expiration time
      const expirationTime = Date.now() + (tokenData.expires_in * 1000);

      // Update state
      setAccessToken(tokenData.access_token);
      setExpiresAt(expirationTime);
      setIsAuthenticated(true);

      // Store token in localStorage for persistence
      localStorage.setItem('spotify_access_token', tokenData.access_token);
      localStorage.setItem('spotify_expires_at', expirationTime.toString());

      // Clean up session storage
      sessionStorage.removeItem('code_verifier');

      // Clean up URL (remove code parameter)
      window.history.replaceState({}, document.title, '/');
    } catch (error) {
      console.error('Authentication callback failed:', error);
      alert(`Authentication failed: ${error.message}`);
      logout();
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Logs out the user and clears all stored data
   */
  const logout = () => {
    setAccessToken(null);
    setExpiresAt(null);
    setIsAuthenticated(false);
    localStorage.removeItem('spotify_access_token');
    localStorage.removeItem('spotify_expires_at');
    sessionStorage.removeItem('code_verifier');
  };

  /**
   * Checks if the current token is still valid
   * @returns {boolean} True if token exists and hasn't expired
   */
  const isTokenValid = () => {
    return accessToken && expiresAt && Date.now() < expiresAt;
  };

  const value = {
    accessToken,
    isAuthenticated,
    isLoading,
    login,
    logout,
    handleCallback,
    isTokenValid,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Hook to use the auth context
 * @returns {Object} Auth context value
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
