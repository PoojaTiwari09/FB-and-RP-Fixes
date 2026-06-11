"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BACKEND_TO_FRONTEND = exports.FRONTEND_TO_BACKEND = void 0;
exports.toBackendRole = toBackendRole;
exports.toFrontendRole = toFrontendRole;
exports.isFrontendRole = isFrontendRole;
exports.frontendRoleFromInput = frontendRoleFromInput;
const FRONTEND_TO_BACKEND = {
    sales_rep: 'SALES_REP',
    sales_manager: 'MANAGER',
};
exports.FRONTEND_TO_BACKEND = FRONTEND_TO_BACKEND;
const BACKEND_TO_FRONTEND = {
    SALES_REP: 'sales_rep',
    MANAGER: 'sales_manager',
};
exports.BACKEND_TO_FRONTEND = BACKEND_TO_FRONTEND;
function toBackendRole(input) {
    const normalized = input.trim().toLowerCase();
    if (normalized === 'sales_rep' || normalized === 'salesrep' || normalized === 'rep') {
        return 'SALES_REP';
    }
    if (normalized === 'sales_manager' ||
        normalized === 'salesmanager' ||
        normalized === 'manager') {
        return 'MANAGER';
    }
    const upper = input.trim().toUpperCase();
    if (['ADMIN', 'MANAGER', 'SALES_REP', 'ANALYST', 'EXECUTIVE'].includes(upper)) {
        return upper;
    }
    return 'SALES_REP';
}
function toFrontendRole(role) {
    return BACKEND_TO_FRONTEND[role] ?? 'sales_rep';
}
function isFrontendRole(value) {
    return value === 'sales_rep' || value === 'sales_manager';
}
function frontendRoleFromInput(input) {
    if (isFrontendRole(input))
        return input;
    return toFrontendRole(toBackendRole(input));
}
//# sourceMappingURL=role-mapper.js.map