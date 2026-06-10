import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { PrismaService } from "../database/prisma.service";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || "local-dev-secret",
    });
  }

  async validate(payload: { sub: string; tenantId: string; permissions?: string[] }) {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, tenantid: true, role: true, email: true, name: true },
    });
    if (!user) throw new UnauthorizedException("User no longer exists");

    let permissions = payload.permissions;
    if (!permissions || !Array.isArray(permissions)) {
      const role = user.role;
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
      } else {
        permissions = [];
      }
    }

    return {
      sub: user.id,
      tenantId: user.tenantid,
      role: user.role,
      email: user.email,
      name: user.name,
      permissions,
    };
  }
}
