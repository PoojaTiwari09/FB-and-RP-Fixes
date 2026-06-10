import { CanActivate, ExecutionContext } from '@nestjs/common';
export declare class HmacWebhookGuard implements CanActivate {
    private readonly logger;
    canActivate(context: ExecutionContext): boolean;
}
