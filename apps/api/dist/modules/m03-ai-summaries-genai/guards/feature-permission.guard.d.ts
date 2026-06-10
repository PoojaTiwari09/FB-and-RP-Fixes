import { CanActivate, ExecutionContext } from '@nestjs/common';
export declare class FeaturePermissionGuard implements CanActivate {
    canActivate(_context: ExecutionContext): boolean;
}
