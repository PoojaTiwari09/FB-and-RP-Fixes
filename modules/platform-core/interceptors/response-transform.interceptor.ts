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
        const requestId =
          req.headers['x-request-id'] ||
          req.headers['x-trace-id'] ||
          req.headers['trace-id'] ||
          `req_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
          
        const timestamp = new Date().toISOString();

        // Avoid wrapping standard NestJS/Express redirected or streaming responses if they handle it themselves
        const res = ctx.getResponse();
        if (res.headersSent) {
          return data;
        }

        // Bypass formatting if the response is already in the success format, but ensure meta is populated
        if (data && typeof data === 'object' && 'success' in data && 'data' in data) {
          return {
            ...data,
            meta: {
              ...data.meta,
              requestId: data.meta?.requestId || requestId,
              timestamp: data.meta?.timestamp || timestamp,
            }
          };
        }

        return {
          success: true,
          data: data ?? null,
          meta: {
            requestId,
            timestamp,
          },
        };
      }),
    );
  }
}
