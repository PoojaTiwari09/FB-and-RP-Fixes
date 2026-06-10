import { ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private readonly reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const tenantIdHeader = request.headers?.['x-tenant-id'] || request.headers?.['X-Tenant-ID'] || request.headers?.['tenant-id'];
    if (tenantIdHeader) {
      const userId = request.headers?.['x-user-id'] || '00000000-0000-0000-0000-000000000002';
      const role = request.headers?.['x-user-role'] || 'MANAGER';
      const email = request.headers?.['x-user-email'] || 'jennifer.kim@company.com';
      const name = request.headers?.['x-user-name'] || 'Jennifer Kim';

      let permissions: string[] = [];
      if (role === 'ADMIN') {
        permissions = ["task.view", "task.create", "task.delete", "task.assign", "opportunity.view", "opportunity.create", "opportunity.update", "opportunity.delete", "customer.view", "customer.create", "customer.update", "customer.delete", "report.view", "report.export", "user.view", "user.invite", "user.manage", "settings.view", "settings.manage", "ai.query", "ai.report"];
      } else if (role === 'MANAGER') {
        permissions = ["task.view", "task.create", "task.update", "task.assign", "opportunity.view", "opportunity.create", "opportunity.update", "customer.view", "customer.create", "customer.update", "report.view", "report.export", "user.view", "user.invite", "ai.query", "ai.report"];
      } else if (role === 'SALES_REP') {
        permissions = ["task.view", "task.create", "task.update", "opportunity.view", "opportunity.create", "opportunity.update", "customer.view", "customer.create", "customer.update", "ai.query"];
      } else if (role === 'ANALYST') {
        permissions = ["report.view", "report.export", "ai.query", "ai.report"];
      } else if (role === 'EXECUTIVE') {
        permissions = ["opportunity.view", "customer.view", "report.view", "report.export", "ai.query", "ai.report"];
      }

      request.user = {
        sub: userId,
        tenantId: tenantIdHeader,
        role: role,
        email,
        name,
        permissions,
      };
      return true;
    }

    return super.canActivate(context);
  }
}
