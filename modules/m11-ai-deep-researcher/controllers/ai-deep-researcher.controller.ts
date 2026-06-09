import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { AiDeepResearcherService } from '../services/ai-deep-researcher.service';

@Controller()
export class AiDeepResearcherController {
  constructor(private readonly service: AiDeepResearcherService) {}

  // 1. GET Filters Defaults
  @Get('api/ai-deep-researcher/filters/defaults')
  getFiltersDefaults() {
    return this.service.getFiltersDefaults();
  }

  // 2. GET Example Questions
  @Get('api/ai-deep-researcher/example-questions')
  getExampleQuestions() {
    return this.service.getExampleQuestions();
  }

  // 3. POST Run Analysis
  @Post('api/ai-deep-researcher/run')
  runAnalysis(@Body() params: { query: string; filters: any }) {
    return this.service.runAnalysis(params);
  }

  // 4. GET Progress
  @Get('api/ai-deep-researcher/progress/:jobId')
  getProgress(@Param('jobId') jobId: string) {
    return this.service.getProgress(jobId);
  }

  // 5. GET Dashboard
  @Get('api/ai-deep-researcher/dashboard')
  getDashboard(@Query('jobId') jobId: string) {
    return this.service.getDashboard(jobId);
  }

  // 6. GET Executive Summary
  @Get('api/ai-deep-researcher/executive-summary')
  getExecutiveSummary(@Query('jobId') jobId: string) {
    return this.service.getExecutiveSummary(jobId);
  }

  // 7. GET Key Findings
  @Get('api/ai-deep-researcher/key-findings')
  getKeyFindings(@Query('jobId') jobId: string) {
    return this.service.getKeyFindings(jobId);
  }

  // 8. GET Objections
  @Get('api/ai-deep-researcher/objections')
  getObjections(@Query('jobId') jobId: string) {
    return this.service.getObjections(jobId);
  }

  // 9. GET Trends
  @Get('api/ai-deep-researcher/trends')
  getTrends(@Query('jobId') jobId: string) {
    return this.service.getTrends(jobId);
  }

  // 10. GET Risks & Opportunities
  @Get('api/ai-deep-researcher/risks-opportunities')
  getRisksOpportunities(@Query('jobId') jobId: string) {
    return this.service.getRisksOpportunities(jobId);
  }

  // 11. GET Recommendations
  @Get('api/ai-deep-researcher/recommendations')
  getRecommendations(@Query('jobId') jobId: string) {
    return this.service.getRecommendations(jobId);
  }

  // 12. GET Evidence
  @Get('api/ai-deep-researcher/evidence')
  getEvidence(
    @Query('jobId') jobId: string,
    @Query('finding') finding?: string,
    @Query('page') page?: string,
    @Query('size') size?: string,
  ) {
    const p = page ? parseInt(page, 10) : 1;
    const s = size ? parseInt(size, 10) : 10;
    return this.service.getEvidence(jobId, finding || 'all', p, s);
  }

  // 13. POST Escalation Submit
  @Post('api/ai-deep-researcher/escalation')
  submitEscalation(@Body() body: { jobId: string; question: string }) {
    return this.service.submitEscalation(body.jobId, body.question);
  }

  // 14. POST Recommendation Share
  @Post('api/ai-deep-researcher/recommendation/share')
  shareRecommendation(@Body() body: { jobId: string; recommendationId: string; channel: string }) {
    return this.service.shareRecommendation(body.jobId, body.recommendationId, body.channel);
  }

  // --- Refactored REST Endpoints required by deep-researcher UI ---

  @Get('api/reps')
  getReps() {
    return this.service.getReps();
  }

  @Get('api/reps/:repId/calls')
  getRepCalls(@Param('repId') repId: string) {
    return this.service.getRepCalls(repId);
  }

  @Get('api/objections/:objectionId/rep-breakdown')
  getObjectionRepBreakdown(@Param('objectionId') objectionId: string) {
    return this.service.getObjectionRepBreakdown(objectionId);
  }

  @Get('api/objections/:objectionId/evidence')
  getObjectionEvidence(@Param('objectionId') objectionId: string) {
    return this.service.getObjectionEvidence(objectionId);
  }

  @Get('api/accounts/:accountId')
  getAccountDetails(@Param('accountId') accountId: string) {
    return this.service.getAccountDetails(accountId);
  }

  @Get('api/recommendations/:recId')
  getRecommendationDetails(@Param('recId') recId: string) {
    return this.service.getRecommendationDetails(recId);
  }
}
