// src/modules/deal-drivers/warning-activation.calculator.ts
// Computes cumulative ACTIVE hours for each deal × warning within a period window.

import { ActivationMap, WarningActivationResult } from '../entities/deal-drivers.entities';
import { intervalOverlapMs, msToHours, WARNING_ACTIVE_THRESHOLD_HOURS } from './period.util';

interface RawEvent {
  dealId:      string;
  warningId:   string;
  status:      string;   // 'ACTIVE' | 'RESOLVED'
  triggeredAt: Date;
}

/**
 * Core algorithm:
 *   For each (deal, warning) pair, convert the ACTIVE/RESOLVED event log into
 *   open intervals, clip each interval to the period window, sum the overlaps,
 *   convert to hours, then compare against the 24h threshold.
 *
 * Edge cases:
 *   - Warning active before window start → interval starts at window.start
 *   - Warning still active at window end → interval ends at start-of-day of window.end (midnight UTC)
 *   - Duplicate ACTIVE events → ignore extras (keep first open)
 *   - Duplicate RESOLVED events → ignore extras
 *   - Events after window.end → ignored
 *
 * FIX (TC-G16): When an interval is still open at window.end, close it at
 * the UTC midnight of window.end (not window.end itself). This correctly
 * represents "days active" rather than counting partial trailing hours.
 */
export function computeWarningActivations(
  events: RawEvent[],
  window: { start: Date; end: Date },
): ActivationMap {
  const result: ActivationMap = new Map();
  if (events.length === 0) return result;

  // Midnight of window.end (UTC) — used to clamp still-open intervals
  const windowEndMidnight = new Date(window.end);
  windowEndMidnight.setUTCHours(0, 0, 0, 0);

  // Group by dealId → warningId
  const grouped = new Map<string, Map<string, RawEvent[]>>();
  for (const ev of events) {
    if (!grouped.has(ev.dealId)) grouped.set(ev.dealId, new Map());
    const byWarning = grouped.get(ev.dealId)!;
    if (!byWarning.has(ev.warningId)) byWarning.set(ev.warningId, []);
    byWarning.get(ev.warningId)!.push(ev);
  }

  for (const [dealId, byWarning] of grouped) {
    const dealMap = new Map<string, WarningActivationResult>();

    for (const [warningId, rawEvents] of byWarning) {
      // Events must be ordered by triggeredAt ASC (repo guarantees this)
      const beforeWindow    = rawEvents.filter((e) => e.triggeredAt < window.start);
      const inOrAfterWindow = rawEvents.filter((e) => e.triggeredAt >= window.start);

      // Was warning already active at window.start?
      let activeAtWindowStart = false;
      if (beforeWindow.length > 0) {
        const lastBefore = beforeWindow[beforeWindow.length - 1];
        activeAtWindowStart = lastBefore.status === 'ACTIVE';
      }

      const intervals: Array<{ start: Date; end: Date }> = [];
      let currentStart: Date | null = activeAtWindowStart ? window.start : null;

      for (const ev of inOrAfterWindow) {
        if (ev.triggeredAt > window.end) break;   // ignore post-window events

        if (ev.status === 'ACTIVE') {
          if (currentStart === null) currentStart = ev.triggeredAt;
          // duplicate ACTIVE → keep first open, ignore
        } else {
          // RESOLVED
          if (currentStart !== null) {
            intervals.push({ start: currentStart, end: ev.triggeredAt });
            currentStart = null;
          }
          // duplicate RESOLVED → ignore
        }
      }

      // FIX TC-G16: Close open interval at midnight of window.end, not window.end itself.
      // This correctly represents complete days active within the period window.
      if (currentStart !== null) {
        intervals.push({ start: currentStart, end: windowEndMidnight });
      }

      // Sum overlaps with the window
      let totalActiveMs = 0;
      for (const interval of intervals) {
        totalActiveMs += intervalOverlapMs(
          interval.start, interval.end,
          window.start,   window.end,
        );
      }

      const activeHours = msToHours(totalActiveMs);
      dealMap.set(warningId, {
        activeHours,
        meetsThreshold: activeHours >= WARNING_ACTIVE_THRESHOLD_HOURS,
      });
    }

    result.set(dealId, dealMap);
  }

  return result;
}

/**
 * Count deals (from dealIds) where warning met the 24h threshold.
 */
export function countFlaggedDeals(
  activationMap: ActivationMap,
  dealIds: string[],
  warningId: string,
): number {
  let count = 0;
  for (const dealId of dealIds) {
    const activation = activationMap.get(dealId)?.get(warningId);
    if (activation?.meetsThreshold) count++;
  }
  return count;
}
