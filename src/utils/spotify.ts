/**
 * Spotify Web API Utilities
 * Handles OAuth authentication and API requests
 */

const SPOTIFY_AUTH_ENDPOINT = 'https://accounts.spotify.com/authorize';
const SPOTIFY_TOKEN_ENDPOINT = 'https://accounts.spotify.com/api/token';
const SPOTIFY_API_BASE = 'https://api.spotify.com/v1';

// Required scopes for the app
export const REQUIRED_SCOPES = 'user-top-read user-read-email user-read-private streaming user-read-playback-state user-modify-playback-state';

export interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
  scope: string;
}

export interface SpotifyTrack {
  id: string;
  name: string;
  artists: { name: string }[];
  album: {
    name: string;
    images: { url: string }[];
  };
}

export interface TopTracksResponse {
  items: SpotifyTrack[];
}

/**
 * Constructs the Spotify authorization URL with PKCE parameters
 * @param codeChallenge - The PKCE code challenge
 * @returns The complete authorization URL
 */
export function getAuthorizationUrl(codeChallenge: string): string {
  const params = new URLSearchParams({
    client_id: process.env.REACT_APP_SPOTIFY_CLIENT_ID || '',
    response_type: 'code',
    redirect_uri: process.env.REACT_APP_REDIRECT_URI || '',
    scope: REQUIRED_SCOPES,
    code_challenge_method: 'S256',
    code_challenge: codeChallenge,
  });

  return `${SPOTIFY_AUTH_ENDPOINT}?${params.toString()}`;
}

/**
 * Exchanges an authorization code for an access token using PKCE
 * @param code - The authorization code from Spotify callback
 * @param codeVerifier - The PKCE code verifier
 * @returns Token data including access_token and expires_in
 */
export async function exchangeCodeForToken(code: string, codeVerifier: string): Promise<TokenResponse> {
  const params = new URLSearchParams({
    grant_type: 'authorization_code',
    code: code,
    redirect_uri: process.env.REACT_APP_REDIRECT_URI || '',
    client_id: process.env.REACT_APP_SPOTIFY_CLIENT_ID || '',
    code_verifier: codeVerifier,
  });

  const response = await fetch(SPOTIFY_TOKEN_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`Token exchange failed: ${errorData.error_description || errorData.error}`);
  }

  return await response.json();
}

/**
 * Fetches the user's top tracks from Spotify
 * @param accessToken - The Spotify access token
 * @param limit - Number of tracks to fetch (default: 5)
 * @returns Response containing items array of track objects
 */
export async function getTopTracks(accessToken: string, limit: number = 5): Promise<TopTracksResponse> {
  const response = await fetch(
    `${SPOTIFY_API_BASE}/me/top/tracks?limit=${limit}&time_range=short_term`,
    {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('Access token expired or invalid');
    }
    throw new Error('Failed to fetch top tracks');
  }

  return await response.json();
}

