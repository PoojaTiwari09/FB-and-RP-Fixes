import { Controller, Get, Post, Body, Param, UseGuards, Req } from '@nestjs/common';
import { TenantGuard } from '../../platform-core/guards/tenant.guard';
import { M02ConversationIntelligenceService } from '../services/m02.service';

@Controller('api/v1/conversation-intelligence')
@UseGuards(TenantGuard)
export class M02ConversationIntelligenceController {
  constructor(private readonly service: M02ConversationIntelligenceService) {}

  @Get()
  findAll(@Req() req: any) {
    return this.service.findAll(req.tenantId);
  }

  @Post()
  create(@Body() dto: any, @Req() req: any) {
    return this.service.create(dto, req.tenantId);
  }
}
