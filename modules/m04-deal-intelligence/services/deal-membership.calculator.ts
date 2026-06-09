// src/modules/deal-drivers/deal-membership.calculator.ts
// Determines which deals qualify for each rep's denominator.
//
// Rule: A deal qualifies for rep R in window W if:
//   (a) The deal was opened BEFORE the window start (already established) — auto-qualifies, OR
//   (b) The deal was opened WITHIN the window and rep R owned it for ≥ 24 cumulative hours
//       within W.  Ownership window is [openedAt, closedAt|window.end].
//
// FIX TC-G06: The 24h minimum-ownership check was being applied to deals that
// predated the window (openedAt < window.start). Those deals are already
// established and always qualify — only newly-opened deals (within the window)
// need to pass the 24h threshold to exclude same-day flash deals.

import { intervalOverlapMs, msToHours } from './period.util';
import { RepDealSet } from '../entities/deal-drivers.entities';

const MIN_OWNERSHIP_HOURS = 24;

interface RawDealRow {
  repId:       string;
  dealId:      string;
  openedAt:    Date;
  closedAt:    Date | null;
  accountName: string;
  amount:      number | bigint;
  currency:    string;
  crmStage:    string;
  closeDate:   Date;
}

/**
 * Given raw deal rows (may include current owner AND previous owners from
 * the reassignment join), compute each rep's qualifying deal set.
 *
 * Same deal may appear under multiple reps (each evaluated independently).
 * Duplicate rows for the same rep × deal are deduplicated.
 */
export function computeRepDealSets(
  rawDeals: RawDealRow[],
  window: { start: Date; end: Date },
): Map<string, RepDealSet> {
  const result = new Map<string, RepDealSet>();

  for (const row of rawDeals) {
    const { repId, dealId, openedAt, closedAt } = row;
    const ownershipEnd = closedAt ?? window.end;

    // Deals closed entirely before the window have zero overlap — skip.
    if (ownershipEnd <= window.start) continue;

    // FIX TC-G06: If the deal was opened before the window start, it is an
    // already-established deal and always qualifies (no 24h check needed).
    // The 24h ownership check only applies to deals opened inside the window,
    // to exclude flash deals that were opened and closed in < 24h.
    const openedBeforeWindow = openedAt < window.start;
    if (!openedBeforeWindow) {
      const overlapMs = intervalOverlapMs(
        openedAt, ownershipEnd,
        window.start, window.end,
      );
      if (msToHours(overlapMs) < MIN_OWNERSHIP_HOURS) continue;
    }

    if (!result.has(repId)) {
      result.set(repId, { repId, qualifyingDealIds: [], dealCount: 0 });
    }
    const repSet = result.get(repId)!;
    if (!repSet.qualifyingDealIds.includes(dealId)) {
      repSet.qualifyingDealIds.push(dealId);
      repSet.dealCount++;
    }
  }

  return result;
}
