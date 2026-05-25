import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Deal } from '@/entities/deal.entity';
import { HubSpotClientService } from './hubspot-client.service';
import { DealSyncService } from './deal-sync.service';
import { HubSpotWebhookDto, WebhookBatchDto } from '@/schemas/webhook.dto';

@Injectable()
export class WebhookService {
  private readonly logger = new Logger(WebhookService.name);

  constructor(
    @InjectRepository(Deal)
    private readonly dealRepository: Repository<Deal>,
    private readonly hubspotClient: HubSpotClientService,
    private readonly dealSyncService: DealSyncService,
  ) {}

  /**
   * Process HubSpot webhook event
   */
  async processWebhook(event: HubSpotWebhookDto): Promise<void> {
    this.logger.log(`Processing webhook event ${event.eventId} for object ${event.objectId}`);

    try {
      // Find deal by HubSpot ID
      const deal = await this.dealRepository.findOne({
        where: { crmDealId: event.objectId },
      });

      if (!deal) {
        this.logger.warn(`Deal not found for HubSpot ID ${event.objectId}, syncing...`);
        // Sync this specific deal
        await this.dealSyncService.syncSingleDeal(event.objectId);
        return;
      }

      // Handle different property changes
      switch (event.propertyName) {
        case 'dealstage':
          await this.handleStageChange(deal, event.propertyValue);
          break;
        case 'amount':
          await this.handleAmountChange(deal, event.propertyValue);
          break;
        case 'closedate':
          await this.handleCloseDateChange(deal, event.propertyValue);
          break;
        case 'dealname':
          await this.handleNameChange(deal, event.propertyValue);
          break;
        default:
          // For other properties, trigger a full sync of this deal
          await this.dealSyncService.syncSingleDeal(event.objectId);
      }

      this.logger.log(`Successfully processed webhook event ${event.eventId}`);
    } catch (error) {
      this.logger.error(`Failed to process webhook event ${event.eventId}:`, error);
      throw error;
    }
  }

  /**
   * Process batch of webhook events
   */
  async processBatch(batch: WebhookBatchDto): Promise<number> {
    let processed = 0;

    for (const event of batch.events) {
      try {
        await this.processWebhook(event);
        processed++;
      } catch (error) {
        this.logger.error(`Failed to process event ${event.eventId}:`, error);
        // Continue processing other events
      }
    }

    return processed;
  }

  /**
   * Handle deal stage change
   */
  private async handleStageChange(deal: Deal, newStage: string): Promise<void> {
    const oldStage = deal.stage;
    deal.stage = newStage as any; // HubSpot stages may not match our enum exactly
    deal.updatedAt = new Date();

    await this.dealRepository.save(deal);

    this.logger.log(`Deal ${deal.id} stage changed from ${oldStage} to ${newStage}`);

    // Trigger any stage-specific actions
    if (newStage.toLowerCase().includes('closed')) {
      // Deal closed - could trigger notifications, analytics updates, etc.
      this.logger.log(`Deal ${deal.id} closed`);
    }
  }

  /**
   * Handle deal amount change
   */
  private async handleAmountChange(deal: Deal, newAmount: string): Promise<void> {
    const oldAmount = deal.amount;
    deal.amount = parseFloat(newAmount) || 0;
    deal.updatedAt = new Date();

    await this.dealRepository.save(deal);

    this.logger.log(`Deal ${deal.id} amount changed from ${oldAmount} to ${newAmount}`);
  }

  /**
   * Handle close date change
   */
  private async handleCloseDateChange(deal: Deal, newCloseDate: string): Promise<void> {
    const oldCloseDate = deal.closeDate;
    deal.closeDate = new Date(newCloseDate);
    deal.updatedAt = new Date();

    await this.dealRepository.save(deal);

    this.logger.log(`Deal ${deal.id} close date changed from ${oldCloseDate} to ${newCloseDate}`);
  }

  /**
   * Handle deal name change
   */
  private async handleNameChange(deal: Deal, newName: string): Promise<void> {
    const oldName = deal.name;
    deal.name = newName;
    deal.updatedAt = new Date();

    await this.dealRepository.save(deal);

    this.logger.log(`Deal ${deal.id} name changed from ${oldName} to ${newName}`);
  }

  /**
   * Verify webhook signature (HubSpot v3 signature verification)
   */
  verifySignature(
    requestBody: string,
    signature: string,
    timestamp: string,
    secret: string,
  ): boolean {
    const crypto = require('crypto');

    // HubSpot signature format: sha256=<hash>
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(timestamp + requestBody)
      .digest('hex');

    const providedSignature = signature.replace('sha256=', '');

    return crypto.timingSafeEqual(
      Buffer.from(expectedSignature),
      Buffer.from(providedSignature),
    );
  }
}
