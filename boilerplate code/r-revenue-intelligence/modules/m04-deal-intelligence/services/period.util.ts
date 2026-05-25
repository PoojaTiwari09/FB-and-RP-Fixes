// src/modules/deal-drivers/period.util.ts
// Resolves Period enum → concrete UTC { start, end } window.

import { Period, PeriodWindow } from '../entities/deal-drivers.entities';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export const WARNING_ACTIVE_THRESHOLD_HOURS = 24;

/**
 * Resolve a Period enum to a concrete UTC time window.
 *
 * NOW          → start = midnight UTC today, end = now
 * LAST_30_DAYS → start = exactly 30 days ago, end = now
 * LAST_90_DAYS → start = exactly 90 days ago, end = now
 *
 * `now` is injectable for deterministic unit tests.
 */
export function resolvePeriodWindow(period: Period, now: Date = new Date()): PeriodWindow {
  const end = new Date(now);

  if (period === Period.NOW) {
    const start = new Date(end);
    start.setUTCHours(0, 0, 0, 0);
    return { start, end };
  }

  const days = period === Period.LAST_30_DAYS ? 30 : 90;
  const start = new Date(end.getTime() - days * MS_PER_DAY);
  return { start, end };
}

/**
 * Returns the overlap in milliseconds between [aStart,aEnd] and [bStart,bEnd].
 * Returns 0 if no overlap.
 */
export function intervalOverlapMs(
  aStart: Date, aEnd: Date,
  bStart: Date, bEnd: Date,
): number {
  const overlapStart = Math.max(aStart.getTime(), bStart.getTime());
  const overlapEnd   = Math.min(aEnd.getTime(),   bEnd.getTime());
  return Math.max(0, overlapEnd - overlapStart);
}

export function msToHours(ms: number): number {
  return ms / (1000 * 60 * 60);
}
