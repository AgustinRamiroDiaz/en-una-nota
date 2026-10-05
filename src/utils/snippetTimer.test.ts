import { SnippetController, decideSnippetStop, livePosition, nextOffset } from './snippetTimer';
import type { SpotifyPlayer, SpotifyPlayerState } from '../types/spotify.d';

function makeState(overrides: Partial<SpotifyPlayerState> & { trackId?: string } = {}): SpotifyPlayerState {
  const { trackId = 'new', ...rest } = overrides;
  return {
    paused: false,
    position: 0,
    duration: 180000,
    track_window: {
      current_track: { id: trackId, name: '', artists: [], album: { name: '', images: [] } },
      previous_tracks: [],
      next_tracks: [],
    },
    ...rest,
  };
}

function makePlayer(): SpotifyPlayer & { pause: jest.Mock } {
  return { pause: jest.fn().mockResolvedValue(undefined) } as unknown as SpotifyPlayer & { pause: jest.Mock };
}

describe('livePosition', () => {
  it('extrapolates from the timestamp while playing', () => {
    expect(livePosition(makeState({ position: 100, timestamp: 1000 }), 1250)).toBe(350);
  });

  it('uses the raw position when paused or without a timestamp', () => {
    expect(livePosition(makeState({ position: 100, timestamp: 1000, paused: true }), 1250)).toBe(100);
    expect(livePosition(makeState({ position: 100 }), 1250)).toBe(100);
  });
});

describe('decideSnippetStop', () => {
  const target = { stopAt: 1000, skipTrackId: 'old', started: false };

  it('ignores events for the track that was skipped', () => {
    expect(decideSnippetStop(target, makeState({ trackId: 'old' }), 0, 0)).toEqual({ kind: 'ignore' });
  });

  it('holds while paused or loading', () => {
    expect(decideSnippetStop(target, makeState({ paused: true }), 0, 0)).toEqual({ kind: 'hold' });
    expect(decideSnippetStop(target, makeState({ loading: true }), 0, 0)).toEqual({ kind: 'hold' });
  });

  it('schedules the remaining time minus the offset', () => {
    const state = makeState({ position: 200, timestamp: 1000 });
    expect(decideSnippetStop(target, state, 1100, 50)).toEqual({ kind: 'schedule', delayMs: 650 });
  });

  it('ignores a stale position past the target before the snippet starts', () => {
    expect(decideSnippetStop(target, makeState({ position: 5000 }), 0, 0)).toEqual({ kind: 'ignore' });
  });

  it('stops immediately once started and past the target', () => {
    const started = { ...target, started: true };
    expect(decideSnippetStop(started, makeState({ position: 5000 }), 0, 0)).toEqual({ kind: 'schedule', delayMs: 0 });
  });
});

describe('nextOffset', () => {
  it('moves the offset toward the observed overshoot', () => {
    expect(nextOffset(0, 1000, 1100)).toBeCloseTo(30);
    expect(nextOffset(100, 1000, 950)).toBeCloseTo(85);
  });

  it('rejects outliers and clamps', () => {
    expect(nextOffset(0, 1000, 2000)).toBeNull();
    expect(nextOffset(290, 1000, 1400)).toBe(300);
  });
});

describe('SnippetController', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(10000);
    localStorage.clear();
    jest.spyOn(console, 'debug').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('reschedules on each event instead of restarting the full duration', () => {
    const player = makePlayer();
    const controller = new SnippetController();
    controller.arm(player, 1000, null);

    controller.onState(player, makeState({ position: 0, timestamp: 10000 }));
    jest.advanceTimersByTime(600);
    // A correction event (e.g. after buffering) reports the position went back to 100.
    controller.onState(player, makeState({ position: 100, timestamp: 10600 }));
    jest.advanceTimersByTime(899);
    expect(player.pause).not.toHaveBeenCalled();
    jest.advanceTimersByTime(1);
    expect(player.pause).toHaveBeenCalledTimes(1);
  });

  it('waits out buffering before scheduling', () => {
    const player = makePlayer();
    const controller = new SnippetController();
    controller.arm(player, 500, null);

    controller.onState(player, makeState({ loading: true, position: 0, timestamp: 10000 }));
    jest.advanceTimersByTime(3000);
    expect(player.pause).not.toHaveBeenCalled();

    controller.onState(player, makeState({ position: 0, timestamp: 13000 }));
    jest.advanceTimersByTime(500);
    expect(player.pause).toHaveBeenCalledTimes(1);
  });

  it('learns the offset from where playback ended', () => {
    const player = makePlayer();
    const controller = new SnippetController();
    controller.arm(player, 1000, null);
    controller.onState(player, makeState({ position: 0, timestamp: 10000 }));
    jest.advanceTimersByTime(1000);
    controller.onState(player, makeState({ paused: true, position: 1100 }));
    expect(localStorage.getItem('snippetStopOffsetMs')).toBe('30');

    controller.arm(player, 1000, null);
    controller.onState(player, makeState({ position: 0, timestamp: 11000 }));
    jest.advanceTimersByTime(969);
    expect(player.pause).toHaveBeenCalledTimes(1);
    jest.advanceTimersByTime(1);
    expect(player.pause).toHaveBeenCalledTimes(2);
  });

  it('pauses at the deadline when no playing state arrives', () => {
    const player = makePlayer();
    const controller = new SnippetController();
    controller.arm(player, 1000, null);
    jest.advanceTimersByTime(11000);
    expect(player.pause).toHaveBeenCalledTimes(1);
  });

  it('stops nothing after cancel', () => {
    const player = makePlayer();
    const controller = new SnippetController();
    controller.arm(player, 1000, null);
    controller.onState(player, makeState({ position: 0, timestamp: 10000 }));
    controller.cancel();
    controller.onState(player, makeState({ position: 500, timestamp: 10500 }));
    jest.advanceTimersByTime(20000);
    expect(player.pause).not.toHaveBeenCalled();
  });

  it('does not re-arm from later events after stopping', () => {
    const player = makePlayer();
    const controller = new SnippetController();
    controller.arm(player, 200, null);
    controller.onState(player, makeState({ position: 0, timestamp: 10000 }));
    jest.advanceTimersByTime(200);
    controller.onState(player, makeState({ position: 0, timestamp: 10200 }));
    jest.advanceTimersByTime(20000);
    expect(player.pause).toHaveBeenCalledTimes(1);
  });
});
