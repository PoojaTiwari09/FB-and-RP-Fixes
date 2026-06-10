export type AccountOwnershipRow = {
    assigned_rep_id?: string | null;
    hubspot_owner_id?: string | null;
    owner_user_id?: string | null;
};
export declare function getCanonicalAssignedRepId(row: AccountOwnershipRow): string | null;
export declare function assignedRepIdForHubSpotUpsert(existingAssignedRepId: string | null | undefined, hubspotOwnerId: string | null | undefined): string | null;
export declare function getHubspotOwnerId(row: AccountOwnershipRow): string | null;
export declare function getOwnerUserId(row: AccountOwnershipRow): string | null;
