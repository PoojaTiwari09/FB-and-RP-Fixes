import { Controller, Get, Post, Delete, Body, Param, Query, Headers, UnauthorizedException } from '@nestjs/common';
import { TopicManagementService } from '../services/topic-management.service';
import { TopicDefinition } from '../repositories/topic.repository';

@Controller('api/v1/m02-conversation-intelligence/topics')
export class TopicManagementController {
  constructor(private readonly topicManagementService: TopicManagementService) {}

  @Post()
  async createTopicModel(
    @Body('tenantId') tenantId: string,
    @Body('topics') topics: TopicDefinition[],
    @Body('type') type?: string,
  ) {
    return this.topicManagementService.createTopicModel(tenantId, topics, type);
  }

  @Get()
  async getTopicModels(@Query('tenantId') tenantId: string) {
    return this.topicManagementService.getTopicModels(tenantId);
  }

  @Delete(':id')
  async deleteTopicModel(@Param('id') id: string) {
    return this.topicManagementService.deleteTopicModel(id);
  }

  @Post('topics')
  async addTopicToModel(
    @Headers('x-tenant-id') tenantId: string,
    @Body() body: any
  ) {
    if (!tenantId) throw new UnauthorizedException('Tenant ID required');
    return this.topicManagementService.addTopicToModel(tenantId, body);
  }

  @Delete('remove')
  async removeTopic(
    @Body('tenantId') tenantId: string,
    @Body('topicName') topicName: string,
  ) {
    return this.topicManagementService.removeTopicFromModel(tenantId, topicName);
  }

  @Post('seed')
  async seedDefaultTopics(@Body('tenantId') tenantId: string) {
    const defaultTopics: TopicDefinition[] = [
      { name: 'pricing', description: 'Discussions about pricing, costs, discounts, or payment terms' },
      { name: 'sales objection', description: 'Customer objections or concerns about the product/service' },
      { name: 'promotions and discounts', description: 'Special offers, promotions, or discount discussions' },
      { name: 'CRM solutions', description: 'CRM software, tools, or integration discussions' },
      { name: 'ROI', description: 'Return on investment calculations or value discussions' },
      { name: 'Salesforce solutions', description: 'Salesforce-specific features, integrations, or comparisons' },
      { name: 'Data security', description: 'Security, compliance, GDPR, or data protection discussions' },
      { name: 'customer complaint', description: 'Customer complaints, issues, or negative feedback' }
    ];

    // Check if a model already exists for this tenant
    const existingModels = await this.topicManagementService.getTopicModels(tenantId);
    if (existingModels.length > 0) {
      return { message: 'Topic model already exists for this tenant', models: existingModels };
    }

    // Create a new global topic model
    return this.topicManagementService.createTopicModel(tenantId, defaultTopics, 'global');
  }
}
