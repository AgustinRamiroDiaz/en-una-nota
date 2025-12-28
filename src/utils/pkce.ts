/**
 * PKCE (Proof Key for Code Exchange) Utilities
 * Used for secure OAuth 2.0 authentication without a client secret
 */

/**
 * Generates a cryptographically random string for the code verifier
 * @param length - Length of the string (must be 43-128 characters)
 * @returns Random string from [A-Z, a-z, 0-9, -, ., _, ~]
 */
export function generateRandomString(length: number): string {
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
  const values = crypto.getRandomValues(new Uint8Array(length));
  return values.reduce((acc, x) => acc + possible[x % possible.length], '');
}

/**
 * Generates a code challenge from a code verifier using SHA-256
 * @param codeVerifier - The code verifier string
 * @returns Base64URL-encoded SHA-256 hash of the verifier
 */
export async function generateCodeChallenge(codeVerifier: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(codeVerifier);
  const digest = await window.crypto.subtle.digest('SHA-256', data);
  return base64URLEncode(digest);
}

/**
 * Encodes an ArrayBuffer to base64url format
 * @param buffer - The buffer to encode
 * @returns Base64URL-encoded string
 */
function base64URLEncode(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  bytes.forEach(byte => binary += String.fromCharCode(byte));
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

