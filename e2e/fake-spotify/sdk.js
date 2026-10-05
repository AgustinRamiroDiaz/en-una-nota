/**
 * Fake Spotify Web Playback SDK, served in place of sdk.scdn.co/spotify-player.js.
 *
 * Simulates the behaviour that matters for snippet timing:
 * - SDK commands go through postMessage to an iframe and take a while to apply.
 * - State events reach listeners late, sometimes twice, and also at random
 *   intervals while playing.
 * - A new track buffers before it is audible. During that time the reported
 *   position already advances with `paused: false`, then a correction event
 *   resets it once audio starts (spotify/web-playback-sdk#88).
 * - After a skip, a state for the old track can still arrive.
 * - Resuming takes a moment to become audible.
 *
 * `window.__fakeSpotify.audible` is the ground truth: each entry is a stretch of
 * audio a listener would have heard, in performance.now() time.
 *
 * Options come from `window.__fakeSpotifyConfig`; ranges are [min, max] ms.
 */
(() => {
  const config = {
    seed: 1,
    connectMs: [100, 300],
    commandMs: [20, 80],
    eventMs: [5, 30],
    duplicateEventChance: 0.3,
    reemitMs: [700, 1500],
    bufferMs: [300, 600],
    seekBufferMs: [30, 120],
    resumeMs: [10, 40],
    reportLoading: true,
    staleEventOnSkip: true,
    ...window.__fakeSpotifyConfig,
  };

  // mulberry32: seeded so a failing run can be reproduced.
  let seed = config.seed >>> 0;
  const random = () => {
    seed = (seed + 0x6d2b79f5) >>> 0;
    let t = seed;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const pick = ([min, max]) => min + random() * (max - min);
  const later = (range, fn) => setTimeout(fn, pick(range));
  const sleep = (range) => new Promise((resolve) => later(range, resolve));

  const makeTracks = (prefix, count) =>
    Array.from({ length: count }, (_, i) => ({
      id: `${prefix}${i}`,
      uri: `spotify:track:${prefix}${i}`,
      name: `Song ${i + 1}`,
      duration_ms: 180000 + i * 1000,
      artists: [{ name: `Artist ${i + 1}`, uri: `spotify:artist:a${i}` }],
      album: { name: `Album ${i + 1}`, uri: `spotify:album:al${i}`, images: [] },
    }));

  const fake = {
    config,
    audible: [],
    commands: [],
    listeners: {},
    tracks: [],
    contextUri: null,
    index: 0,
    paused: true,
    loading: false,
    anchorPos: 0,
    anchorAt: Date.now(),
    audio: null,
    playbackId: 0,
    bufferTimer: null,
    reemitTimer: null,
  };
  window.__fakeSpotify = fake;

  const track = () => fake.tracks[fake.index] ?? null;

  const reportedPosition = (now) =>
    fake.paused ? fake.anchorPos : fake.anchorPos + (now - fake.anchorAt);

  const audiblePosition = () =>
    fake.audio ? fake.audio.fromPos + (performance.now() - fake.audio.startedAt) : null;

  const snapshot = () => {
    const current = track();
    if (!current) return null;
    const now = Date.now();
    return {
      paused: fake.paused,
      loading: config.reportLoading ? fake.loading : undefined,
      position: Math.round(reportedPosition(now)),
      duration: current.duration_ms,
      timestamp: now,
      playback_id: `pb${fake.playbackId}`,
      shuffle: false,
      repeat_mode: 0,
      context: { uri: fake.contextUri, metadata: {} },
      disallows: {},
      track_window: {
        current_track: current,
        previous_tracks: fake.tracks.slice(Math.max(0, fake.index - 2), fake.index),
        next_tracks: fake.tracks.slice(fake.index + 1, fake.index + 3),
      },
    };
  };

  const dispatch = (event, payload) => {
    for (const cb of fake.listeners[event] ?? []) cb(payload);
  };

  const emit = (state = snapshot()) => {
    later(config.eventMs, () => dispatch('player_state_changed', state));
    if (random() < config.duplicateEventChance) {
      later(config.eventMs, () => dispatch('player_state_changed', state));
    }
  };

  const scheduleReemit = () => {
    clearTimeout(fake.reemitTimer);
    if (fake.paused) return;
    fake.reemitTimer = later(config.reemitMs, () => {
      emit();
      scheduleReemit();
    });
  };

  const startAudio = (fromPos) => {
    fake.audio = { trackId: track().id, fromPos, startedAt: performance.now() };
  };

  const stopAudio = () => {
    if (!fake.audio) return;
    const endedAt = performance.now();
    fake.audible.push({
      ...fake.audio,
      endedAt,
      ms: endedAt - fake.audio.startedAt,
      toPos: audiblePosition(),
    });
    fake.audio = null;
  };

  const anchor = (position) => {
    fake.anchorPos = position;
    fake.anchorAt = Date.now();
  };

  // Starts (or restarts) playback at `position`, buffering first.
  const bufferAndPlay = (position, bufferRange) => {
    clearTimeout(fake.bufferTimer);
    stopAudio();
    fake.paused = false;
    fake.loading = true;
    anchor(position);
    emit();
    scheduleReemit();
    fake.bufferTimer = later(bufferRange, () => {
      fake.loading = false;
      anchor(position);
      startAudio(position);
      emit();
    });
  };

  const load = (index, position) => {
    fake.index = index;
    fake.playbackId += 1;
    bufferAndPlay(position, config.bufferMs);
  };

  const command = async (name, apply) => {
    fake.commands.push({ name, at: performance.now() });
    await sleep(config.commandMs);
    apply();
  };

  const pause = () =>
    command('pause', () => {
      if (fake.paused) return;
      clearTimeout(fake.bufferTimer);
      const heard = audiblePosition();
      anchor(heard ?? reportedPosition(Date.now()));
      fake.paused = true;
      fake.loading = false;
      stopAudio();
      clearTimeout(fake.reemitTimer);
      emit();
    });

  const resume = () =>
    command('resume', () => {
      if (!fake.paused || !track()) return;
      fake.paused = false;
      anchor(fake.anchorPos);
      emit();
      scheduleReemit();
      fake.bufferTimer = later(config.resumeMs, () => startAudio(fake.anchorPos));
    });

  const seek = (position) =>
    command('seek', () => {
      if (!track()) return;
      if (fake.paused) {
        anchor(position);
        emit();
      } else {
        bufferAndPlay(position, config.seekBufferMs);
      }
    });

  const nextTrack = () =>
    command('nextTrack', () => {
      if (!track()) return;
      if (config.staleEventOnSkip) {
        const stale = snapshot();
        stale.paused = false;
        emit(stale);
      }
      load((fake.index + 1) % fake.tracks.length, 0);
    });

  const previousTrack = () =>
    command('previousTrack', () => {
      if (!track()) return;
      load(Math.max(0, fake.index - 1), 0);
    });

  // Commands that reach the device through the Web API (see index.ts).
  fake.remote = (name, body = {}) => {
    fake.commands.push({ name: `remote:${name}`, at: performance.now() });
    if (name === 'transfer') {
      dispatch('player_state_changed', null);
    } else if (name === 'play') {
      if (body.context_uri) {
        fake.contextUri = body.context_uri;
        fake.tracks = makeTracks(`${body.context_uri.split(':').pop()}t`, 8);
      } else if (body.uris) {
        fake.contextUri = null;
        fake.tracks = makeTracks('u', body.uris.length);
      }
      load(body.offset?.position ?? 0, body.position_ms ?? 0);
    }
  };

  class Player {
    constructor(options) {
      this.options = options;
      this.volume = options.volume ?? 1;
    }

    async connect() {
      await new Promise((resolve) => this.options.getOAuthToken(resolve));
      later(config.connectMs, () => dispatch('ready', { device_id: 'fake-device' }));
      return true;
    }

    disconnect() {
      clearTimeout(fake.bufferTimer);
      clearTimeout(fake.reemitTimer);
      stopAudio();
      fake.listeners = {};
    }

    addListener(event, cb) {
      (fake.listeners[event] ??= []).push(cb);
      return true;
    }

    removeListener(event, cb) {
      fake.listeners[event] = cb ? (fake.listeners[event] ?? []).filter((l) => l !== cb) : [];
      return true;
    }

    getCurrentState() {
      return sleep(config.commandMs).then(snapshot);
    }

    pause() { return pause(); }
    resume() { return resume(); }
    togglePlay() { return fake.paused ? resume() : pause(); }
    seek(position) { return seek(position); }
    nextTrack() { return nextTrack(); }
    previousTrack() { return previousTrack(); }
    setName() { return Promise.resolve(); }
    getVolume() { return Promise.resolve(this.volume); }
    setVolume(volume) { this.volume = volume; return Promise.resolve(); }
    activateElement() { return Promise.resolve(); }
  }

  window.Spotify = { Player };
  if (typeof window.onSpotifyWebPlaybackSDKReady === 'function') {
    window.onSpotifyWebPlaybackSDKReady();
  }
})();
