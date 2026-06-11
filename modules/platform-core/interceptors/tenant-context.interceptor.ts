import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tenantContext } from '../database/prisma.extension';

@Injectable()
export class TenantContextInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    // We can pull tenantId from req.user (JWT) or headers (for internal bypass)
    const allowDevHeaders = process.env.ALLOW_DEV_HEADER_AUTH === 'true';
    const tenantId =
      request.user?.tenantId ||
      (allowDevHeaders ? request.headers['x-tenant-id'] || request.headers['tenant-id'] : undefined);
    
    if (tenantId) {
      return new Observable((subscriber) => {
        tenantContext.run(tenantId, () => {
          next.handle().subscribe(subscriber);
        });
      });
    }
    
    return next.handle();
  }
}
