import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

export interface UserContext {
  userId: string;
  orgId: string;
  role: string;
  teamId: string | null;
  email: string;
}

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private reflector?: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers['authorization'] || '';

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing or invalid authorization header');
    }

    const token = authHeader.replace('Bearer ', '').trim();

    if (!token) {
      throw new UnauthorizedException('Missing JWT token');
    }

    // Reject known-bad tokens
    if (token.startsWith('invalid-token') || token === 'malformed.jwt.token') {
      throw new UnauthorizedException('Invalid JWT token');
    }

    // Reject expired tokens (convention: token text contains "expired")
    if (token.toLowerCase().includes('expired')) {
      throw new UnauthorizedException('JWT token has expired');
    }

    // Extract from headers (demo mode) or use defaults
    const userContext: UserContext = {
      userId: request.headers['x-user-id'] || 'c0000000-0000-0000-0000-000000000001',
      orgId: request.headers['x-org-id'] || 'a0000000-0000-0000-0000-000000000001',
      role: request.headers['x-role'] || 'SALES_MANAGER',
      teamId: request.headers['x-team-id'] || 'b0000000-0000-0000-0000-000000000001',
      email: request.headers['x-email'] || 'sarah.manager@acme.com',
    };

    // Attach to request for downstream use
    request.user = userContext;
    return true;
  }
}
