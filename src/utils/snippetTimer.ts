/**
 * Snippet stop timing
 *
 * Stops playback once a snippet reaches its target track position. The stop is
 * computed from the SDK's reported position (extrapolated from the state's
 * timestamp) and rescheduled on every state event, so corrections such as the
 * position reset after buffering move it. The pause latency is learned from
 * where playback actually ended and subtracted from later stops.
 */

import type { SpotifyPlayer, SpotifyPlayerState } from '../types/spotify.d';

const OFFSET_STORAGE_KEY = 'snippetStopOffsetMs';
const OFFSET_SMOOTHING = 0.3;
const OFFSET_MIN_MS = -150;
const OFFSET_MAX_MS = 300;
// Larger errors come from a manual seek or a missed event, not pause latency.
const OFFSET_MAX_ERROR_MS = 500;
// Fallback stop when no usable playing state arrives (e.g. a very long buffer).
const DEADLINE_SLACK_MS = 10000;

export interface SnippetTarget {
  stopAt: number;
  // Events for this track predate the skip that armed the snippet.
  skipTrackId: string | null;
  started: boolean;
}

export type SnippetDecision =
  | { kind: 'ignore' }
  | { kind: 'hold' }
  | { kind: 'schedule'; delayMs: number };

export function livePosition(state: SpotifyPlayerState, now: number): number {
  if (state.paused || state.timestamp === undefined) return state.position;
  return state.position + Math.max(0, now - state.timestamp);
}

export function decideSnippetStop(
  target: SnippetTarget,
  state: SpotifyPlayerState,
  now: number,
  offsetMs: number
): SnippetDecision {
  if (target.skipTrackId !== null && state.track_window.current_track?.id === target.skipTrackId) {
    return { kind: 'ignore' };
  }
  if (state.paused || state.loading) return { kind: 'hold' };

  const position = livePosition(state, now);
  // Before the snippet has started, a position past the target is a stale
  // event from before the seek/replay that armed it.
  if (!target.started && position >= target.stopAt) return { kind: 'ignore' };

  return { kind: 'schedule', delayMs: Math.max(0, target.stopAt - offsetMs - position) };
}

export function nextOffset(offsetMs: number, stopAt: number, pausedPosition: number): number | null {
  const error = pausedPosition - stopAt;
  if (Math.abs(error) > OFFSET_MAX_ERROR_MS) return null;
  const updated = offsetMs + OFFSET_SMOOTHING * error;
  return Math.min(OFFSET_MAX_MS, Math.max(OFFSET_MIN_MS, updated));
}

function loadOffset(): number {
  const saved = Number(localStorage.getItem(OFFSET_STORAGE_KEY));
  return Number.isFinite(saved) ? Math.min(OFFSET_MAX_MS, Math.max(OFFSET_MIN_MS, saved)) : 0;
}

function logSnippet(event: string, data: Record<string, unknown>): void {
  console.debug(`[snippet] ${event}`, { t: Math.round(performance.now()), ...data });
}

export class SnippetController {
  private target: SnippetTarget | null = null;
  private stopTimer: ReturnType<typeof setTimeout> | null = null;
  private deadlineTimer: ReturnType<typeof setTimeout> | null = null;
  private pendingCalibration: number | null = null;
  private offset = loadOffset();

  arm(player: SpotifyPlayer, durationMs: number, skipTrackId: string | null): void {
    this.clearTimers();
    this.target = { stopAt: durationMs, skipTrackId, started: false };
    this.pendingCalibration = null;
    this.deadlineTimer = setTimeout(() => {
      logSnippet('deadline', { stopAt: durationMs });
      this.stop(player, false);
    }, durationMs + DEADLINE_SLACK_MS);
    logSnippet('arm', { stopAt: durationMs, skipTrackId, offset: this.offset });
  }

  onState(player: SpotifyPlayer, state: SpotifyPlayerState): void {
    const now = Date.now();
    logSnippet('state', {
      paused: state.paused,
      loading: state.loading,
      position: state.position,
      timestamp: state.timestamp,
      livePosition: livePosition(state, now),
      trackId: state.track_window.current_track?.id,
      playbackId: state.playback_id,
      armed: this.target !== null,
    });

    if (state.paused && this.pendingCalibration !== null) {
      const stopAt = this.pendingCalibration;
      this.pendingCalibration = null;
      const updated = nextOffset(this.offset, stopAt, state.position);
      logSnippet('ended', {
        stopAt,
        position: state.position,
        error: state.position - stopAt,
        offset: this.offset,
        nextOffset: updated,
      });
      if (updated !== null) {
        this.offset = updated;
        localStorage.setItem(OFFSET_STORAGE_KEY, String(Math.round(updated)));
      }
    }

    if (!this.target) return;
    const decision = decideSnippetStop(this.target, state, now, this.offset);
    if (decision.kind === 'ignore') return;

    if (this.stopTimer) clearTimeout(this.stopTimer);
    this.stopTimer = null;
    if (decision.kind === 'hold') return;

    this.target.started = true;
    this.stopTimer = setTimeout(() => this.stop(player, true), decision.delayMs);
    logSnippet('schedule', { delayMs: decision.delayMs, stopAt: this.target.stopAt, offset: this.offset });
  }

  cancel(): void {
    if (this.target) logSnippet('cancel', { stopAt: this.target.stopAt });
    this.clearTimers();
    this.target = null;
    this.pendingCalibration = null;
  }

  private stop(player: SpotifyPlayer, calibrate: boolean): void {
    if (!this.target) return;
    this.pendingCalibration = calibrate ? this.target.stopAt : null;
    this.target = null;
    this.clearTimers();
    player.pause();
  }

  private clearTimers(): void {
    if (this.stopTimer) clearTimeout(this.stopTimer);
    if (this.deadlineTimer) clearTimeout(this.deadlineTimer);
    this.stopTimer = null;
    this.deadlineTimer = null;
  }
}
