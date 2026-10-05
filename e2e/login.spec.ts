import { createHash } from 'crypto';
import { test, expect, BrowserContext } from '@playwright/test';
import { ORIGIN } from '../playwright.config';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Authorization, Content-Type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
};

const s256 = (verifier: string) => createHash('sha256').update(verifier).digest('base64url');

/**
 * Stands in for Spotify: /authorize redirects straight back with a code, and
 * /api/token only succeeds if the verifier matches the challenge sent to /authorize.
 */
async function mockSpotify(context: BrowserContext) {
  let codeChallenge: string | null = null;
  let receivedVerifier: string | null = null;

  await context.route('https://accounts.spotify.com/authorize?**', (route) => {
    const params = new URL(route.request().url()).searchParams;
    codeChallenge = params.get('code_challenge');
    return route.fulfill({
      status: 302,
      headers: { location: `${params.get('redirect_uri')}/?code=e2e-code` },
    });
  });

  await context.route('https://accounts.spotify.com/api/token', (route) => {
    if (route.request().method() === 'OPTIONS') return route.fulfill({ status: 204, headers: CORS });
    receivedVerifier = new URLSearchParams(route.request().postData() ?? '').get('code_verifier');
    if (!receivedVerifier || s256(receivedVerifier) !== codeChallenge) {
      return route.fulfill({ status: 400, headers: CORS, json: { error: 'invalid_grant' } });
    }
    return route.fulfill({
      headers: CORS,
      json: { access_token: 'e2e-token', token_type: 'Bearer', expires_in: 3600, scope: '' },
    });
  });

  await context.route('https://api.spotify.com/**', (route) => {
    if (route.request().method() === 'OPTIONS') return route.fulfill({ status: 204, headers: CORS });
    if (new URL(route.request().url()).pathname === '/v1/me') {
      return route.fulfill({ headers: CORS, json: { display_name: 'E2E User', images: [] } });
    }
    return route.fulfill({ status: 204, headers: CORS });
  });

  await context.route('https://sdk.scdn.co/**', (route) =>
    route.fulfill({ contentType: 'application/javascript', body: '' })
  );

  return { verifier: () => receivedVerifier };
}

test.beforeEach(async ({ page }) => {
  page.on('dialog', (dialog) => {
    throw new Error(`Unexpected dialog: ${dialog.message()}`);
  });
});

test('localhost redirects to the redirect URI origin, keeping path, query and hash', async ({ page }) => {
  const localhost = ORIGIN.replace('127.0.0.1', 'localhost');
  await page.goto(`${localhost}/?foo=1#bar`);
  await expect(page).toHaveURL(`${ORIGIN}/?foo=1#bar`);
  await expect(page.locator('.login-button')).toBeVisible();
});

for (const start of ['127.0.0.1', 'localhost']) {
  test(`first login succeeds when starting on ${start}`, async ({ page, context }) => {
    const spotify = await mockSpotify(context);

    await page.goto(ORIGIN.replace('127.0.0.1', start));
    await page.locator('.login-button').click();

    await expect(page.locator('.topbar')).toBeVisible();
    await expect(page).toHaveURL(`${ORIGIN}/`);
    expect(spotify.verifier()).not.toBeNull();
    expect(await page.evaluate(() => localStorage.getItem('spotify_access_token'))).toBe('e2e-token');
    expect(await page.evaluate(() => localStorage.getItem('pkce_code_verifier'))).toBeNull();
  });
}
