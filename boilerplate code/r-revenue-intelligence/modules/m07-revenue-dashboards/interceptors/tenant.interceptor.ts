import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from "@nestjs/common";
import { Observable } from "rxjs";

@Injectable()
export class TenantInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest();
    if (request.user) {
      request.tenantContext = {
        tenantId: request.user.tenantId,
        userId: request.user.sub,
        role: request.user.role,
      };
    }
    return next.handle();
  }
}
