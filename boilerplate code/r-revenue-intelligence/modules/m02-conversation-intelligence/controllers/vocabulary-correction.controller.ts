import { Controller, Get, Post, Body, Param, Delete, Headers, UnauthorizedException } from '@nestjs/common';
import { VocabularyCorrectionService } from '../services/vocabulary-correction.service';

@Controller('api/v1/conversation-intelligence/vocabulary')
export class VocabularyCorrectionController {
  constructor(private readonly vocabService: VocabularyCorrectionService) {}

  @Post()
  async createRule(
    @Headers('x-tenant-id') tenantId: string,
    @Body() body: { incorrectTerm: string; correctTerm: string; language?: string; category?: string; mispronunciations?: string[]; variations?: string[] }
  ) {
    if (!tenantId) throw new UnauthorizedException('Tenant ID required');
    return this.vocabService.createRule(
      tenantId, 
      body.incorrectTerm, 
      body.correctTerm, 
      body.language, 
      body.category, 
      body.mispronunciations, 
      body.variations
    );
  }

  @Get()
  async getRules(@Headers('x-tenant-id') tenantId: string) {
    if (!tenantId) throw new UnauthorizedException('Tenant ID required');
    return this.vocabService.getRules(tenantId);
  }

  @Get('stats')
  async getStats(@Headers('x-tenant-id') tenantId: string) {
    if (!tenantId) throw new UnauthorizedException('Tenant ID required');
    return this.vocabService.getStats(tenantId);
  }

  @Delete(':id')
  async deleteRule(
    @Headers('x-tenant-id') tenantId: string,
    @Param('id') id: string
  ) {
    if (!tenantId) throw new UnauthorizedException('Tenant ID required');
    return this.vocabService.deleteRule(id, tenantId);
  }
}
