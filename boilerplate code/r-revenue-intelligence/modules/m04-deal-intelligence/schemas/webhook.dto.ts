import { IsString, IsNumber, IsArray, IsObject, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class HubSpotWebhookDto {
  @ApiProperty({
    description: 'Object ID',
    example: '12345678',
  })
  @IsString()
  objectId: string;

  @ApiProperty({
    description: 'Property name',
    example: 'dealstage',
  })
  @IsString()
  propertyName: string;

  @ApiProperty({
    description: 'Property value',
    example: 'closedwon',
  })
  @IsString()
  propertyValue: string;

  @ApiProperty({
    description: 'Change source',
    example: 'CRM',
  })
  @IsString()
  changeSource: string;

  @ApiProperty({
    description: 'Event ID',
    example: '123456789',
  })
  @IsNumber()
  eventId: number;

  @ApiProperty({
    description: 'Subscription ID',
    example: '987654',
  })
  @IsNumber()
  subscriptionId: number;

  @ApiProperty({
    description: 'Portal ID',
    example: '12345',
  })
  @IsNumber()
  portalId: number;

  @ApiProperty({
    description: 'Occurred at timestamp',
    example: 1642234567890,
  })
  @IsNumber()
  occurredAt: number;
}

export class WebhookBatchDto {
  @ApiProperty({
    description: 'Webhook events',
    type: [HubSpotWebhookDto],
  })
  @IsArray()
  events: HubSpotWebhookDto[];
}

export class WebhookResponseDto {
  @ApiProperty({
    description: 'Success status',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: 'Message',
    example: 'Webhook processed successfully',
  })
  message: string;

  @ApiProperty({
    description: 'Processed events count',
    example: 5,
  })
  processedCount: number;
}

export class WebhookSubscriptionDto {
  @ApiProperty({
    description: 'Subscription ID',
    example: '987654',
  })
  id: string;

  @ApiProperty({
    description: 'Event type',
    example: 'deal.propertyChange',
  })
  eventType: string;

  @ApiProperty({
    description: 'Property name (for property change events)',
    example: 'dealstage',
  })
  propertyName?: string;

  @ApiProperty({
    description: 'Active status',
    example: true,
  })
  active: boolean;

  @ApiProperty({
    description: 'Created at timestamp',
    example: '2024-01-15T10:30:00Z',
  })
  createdAt: Date;
}
