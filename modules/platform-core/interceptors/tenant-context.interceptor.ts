import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tenantContext } from '../database/prisma.extension';

@Injectable()
export class TenantContextInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    // We can pull tenantId from req.user (JWT) or headers (for internal bypass)
    const tenantId = request.user?.tenantId || request.headers['x-tenant-id'] || request.headers['tenant-id'];
    
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
