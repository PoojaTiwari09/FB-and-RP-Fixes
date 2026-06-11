import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../database/prisma.service';
import { permissionsForRole } from './permissions';
import type { JwtPayload } from './auth.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    config: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get<string>('JWT_SECRET', 'local-dev-secret'),
      issuer: config.get<string>('JWT_ISSUER', 'r-revenue-api'),
      audience: config.get<string>('API_AUDIENCE', 'r-revenue-api'),
    });
  }

  async validate(payload: JwtPayload) {
    if (!payload?.sub || !payload?.tenantId) {
      throw new UnauthorizedException('Invalid token payload');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        tenantid: true,
        role: true,
        email: true,
        name: true,
        status: true,
        tenant: { select: { status: true } },
      },
    });

    if (!user || user.status !== 'ACTIVE') {
      throw new UnauthorizedException('User no longer exists or is inactive');
    }
    if (user.tenant.status !== 'ACTIVE') {
      throw new UnauthorizedException('Tenant is not active');
    }

    const permissions =
      Array.isArray(payload.permissions) && payload.permissions.length > 0
        ? payload.permissions
        : permissionsForRole(user.role);

    return {
      sub: user.id,
      id: user.id,
      tenantId: user.tenantid,
      role: user.role,
      email: user.email,
      name: user.name,
      permissions,
    };
  }
}
