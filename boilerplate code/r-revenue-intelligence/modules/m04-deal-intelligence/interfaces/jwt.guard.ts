// src/modules/auth/jwt.guard.ts
// Global JWT guard with @Public() decorator support.
// Registered as APP_GUARD in AppModule — no per-controller @UseGuards needed.

import {
  CanActivate, ExecutionContext, Injectable,
  SetMetadata, UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);

export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly reflector: Reflector,
  ) {}

  canActivate(ctx: ExecutionContext): boolean {
    // Allow routes decorated with @Public()
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);
    if (isPublic) return true;

    const request = ctx.switchToHttp().getRequest();
    const authHeader: string = request.headers?.authorization ?? '';
    let token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

    if (!token && request.query?.token) {
      token = request.query.token as string;
    }

    if (!token) throw new UnauthorizedException('Missing Bearer token');

    try {
      const payload = this.jwtService.verify(token);
      request.user = payload;
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }

    // Role check — if no roles required, pass through
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);
    if (!requiredRoles || requiredRoles.length === 0) return true;

    const userRoles: string[] = request.user?.roles ?? [];
    return requiredRoles.some((r) => userRoles.includes(r));
  }
}
