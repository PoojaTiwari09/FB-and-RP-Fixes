import {
  ConflictException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { createHash, randomBytes } from 'crypto';
import type { User, UserRole } from '@rri/database';
import { PrismaService } from '../database/prisma.service';
import { permissionsForRole } from './permissions';
import { toBackendRole, toFrontendRole } from './role-mapper';

export interface JwtPayload {
  sub: string;
  tenantId: string;
  role: UserRole;
  permissions: string[];
  email: string;
  name: string;
  iss: string;
  aud: string;
}

export interface AuthUserResponse {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  frontendRole: 'sales_rep' | 'sales_manager';
  tenantId: string;
  tenantSlug: string;
  permissions: string[];
}

export interface AuthTokenResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: 'Bearer';
  user: AuthUserResponse;
}

@Injectable()
export class AuthService {
  private readonly issuer: string;
  private readonly audience: string;
  private readonly accessTtlSeconds: number;
  private readonly refreshTtlDays: number;

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {
    this.issuer = this.config.get<string>('JWT_ISSUER', 'r-revenue-api');
    this.audience = this.config.get<string>('API_AUDIENCE', 'r-revenue-api');
    const ttlRaw =
      this.config.get<string>('JWT_ACCESS_TTL_SECONDS') ??
      this.config.get<string>('JWT_EXPIRES_IN', '600');
    this.accessTtlSeconds = /^\d+$/.test(ttlRaw)
      ? parseInt(ttlRaw, 10)
      : 86400;
    this.refreshTtlDays = parseInt(
      this.config.get<string>('JWT_REFRESH_TTL_DAYS', '7'),
      10,
    );
  }

  async register(input: {
    tenantName: string;
    tenantSlug: string;
    name: string;
    email: string;
    password: string;
    role?: string;
  }): Promise<AuthTokenResponse> {
    const email = input.email.trim().toLowerCase();
    const slug = input.tenantSlug.trim().toLowerCase();
    const role = toBackendRole(input.role ?? 'ADMIN');

    if (role === 'ADMIN') {
      const existingTenant = await this.prisma.tenant.findUnique({ where: { slug } });
      if (existingTenant) {
        throw new ConflictException('Tenant slug already exists');
      }
    }

    const passwordHash = await bcrypt.hash(input.password, 10);

    const tenant = await this.prisma.tenant.upsert({
      where: { slug },
      update: {},
      create: {
        name: input.tenantName,
        slug,
        status: 'ACTIVE',
      },
    });

    const existingUser = await this.prisma.user.findUnique({
      where: { tenantid_email: { tenantid: tenant.id, email } },
    });
    if (existingUser) {
      throw new ConflictException('User with this email already exists in this tenant');
    }

    const user = await this.prisma.user.create({
      data: {
        tenantid: tenant.id,
        email,
        name: input.name.trim(),
        passwordHash,
        role,
        status: 'ACTIVE',
      },
      include: { tenant: true },
    });

    return this.issueTokens(user, user.tenant.slug);
  }

  async login(input: {
    email: string;
    password: string;
    tenantSlug: string;
  }): Promise<AuthTokenResponse> {
    const email = input.email.trim().toLowerCase();
    const slug = input.tenantSlug.trim().toLowerCase();

    const tenant = await this.prisma.tenant.findUnique({ where: { slug } });
    if (!tenant) {
      throw new UnauthorizedException('Invalid email or password');
    }
    this.assertTenantActive(tenant.status);

    const user = await this.prisma.user.findUnique({
      where: { tenantid_email: { tenantid: tenant.id, email } },
      include: { tenant: true },
    });

    if (!user || user.status !== 'ACTIVE') {
      throw new UnauthorizedException('Invalid email or password');
    }

    const valid = await bcrypt.compare(input.password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    return this.issueTokens(user, tenant.slug);
  }

  async refresh(refreshToken: string): Promise<AuthTokenResponse> {
    const tokenHash = this.hashToken(refreshToken);
    const stored = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: { user: { include: { tenant: true } } },
    });

    if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    this.assertTenantActive(stored.user.tenant.status);
    if (stored.user.status !== 'ACTIVE') {
      throw new UnauthorizedException('User account is not active');
    }

    await this.prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revokedAt: new Date() },
    });

    return this.issueTokens(stored.user, stored.user.tenant.slug);
  }

  async logout(refreshToken: string, userId: string): Promise<void> {
    const tokenHash = this.hashToken(refreshToken);
    await this.prisma.refreshToken.updateMany({
      where: { tokenHash, userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async logoutAll(userId: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async getProfile(userId: string): Promise<AuthUserResponse> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { tenant: true },
    });
    if (!user || user.status !== 'ACTIVE') {
      throw new UnauthorizedException('User not found');
    }
    this.assertTenantActive(user.tenant.status);
    return this.toUserResponse(user, user.tenant.slug);
  }

  private async issueTokens(
    user: User & { tenant?: { slug: string; status: string } },
    tenantSlug: string,
  ): Promise<AuthTokenResponse> {
    const permissions = permissionsForRole(user.role);
    const payload = {
      sub: user.id,
      tenantId: user.tenantid,
      role: user.role,
      permissions,
      email: user.email,
      name: user.name,
    };

    const accessToken = this.jwt.sign(payload);
    const refreshToken = randomBytes(48).toString('base64url');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + this.refreshTtlDays);

    await this.prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: this.hashToken(refreshToken),
        expiresAt,
      },
    });

    return {
      accessToken,
      refreshToken,
      expiresIn: this.accessTtlSeconds,
      tokenType: 'Bearer',
      user: this.toUserResponse(user, tenantSlug, permissions),
    };
  }

  private toUserResponse(
    user: User,
    tenantSlug: string,
    permissions?: string[],
  ): AuthUserResponse {
    const perms = permissions ?? permissionsForRole(user.role);
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      frontendRole: toFrontendRole(user.role),
      tenantId: user.tenantid,
      tenantSlug,
      permissions: perms,
    };
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private assertTenantActive(status: string): void {
    if (status !== 'ACTIVE') {
      throw new ForbiddenException('Tenant is not active');
    }
  }
}
