import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import { TenantGuard } from '../../platform-core/guards/tenant.guard';
import { TopicManagementService } from '../services/topic-management.service';
import { TopicDefinition } from '../repositories/topic.repository';

/**
 * Topic taxonomy CRUD — manage the per-tenant set of topics that the AI tagger uses.
 *
 * `TenantGuard` is enforced at the class level. All input tenant fields are
 * overridden with the guard-verified `req.tenantId` so a client cannot read or
 * write into another tenant by submitting a different body value.
 */
@Controller('api/v1/m02-conversation-intelligence/topics')
@UseGuards(TenantGuard)
export class TopicManagementController {
  constructor(private readonly topicManagementService: TopicManagementService) {}

  @Post()
  async createTopicModel(
    @Req() req: Record<string, any>,
    @Body('topics') topics: TopicDefinition[],
    @Body('type') type?: string,
  ) {
    return this.topicManagementService.createTopicModel(req.tenantId, topics, type);
  }

  @Get()
  async getTopicModels(@Req() req: Record<string, any>) {
    return this.topicManagementService.getTopicModels(req.tenantId);
  }

  @Delete(':id')
  async deleteTopicModel(@Param('id') id: string) {
    return this.topicManagementService.deleteTopicModel(id);
  }

  @Post('topics')
  async addTopicToModel(@Req() req: Record<string, any>, @Body() body: any) {
    return this.topicManagementService.addTopicToModel(req.tenantId, body);
  }

  @Delete('remove')
  async removeTopic(
    @Req() req: Record<string, any>,
    @Body('topicName') topicName: string,
  ) {
    return this.topicManagementService.removeTopicFromModel(req.tenantId, topicName);
  }

  @Post('seed')
  async seedDefaultTopics(@Req() req: Record<string, any>) {
    const defaultTopics: TopicDefinition[] = [
      { name: 'pricing', description: 'Discussions about pricing, costs, discounts, or payment terms' },
      { name: 'sales objection', description: 'Customer objections or concerns about the product/service' },
      { name: 'promotions and discounts', description: 'Special offers, promotions, or discount discussions' },
      { name: 'CRM solutions', description: 'CRM software, tools, or integration discussions' },
      { name: 'ROI', description: 'Return on investment calculations or value discussions' },
      { name: 'Salesforce solutions', description: 'Salesforce-specific features, integrations, or comparisons' },
      { name: 'Data security', description: 'Security, compliance, GDPR, or data protection discussions' },
      { name: 'customer complaint', description: 'Customer complaints, issues, or negative feedback' },
    ];

    const existingModels = await this.topicManagementService.getTopicModels(req.tenantId);
    if (existingModels.length > 0) {
      return { message: 'Topic model already exists for this tenant', models: existingModels };
    }

    return this.topicManagementService.createTopicModel(req.tenantId, defaultTopics, 'global');
  }
}
