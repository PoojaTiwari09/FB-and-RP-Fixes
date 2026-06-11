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

    const allowDevHeaders = process.env.ALLOW_DEV_HEADER_AUTH === 'true';
    if (allowDevHeaders) {
      const request = context.switchToHttp().getRequest();
      const tenantIdHeader =
        request.headers?.['x-tenant-id'] ||
        request.headers?.['X-Tenant-ID'] ||
        request.headers?.['tenant-id'];
      if (tenantIdHeader) {
        const userId =
          request.headers?.['x-user-id'] || '00000000-0000-0000-0000-000000000002';
        const role = request.headers?.['x-user-role'] || 'MANAGER';
        const email = request.headers?.['x-user-email'] || 'dev@company.com';
        const name = request.headers?.['x-user-name'] || 'Dev User';

        const permissions = this.permissionsForRole(role);
        request.user = {
          sub: userId,
          id: userId,
          tenantId: tenantIdHeader,
          role,
          email,
          name,
          permissions,
        };
        return true;
      }
    }

    return super.canActivate(context);
  }

  private permissionsForRole(role: string): string[] {
    if (role === 'ADMIN' || role === 'sales_manager' || role === 'MANAGER') {
      return [
        'task.view', 'task.create', 'task.update', 'task.assign',
        'opportunity.view', 'opportunity.create', 'opportunity.update',
        'customer.view', 'customer.create', 'customer.update',
        'report.view', 'report.export', 'user.view', 'user.invite',
        'ai.query', 'ai.report',
      ];
    }
    if (role === 'ANALYST') {
      return ['report.view', 'report.export', 'ai.query', 'ai.report'];
    }
    return [
      'task.view', 'task.create', 'task.update',
      'opportunity.view', 'opportunity.create', 'opportunity.update',
      'customer.view', 'customer.create', 'customer.update', 'ai.query',
    ];
  }
}
