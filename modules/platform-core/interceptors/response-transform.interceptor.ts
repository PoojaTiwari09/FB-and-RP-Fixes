import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class ResponseTransformInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const ctx = context.switchToHttp();
    const req = ctx.getRequest();

    return next.handle().pipe(
      map((data) => {
        // Bypass formatting if the response is already in the success format
        if (data && typeof data === 'object' && 'success' in data && 'data' in data) {
          return data;
        }

        // Avoid wrapping standard NestJS/Express redirected or streaming responses if they handle it themselves
        const res = ctx.getResponse();
        if (res.headersSent) {
          return data;
        }

        // Bypass response wrapping for manager/frontend API routes
        const url = req.url || '';
        if (url.includes('/api/manager/')) {
          return data;
        }

        const requestId =
          req.headers['x-request-id'] ||
          req.headers['x-trace-id'] ||
          req.headers['trace-id'] ||
          `req_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;

        return {
          success: true,
          data: data ?? null,
          meta: {
            requestId,
            timestamp: new Date().toISOString(),
          },
        };
      }),
    );
  }
}
