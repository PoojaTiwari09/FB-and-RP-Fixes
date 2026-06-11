import { Controller, Get, Post, Body, Param, Query, UseGuards, BadRequestException } from '@nestjs/common';
import { AiDeepResearcherService } from '../services/ai-deep-researcher.service';
import { AuthGuard } from '../guards/auth.guard';

@Controller('api/v1/ai-deep-researcher')
@UseGuards(AuthGuard)
export class AiDeepResearcherController {
  constructor(private readonly service: AiDeepResearcherService) {}

  // 1. GET Filters Defaults
  @Get('filters/defaults')
  getFiltersDefaults() {
    return this.service.getFiltersDefaults();
  }

  // 2. GET Example Questions
  @Get('example-questions')
  getExampleQuestions() {
    return this.service.getExampleQuestions();
  }

  // 3. POST Run Analysis
  @Post('run')
  runAnalysis(@Body() params: { query: string; filters: any }) {
    if (!params || typeof params !== 'object') {
      throw new BadRequestException('Request body is required and must be an object');
    }
    if (params.query === undefined || typeof params.query !== 'string' || params.query.trim() === '') {
      throw new BadRequestException('query is required and must be a non-empty string');
    }
    return this.service.runAnalysis(params);
  }

  // 4. GET Progress
  @Get('progress/:jobId')
  getProgress(@Param('jobId') jobId: string) {
    if (!jobId || jobId.trim() === '') {
      throw new BadRequestException('jobId parameter is required');
    }
    return this.service.getProgress(jobId);
  }

  // 5. GET Dashboard
  @Get('dashboard')
  getDashboard(@Query('jobId') jobId: string) {
    if (!jobId || jobId.trim() === '') {
      throw new BadRequestException('jobId query parameter is required');
    }
    return this.service.getDashboard(jobId);
  }

  // 6. GET Executive Summary
  @Get('executive-summary')
  getExecutiveSummary(@Query('jobId') jobId: string) {
    if (!jobId || jobId.trim() === '') {
      throw new BadRequestException('jobId query parameter is required');
    }
    return this.service.getExecutiveSummary(jobId);
  }

  // 7. GET Key Findings
  @Get('key-findings')
  getKeyFindings(@Query('jobId') jobId: string) {
    if (!jobId || jobId.trim() === '') {
      throw new BadRequestException('jobId query parameter is required');
    }
    return this.service.getKeyFindings(jobId);
  }

  // 8. GET Objections
  @Get('objections')
  getObjections(@Query('jobId') jobId: string) {
    if (!jobId || jobId.trim() === '') {
      throw new BadRequestException('jobId query parameter is required');
    }
    return this.service.getObjections(jobId);
  }

  // 9. GET Trends
  @Get('trends')
  getTrends(@Query('jobId') jobId: string) {
    if (!jobId || jobId.trim() === '') {
      throw new BadRequestException('jobId query parameter is required');
    }
    return this.service.getTrends(jobId);
  }

  // 10. GET Risks & Opportunities
  @Get('risks-opportunities')
  getRisksOpportunities(@Query('jobId') jobId: string) {
    if (!jobId || jobId.trim() === '') {
      throw new BadRequestException('jobId query parameter is required');
    }
    return this.service.getRisksOpportunities(jobId);
  }

  // 11. GET Recommendations
  @Get('recommendations')
  getRecommendations(@Query('jobId') jobId: string) {
    if (!jobId || jobId.trim() === '') {
      throw new BadRequestException('jobId query parameter is required');
    }
    return this.service.getRecommendations(jobId);
  }

  // 12. GET Evidence
  @Get('evidence')
  getEvidence(
    @Query('jobId') jobId: string,
    @Query('finding') finding?: string,
    @Query('page') page?: string,
    @Query('size') size?: string,
  ) {
    if (!jobId || jobId.trim() === '') {
      throw new BadRequestException('jobId query parameter is required');
    }
    const p = page ? parseInt(page, 10) : 1;
    const s = size ? parseInt(size, 10) : 10;
    if (isNaN(p) || p <= 0) {
      throw new BadRequestException('page query parameter must be a positive integer');
    }
    if (isNaN(s) || s <= 0) {
      throw new BadRequestException('size query parameter must be a positive integer');
    }
    return this.service.getEvidence(jobId, finding || 'all', p, s);
  }

  // 13. POST Escalation Submit
  @Post('escalation')
  submitEscalation(@Body() body: { jobId: string; question: string }) {
    if (!body || typeof body !== 'object') {
      throw new BadRequestException('Request body is required and must be an object');
    }
    if (!body.jobId || typeof body.jobId !== 'string' || body.jobId.trim() === '') {
      throw new BadRequestException('jobId is required and must be a non-empty string');
    }
    if (!body.question || typeof body.question !== 'string' || body.question.trim() === '') {
      throw new BadRequestException('question is required and must be a non-empty string');
    }
    return this.service.submitEscalation(body.jobId, body.question);
  }

  // 14. POST Recommendation Share
  @Post('recommendation/share')
  shareRecommendation(@Body() body: { jobId: string; recommendationId: string; channel: string }) {
    if (!body || typeof body !== 'object') {
      throw new BadRequestException('Request body is required and must be an object');
    }
    if (!body.jobId || typeof body.jobId !== 'string' || body.jobId.trim() === '') {
      throw new BadRequestException('jobId is required and must be a non-empty string');
    }
    if (!body.recommendationId || typeof body.recommendationId !== 'string' || body.recommendationId.trim() === '') {
      throw new BadRequestException('recommendationId is required and must be a non-empty string');
    }
    if (!body.channel || typeof body.channel !== 'string' || body.channel.trim() === '') {
      throw new BadRequestException('channel is required and must be a non-empty string');
    }
    return this.service.shareRecommendation(body.jobId, body.recommendationId, body.channel);
  }

  // --- Refactored REST Endpoints required by deep-researcher UI ---

  @Get('reps')
  getReps() {
    return this.service.getReps();
  }

  @Get('reps/:repId/calls')
  getRepCalls(@Param('repId') repId: string) {
    if (!repId || repId.trim() === '') {
      throw new BadRequestException('repId parameter is required');
    }
    return this.service.getRepCalls(repId);
  }

  @Get('objections/:objectionId/rep-breakdown')
  getObjectionRepBreakdown(@Param('objectionId') objectionId: string) {
    if (!objectionId || objectionId.trim() === '') {
      throw new BadRequestException('objectionId parameter is required');
    }
    return this.service.getObjectionRepBreakdown(objectionId);
  }

  @Get('objections/:objectionId/evidence')
  getObjectionEvidence(@Param('objectionId') objectionId: string) {
    if (!objectionId || objectionId.trim() === '') {
      throw new BadRequestException('objectionId parameter is required');
    }
    return this.service.getObjectionEvidence(objectionId);
  }

  @Get('accounts/:accountId')
  getAccountDetails(@Param('accountId') accountId: string) {
    if (!accountId || accountId.trim() === '') {
      throw new BadRequestException('accountId parameter is required');
    }
    return this.service.getAccountDetails(accountId);
  }

  @Get('recommendations/:recId')
  getRecommendationDetails(@Param('recId') recId: string) {
    if (!recId || recId.trim() === '') {
      throw new BadRequestException('recId parameter is required');
    }
    return this.service.getRecommendationDetails(recId);
  }
}

