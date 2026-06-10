"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TraceAndTenantMiddleware = TraceAndTenantMiddleware;
function TraceAndTenantMiddleware(req, res, next) {
    const traceId = req.headers['x-trace-id'] ||
        req.headers['trace-id'] ||
        `trace_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    const tenantId = req.headers['x-tenant-id'] ||
        req.headers['X-Tenant-ID'] ||
        req.headers['tenant-id'] ||
        'default_tenant';
    req.traceId = traceId;
    req.tenantId = tenantId;
    res.setHeader('x-trace-id', traceId);
    res.setHeader('x-tenant-id', tenantId);
    next();
}
//# sourceMappingURL=trace-tenant.middleware.js.map