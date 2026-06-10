import { Strategy } from "passport-jwt";
import { PrismaService } from "../database/prisma.service";
declare const JwtStrategy_base: new (...args: any[]) => Strategy;
export declare class JwtStrategy extends JwtStrategy_base {
    private readonly prisma;
    constructor(prisma: PrismaService);
    validate(payload: {
        sub: string;
        tenantId: string;
    }): Promise<{
        sub: string;
        tenantId: string;
        role: import("@rri/database").$Enums.UserRole;
        email: string;
        name: string;
    }>;
}
export {};
