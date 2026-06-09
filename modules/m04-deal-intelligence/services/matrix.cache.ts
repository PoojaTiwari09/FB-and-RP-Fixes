// src/modules/deal-drivers/matrix.cache.ts
// US-35: In-memory TTL cache for the Deal Drivers matrix.
// Uses Node's built-in Map — no external packages required.

import { Injectable } from '@nestjs/common';
import { DealDriversMatrix, Period } from '../entities/deal-drivers.entities';

// TTL in milliseconds per period
const TTL_MS: Record<Period, number> = {
  [Period.NOW]:          5  * 60 * 1000,  // 5 minutes
  [Period.LAST_30_DAYS]: 30 * 60 * 1000,  // 30 minutes
  [Period.LAST_90_DAYS]: 30 * 60 * 1000,  // 30 minutes
};

interface CacheEntry {
  data:      DealDriversMatrix;
  expiresAt: number;  // Date.now() + ttl
}

@Injectable()
export class MatrixCache {
  private store = new Map<string, CacheEntry>();

  /** Build canonical cache key */
  key(managerId: string, boardId: string, period: Period): string {
    return `${managerId}:${boardId}:${period}`;
  }

  /** Returns cached matrix or null if missing/expired. */
  get(key: string): DealDriversMatrix | null {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return entry.data;
  }

  /** Store a matrix under the given key with TTL derived from period. */
  set(key: string, data: DealDriversMatrix, period: Period): void {
    const ttl = TTL_MS[period] ?? TTL_MS[Period.NOW];
    this.store.set(key, { data, expiresAt: Date.now() + ttl });
  }

  /**
   * Invalidate all cache entries that contain the given boardId.
   * Called after any warning event write so the next matrix read is fresh.
   */
  invalidateByBoard(boardId: string): void {
    for (const key of this.store.keys()) {
      if (key.includes(boardId)) this.store.delete(key);
    }
  }
}
