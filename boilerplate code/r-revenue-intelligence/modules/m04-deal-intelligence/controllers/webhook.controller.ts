import {
  Controller,
  Post,
  Body,
  Headers,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiHeader,
} from '@nestjs/swagger';
import { WebhookService } from '@/services/webhook.service';
import {
  HubSpotWebhookDto,
  WebhookBatchDto,
  WebhookResponseDto,
} from '@/schemas/webhook.dto';
import { ConfigService } from '@nestjs/config';

@ApiTags('Webhooks')
@Controller('webhooks')
export class WebhookController {
  private readonly logger = new Logger(WebhookController.name);

  constructor(
    private readonly webhookService: WebhookService,
    private readonly configService: ConfigService,
  ) {}

  @Post('hubspot')
  @ApiOperation({
    summary: 'HubSpot webhook endpoint',
    description: 'Receive webhook events from HubSpot',
  })
  @ApiHeader({
    name: 'X-HubSpot-Signature',
    description: 'HubSpot signature for verification',
    required: false,
  })
  @ApiHeader({
    name: 'X-HubSpot-Request-Timestamp',
    description: 'Request timestamp',
    required: false,
  })
  @ApiResponse({
    status: 200,
    description: 'Webhook processed successfully',
    type: WebhookResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid webhook signature or payload',
  })
  async handleHubSpotWebhook(
    @Body() body: any,
    @Headers('x-hubspot-signature') signature?: string,
    @Headers('x-hubspot-request-timestamp') timestamp?: string,
  ): Promise<WebhookResponseDto> {
    this.logger.log('Received HubSpot webhook');

    // Verify signature if configured
    const webhookSecret = this.configService.get<string>('HUBSPOT_WEBHOOK_SECRET');
    if (webhookSecret && signature && timestamp) {
      const isValid = this.webhookService.verifySignature(
        JSON.stringify(body),
        signature,
        timestamp,
        webhookSecret,
      );

      if (!isValid) {
        this.logger.warn('Invalid webhook signature');
        throw new BadRequestException('Invalid webhook signature');
      }
    }

    try {
      let processedCount = 0;

      // Handle single event or batch
      if (Array.isArray(body)) {
        // Batch of events
        processedCount = await this.webhookService.processBatch({ events: body });
      } else if (body.objectId) {
        // Single event
        await this.webhookService.processWebhook(body as HubSpotWebhookDto);
        processedCount = 1;
      } else {
        throw new BadRequestException('Invalid webhook payload');
      }

      return {
        success: true,
        message: 'Webhook processed successfully',
        processedCount,
      };
    } catch (error) {
      this.logger.error('Failed to process webhook:', error);
      throw error;
    }
  }

  @Post('hubspot/test')
  @ApiOperation({
    summary: 'Test HubSpot webhook',
    description: 'Test endpoint for HubSpot webhook integration',
  })
  @ApiResponse({
    status: 200,
    description: 'Test webhook received',
  })
  async testWebhook(@Body() body: any): Promise<{ message: string; received: any }> {
    this.logger.log('Received test webhook:', JSON.stringify(body));

    return {
      message: 'Test webhook received successfully',
      received: body,
    };
  }
}
