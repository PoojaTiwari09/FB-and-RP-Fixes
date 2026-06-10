"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.M03_LEGACY_ORG = exports.M03_DEMO_TENANT = void 0;
exports.resolveM03TenantId = resolveM03TenantId;
exports.M03_DEMO_TENANT = '00000000-0000-0000-0000-000000000001';
exports.M03_LEGACY_ORG = 'a0000000-0000-0000-0000-000000000001';
function resolveM03TenantId(orgOrTenantId) {
    if (!orgOrTenantId)
        return exports.M03_DEMO_TENANT;
    if (orgOrTenantId === exports.M03_LEGACY_ORG)
        return exports.M03_DEMO_TENANT;
    return orgOrTenantId;
}
//# sourceMappingURL=m03-tenant.util.js.map