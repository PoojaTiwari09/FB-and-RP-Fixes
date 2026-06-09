import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
  Req,
} from '@nestjs/common';
import { TenantGuard } from '../../platform-core/guards/tenant.guard';
import { VocabularyCorrectionService } from '../services/vocabulary-correction.service';

/**
 * Vocabulary correction rules — applied to transcripts to normalise jargon /
 * mis-pronunciations (TDD Appendix 16).
 *
 * `TenantGuard` is enforced at the class level.
 */
@Controller('api/v1/conversation-intelligence/vocabulary')
@UseGuards(TenantGuard)
export class VocabularyCorrectionController {
  constructor(private readonly vocabService: VocabularyCorrectionService) {}

  @Post()
  async createRule(
    @Req() req: Record<string, any>,
    @Body() body: {
      incorrectTerm: string;
      correctTerm: string;
      language?: string;
      category?: string;
      mispronunciations?: string[];
      variations?: string[];
    },
  ) {
    return this.vocabService.createRule(
      req.tenantId,
      body.incorrectTerm,
      body.correctTerm,
      body.language,
      body.category,
      body.mispronunciations,
      body.variations,
    );
  }

  @Get()
  async getRules(@Req() req: Record<string, any>) {
    return this.vocabService.getRules(req.tenantId);
  }

  @Get('stats')
  async getStats(@Req() req: Record<string, any>) {
    return this.vocabService.getStats(req.tenantId);
  }

  @Delete(':id')
  async deleteRule(@Req() req: Record<string, any>, @Param('id') id: string) {
    return this.vocabService.deleteRule(id, req.tenantId);
  }
}
