/**
 * Canonical account ownership field semantics (M05).
 *
 * | Prisma / DB field      | Purpose |
 * |------------------------|---------|
 * | assignedRepId          | Canonical rep for boards, filters, API `assigned_rep.id` |
 * | hubspotOwnerId         | CRM-only HubSpot owner object id (sync/webhook writes) |
 * | ownerUserId            | Platform User.id (M01 auth); not set by HubSpot sync |
 */

export type AccountOwnershipRow = {
  assigned_rep_id?: string | null;
  hubspot_owner_id?: string | null;
  owner_user_id?: string | null;
};

/** Rep id used for filtering and API responses — never derived from hubspotOwnerId at read time. */
export function getCanonicalAssignedRepId(row: AccountOwnershipRow): string | null {
  return row.assigned_rep_id?.trim() || null;
}

/**
 * On HubSpot sync, populate assigned_rep_id when empty so boards remain filterable.
 * Does not overwrite an existing assigned_rep_id.
 */
export function assignedRepIdForHubSpotUpsert(
  existingAssignedRepId: string | null | undefined,
  hubspotOwnerId: string | null | undefined,
): string | null {
  if (existingAssignedRepId?.trim()) {
    return existingAssignedRepId.trim();
  }
  return hubspotOwnerId?.trim() || null;
}

export function getHubspotOwnerId(row: AccountOwnershipRow): string | null {
  return row.hubspot_owner_id?.trim() || null;
}

export function getOwnerUserId(row: AccountOwnershipRow): string | null {
  return row.owner_user_id?.trim() || null;
}
