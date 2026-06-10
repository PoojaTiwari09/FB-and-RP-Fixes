"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCanonicalAssignedRepId = getCanonicalAssignedRepId;
exports.assignedRepIdForHubSpotUpsert = assignedRepIdForHubSpotUpsert;
exports.getHubspotOwnerId = getHubspotOwnerId;
exports.getOwnerUserId = getOwnerUserId;
function getCanonicalAssignedRepId(row) {
    return row.assigned_rep_id?.trim() || null;
}
function assignedRepIdForHubSpotUpsert(existingAssignedRepId, hubspotOwnerId) {
    if (existingAssignedRepId?.trim()) {
        return existingAssignedRepId.trim();
    }
    return hubspotOwnerId?.trim() || null;
}
function getHubspotOwnerId(row) {
    return row.hubspot_owner_id?.trim() || null;
}
function getOwnerUserId(row) {
    return row.owner_user_id?.trim() || null;
}
//# sourceMappingURL=account-ownership.js.map