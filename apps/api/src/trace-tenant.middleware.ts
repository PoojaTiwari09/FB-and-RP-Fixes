import { Request, Response, NextFunction } from 'express';

export function TraceAndTenantMiddleware(req: Request, res: Response, next: NextFunction) {
  const traceId =
    req.headers['x-trace-id'] ||
    req.headers['trace-id'] ||
    `trace_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  
  const tenantId =
    req.headers['x-tenant-id'] ||
    req.headers['X-Tenant-ID'] ||
    req.headers['tenant-id'] ||
    'default_tenant';

  // Inject properties into request object
  (req as any).traceId = traceId;
  (req as any).tenantId = tenantId;

  // Append response headers for traceability
  res.setHeader('x-trace-id', traceId);
  res.setHeader('x-tenant-id', tenantId);

  next();
}
