import { WebhookService } from '@/services/webhook.service';
import { WebhookResponseDto } from '@/schemas/webhook.dto';
import { ConfigService } from '@nestjs/config';
export declare class WebhookController {
    private readonly webhookService;
    private readonly configService;
    private readonly logger;
    constructor(webhookService: WebhookService, configService: ConfigService);
    handleHubSpotWebhook(body: any, signature?: string, timestamp?: string): Promise<WebhookResponseDto>;
    testWebhook(body: any): Promise<{
        message: string;
        received: any;
    }>;
}
