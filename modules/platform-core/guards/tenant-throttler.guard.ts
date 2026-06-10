import { Injectable, ExecutionContext } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

@Injectable()
export class TenantThrottlerGuard extends ThrottlerGuard {
  protected async getTracker(req: Record<string, any>): Promise<string> {
    // Track requests by tenantId (from context or headers), falling back to client IP
    return req.tenantId || req.headers?.['x-tenant-id'] || req.headers?.['X-Tenant-ID'] || req.ip;
  }
}

