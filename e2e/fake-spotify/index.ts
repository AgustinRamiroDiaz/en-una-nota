import path from 'path';
import { expect, Page } from '@playwright/test';
import { REQUIRED_SCOPES } from '../../src/utils/spotify';

type Range = [number, number];

export interface FakeSdkConfig {
  seed?: number;
  connectMs?: Range;
  commandMs?: Range;
  eventMs?: Range;
  duplicateEventChance?: number;
  reemitMs?: Range;
  bufferMs?: Range;
  seekBufferMs?: Range;
  resumeMs?: Range;
  reportLoading?: boolean;
  staleEventOnSkip?: boolean;
}

export interface FakeSpotifyOptions {
  sdk?: FakeSdkConfig;
  // Web API round trip as seen by the app.
  apiMs?: Range;
  // Time for a Web API command to reach the playback device.
  deviceMs?: Range;
  // The first call to each path fails with the given status (429 adds Retry-After).
  failOnce?: Record<string, number>;
  previewMs?: number;
  stopOffsetMs?: number;
}

export interface AudibleStretch {
  trackId: string;
  fromPos: number;
  toPos: number;
  startedAt: number;
  endedAt: number;
  ms: number;
}

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Authorization, Content-Type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
};

const PLAYLISTS = [
  { uri: 'spotify:playlist:rock', id: 'rock', name: 'Rock Classics', owner: { display_name: 'E2E' }, images: [], tracks: { total: 8 } },
  { uri: 'spotify:playlist:pop', id: 'pop', name: 'Pop Hits', owner: { display_name: 'E2E' }, images: [], tracks: { total: 8 } },
];

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const pick = ([min, max]: Range) => min + Math.random() * (max - min);

/**
 * Logs in with a stored token and stands in for the Spotify Web API and SDK.
 * Web API player commands are forwarded to the fake SDK in the page after
 * `deviceMs`, independently of the HTTP response, as Spotify Connect does.
 */
export async function setupFakeSpotify(page: Page, options: FakeSpotifyOptions = {}) {
  const { apiMs = [40, 150], deviceMs = [50, 200], failOnce = {}, previewMs = 1000 } = options;
  const failed = new Set<string>();

  await page.addInitScript(
    ({ scopes, sdk, previewMs, stopOffsetMs }) => {
      localStorage.setItem('spotify_access_token', 'e2e-token');
      localStorage.setItem('spotify_expires_at', String(Date.now() + 3600_000));
      localStorage.setItem('spotify_scopes', scopes);
      localStorage.setItem('app_locale', 'en');
      localStorage.setItem('defaultPreviewDuration', String(previewMs));
      if (stopOffsetMs !== undefined) localStorage.setItem('snippetStopOffsetMs', String(stopOffsetMs));
      (window as unknown as { __fakeSpotifyConfig: unknown }).__fakeSpotifyConfig = sdk;
    },
    { scopes: REQUIRED_SCOPES, sdk: options.sdk ?? {}, previewMs, stopOffsetMs: options.stopOffsetMs }
  );

  await page.route('https://sdk.scdn.co/spotify-player.js', (route) =>
    route.fulfill({ contentType: 'application/javascript', path: path.join(__dirname, 'sdk.js') })
  );

  const toDevice = (name: string, body: unknown) => {
    setTimeout(() => {
      page
        .evaluate(([n, b]) => (window as any).__fakeSpotify.remote(n, b), [name, body] as const)
        .catch(() => {});
    }, pick(deviceMs));
  };

  await page.route('https://api.spotify.com/**', async (route) => {
    const request = route.request();
    if (request.method() === 'OPTIONS') return route.fulfill({ status: 204, headers: CORS });

    await sleep(pick(apiMs));
    const { pathname } = new URL(request.url());

    const failStatus = failOnce[pathname];
    if (failStatus && !failed.has(pathname)) {
      failed.add(pathname);
      const headers = failStatus === 429 ? { ...CORS, 'Retry-After': '1' } : CORS;
      return route.fulfill({ status: failStatus, headers, json: { error: { status: failStatus } } });
    }

    const body = request.postData() ? request.postDataJSON() : {};
    switch (pathname) {
      case '/v1/me':
        return route.fulfill({ headers: CORS, json: { id: 'e2e', display_name: 'E2E User', images: [] } });
      case '/v1/search':
        return route.fulfill({ headers: CORS, json: { playlists: { items: PLAYLISTS } } });
      case '/v1/me/player':
        toDevice('transfer', body);
        return route.fulfill({ status: 204, headers: CORS });
      case '/v1/me/player/shuffle':
        return route.fulfill({ status: 204, headers: CORS });
      case '/v1/me/player/play':
        toDevice('play', body);
        return route.fulfill({ status: 204, headers: CORS });
      default:
        return route.fulfill({ status: 404, headers: CORS, json: { error: { status: 404 } } });
    }
  });

  return {
    audible: (): Promise<AudibleStretch[]> => page.evaluate(() => (window as any).__fakeSpotify.audible),
    isPlaying: (): Promise<boolean> => page.evaluate(() => (window as any).__fakeSpotify.audio !== null),
    pauseCount: (): Promise<number> =>
      page.evaluate(() => (window as any).__fakeSpotify.commands.filter((c: { name: string }) => c.name === 'pause').length),

    /** Waits until `count` audible stretches have ended. */
    async waitForStretches(count: number, timeout = 15_000): Promise<AudibleStretch[]> {
      await expect
        .poll(() => page.evaluate(() => (window as any).__fakeSpotify.audible.length), { timeout })
        .toBeGreaterThanOrEqual(count);
      return this.audible();
    },
  };
}

export async function startPlaylist(page: Page) {
  await page.goto('/');
  await page.getByLabel('Search Playlist').click();
  await page.getByPlaceholder('Search playlist...').fill('rock');
  await page.getByRole('button', { name: /Rock Classics/ }).click();
}
