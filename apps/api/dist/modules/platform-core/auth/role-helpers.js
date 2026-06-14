"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isSalesRepRole = isSalesRepRole;
exports.repOwnerFilter = repOwnerFilter;
exports.isManagerRole = isManagerRole;
function isSalesRepRole(role) {
    if (!role)
        return false;
    const n = role.trim().toLowerCase();
    return n === 'sales_rep' || n === 'rep' || n === 'salesrep';
}
function repOwnerFilter(ownerField, userId, userName) {
    if (!userId && !userName)
        return null;
    if (userId && userName) {
        return { OR: [{ [ownerField]: userId }, { [ownerField]: userName }] };
    }
    return { [ownerField]: userId ?? userName };
}
function isManagerRole(role) {
    if (!role)
        return false;
    const n = role.trim().toLowerCase();
    return (n === 'manager' ||
        n === 'sales_manager' ||
        n === 'salesmanager' ||
        n === 'admin');
}
//# sourceMappingURL=role-helpers.js.map