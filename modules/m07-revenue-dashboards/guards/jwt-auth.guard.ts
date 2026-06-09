import { ExecutionContext, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { AuthGuard } from "@nestjs/passport";
import { IS_PUBLIC_KEY } from "../decorators/public.decorator";

@Injectable()
export class JwtAuthGuard extends AuthGuard("jwt") {
  constructor(private readonly reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    if (process.env.M07_STANDALONE_AUTH === 'true') {
      const req = context.switchToHttp().getRequest();
      const tenantId =
        (req.headers['x-tenant-id'] as string) ||
        (req.headers['x-org-id'] as string) ||
        '11111111-1111-1111-1111-111111111111';
      const userId =
        (req.headers['x-user-id'] as string) ||
        '22222222-2222-2222-2222-222222222222';
      const role = (req.headers['x-role'] as string) || 'ADMIN';
      req.user = {
        sub: userId,
        tenantId,
        role,
        email: (req.headers['x-email'] as string) || 'admin@revenue.ai',
        name: 'Dev User',
      };
      return true;
    }

    return super.canActivate(context);
  }
}
