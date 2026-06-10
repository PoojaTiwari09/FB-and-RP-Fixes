import { M04EntityRepository as Repository } from '@/database/m04-entity.repository';
import { Deal } from '@/entities/deal.entity';
import { HubSpotClientService } from './hubspot-client.service';
import { DealSyncService } from './deal-sync.service';
import { HubSpotWebhookDto, WebhookBatchDto } from '@/schemas/webhook.dto';
export declare class WebhookService {
    private readonly dealRepository;
    private readonly hubspotClient;
    private readonly dealSyncService;
    private readonly logger;
    constructor(dealRepository: Repository<Deal>, hubspotClient: HubSpotClientService, dealSyncService: DealSyncService);
    processWebhook(event: HubSpotWebhookDto): Promise<void>;
    processBatch(batch: WebhookBatchDto): Promise<number>;
    private handleStageChange;
    private handleAmountChange;
    private handleCloseDateChange;
    private handleNameChange;
    verifySignature(requestBody: string, signature: string, timestamp: string, secret: string): boolean;
}
