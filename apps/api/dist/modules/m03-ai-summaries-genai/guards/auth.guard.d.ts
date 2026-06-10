import { CanActivate, ExecutionContext } from '@nestjs/common';
export interface UserContext {
    userId: string;
    orgId: string;
    role: string;
    teamId: string | null;
    email: string;
}
export declare class AuthGuard implements CanActivate {
    canActivate(context: ExecutionContext): boolean;
}
