import { test, expect, Page } from '@playwright/test';
import { setupFakeSpotify, startPlaylist, AudibleStretch } from './fake-spotify';

// Pause latency in the fake is 20–80 ms and the stop offset starts at 0, so a
// snippet runs a little long until calibration catches up. Timer jitter in the
// browser adds a few ms either way.
const EARLY_MS = 50;
const LATE_MS = 150;

function expectSnippet(stretch: AudibleStretch, targetMs: number) {
  expect(stretch.fromPos, 'snippet should start at the beginning of the track').toBe(0);
  expect(stretch.ms).toBeGreaterThanOrEqual(targetMs - EARLY_MS);
  expect(stretch.ms).toBeLessThanOrEqual(targetMs + LATE_MS);
}

async function expectStaysPaused(page: Page, fake: Awaited<ReturnType<typeof setupFakeSpotify>>, ms = 1500) {
  const count = (await fake.audible()).length;
  await page.waitForTimeout(ms);
  expect(await fake.isPlaying()).toBe(false);
  expect(await fake.audible()).toHaveLength(count);
}

const playButton = (page: Page) => page.locator('.play-button');

test('snippet length is measured from audible playback, not from the buffering start', async ({ page }) => {
  const fake = await setupFakeSpotify(page, { sdk: { bufferMs: [400, 700] } });
  await startPlaylist(page);

  const [stretch] = await fake.waitForStretches(1);
  expectSnippet(stretch, 1000);
  await expectStaysPaused(page, fake);
});

test('without a loading flag, the correction event after buffering resets the stop', async ({ page }) => {
  const fake = await setupFakeSpotify(page, { sdk: { reportLoading: false, bufferMs: [300, 500] } });
  await startPlaylist(page);

  const [stretch] = await fake.waitForStretches(1);
  expectSnippet(stretch, 1000);
});

test('frequent and duplicated state events do not stretch the snippet', async ({ page }) => {
  const fake = await setupFakeSpotify(page, {
    previewMs: 3000,
    sdk: { reemitMs: [150, 300], duplicateEventChance: 1 },
  });
  await startPlaylist(page);

  const [stretch] = await fake.waitForStretches(1);
  expectSnippet(stretch, 3000);
  await expectStaysPaused(page, fake);
});

test('next plays a snippet of the new track despite a stale state for the old one', async ({ page }) => {
  const fake = await setupFakeSpotify(page, { sdk: { staleEventOnSkip: true } });
  await startPlaylist(page);
  const [first] = await fake.waitForStretches(1);
  await expect(playButton(page)).toHaveAccessibleName('Play');

  await page.getByRole('button', { name: 'Next' }).click();
  const [, second] = await fake.waitForStretches(2);

  expect(second.trackId).not.toBe(first.trackId);
  expectSnippet(second, 1000);
  await expectStaysPaused(page, fake);
});

test('replay while playing past the target restarts the snippet from the beginning', async ({ page }) => {
  const fake = await setupFakeSpotify(page);
  await startPlaylist(page);
  await fake.waitForStretches(1);
  await expect(playButton(page)).toHaveAccessibleName('Play');

  await playButton(page).click();
  await expect.poll(() => fake.isPlaying()).toBe(true);
  await page.waitForTimeout(1500);

  await page.getByRole('button', { name: 'Replay' }).click();
  const stretches = await fake.waitForStretches(3);

  expect(stretches[1].ms, 'manual playback should not be cut by a snippet').toBeGreaterThan(1300);
  expectSnippet(stretches[2], 1000);
  await expectStaysPaused(page, fake);
});

test('pausing mid-snippet and pressing play lets the song keep playing', async ({ page }) => {
  const fake = await setupFakeSpotify(page, { previewMs: 2000 });
  await startPlaylist(page);
  await expect.poll(() => fake.isPlaying()).toBe(true);
  await expect(playButton(page)).toHaveAccessibleName('Pause');

  await playButton(page).click();
  await fake.waitForStretches(1);
  await expect(playButton(page)).toHaveAccessibleName('Play');
  await playButton(page).click();
  await expect.poll(() => fake.isPlaying()).toBe(true);

  await page.waitForTimeout(3000);
  expect(await fake.isPlaying()).toBe(true);
});

test('the stop offset learns the pause latency over a few rounds', async ({ page }) => {
  const fake = await setupFakeSpotify(page, {
    previewMs: 500,
    sdk: { commandMs: [90, 90], resumeMs: [0, 0], duplicateEventChance: 0 },
  });
  await startPlaylist(page);
  await fake.waitForStretches(1);

  for (let round = 2; round <= 7; round++) {
    await expect(playButton(page)).toHaveAccessibleName('Play');
    await page.getByRole('button', { name: 'Replay' }).click();
    await fake.waitForStretches(round);
  }

  const errors = (await fake.audible()).slice(1).map((s) => s.ms - 500);
  expect(errors[errors.length - 1]).toBeLessThan(errors[0] - 40);
  expect(Math.abs(errors[errors.length - 1])).toBeLessThan(40);
  const offset = Number(await page.evaluate(() => localStorage.getItem('snippetStopOffsetMs')));
  expect(offset).toBeGreaterThan(40);
});

test('slow, rate-limited and failing Web API calls still start the snippet', async ({ page }) => {
  const fake = await setupFakeSpotify(page, {
    apiMs: [300, 700],
    deviceMs: [200, 500],
    failOnce: { '/v1/me/player': 502, '/v1/me/player/shuffle': 429, '/v1/me/player/play': 429 },
  });
  await startPlaylist(page);

  const [stretch] = await fake.waitForStretches(1);
  expectSnippet(stretch, 1000);
  await expectStaysPaused(page, fake);
});
