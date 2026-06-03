import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { TenantGuard } from '../../platform-core/guards/tenant.guard';
import { M02FrontendCallReviewsService } from './m02-frontend-call-reviews.service';

/** M02 AI Call Reviewer (Manager) — `/api/call-reviews` per Figma PDF. */
@Controller('api/call-reviews')
@UseGuards(TenantGuard)
export class M02FrontendCallReviewsController {
  constructor(private readonly svc: M02FrontendCallReviewsService) {}

  @Get()
  list(@Query() query: Record<string, string>, @Req() req: Record<string, string>) {
    return this.svc.listReviews(req.tenantId, query);
  }

  @Get(':reviewId/view')
  view(@Param('reviewId') reviewId: string, @Req() req: Record<string, string>) {
    return this.svc.getSubmittedView(req.tenantId, reviewId);
  }

  @Get(':reviewId/submitted')
  submitted(@Param('reviewId') reviewId: string) {
    return this.svc.getSubmitted(reviewId);
  }

  @Get(':reviewId/summary')
  summary(@Param('reviewId') reviewId: string, @Req() req: Record<string, string>) {
    return this.svc.getSummary(req.tenantId, reviewId);
  }

  @Get(':reviewId/coaching')
  getCoaching(@Param('reviewId') reviewId: string, @Req() req: Record<string, string>) {
    return this.svc.getCoaching(req.tenantId, reviewId);
  }

  @Post(':reviewId/coaching')
  saveCoaching(
    @Param('reviewId') reviewId: string,
    @Body() body: unknown,
    @Req() req: Record<string, string>,
  ) {
    return this.svc.saveCoaching(req.tenantId, reviewId, body);
  }

  @Get(':reviewId/scorecard')
  scorecard(@Param('reviewId') reviewId: string, @Req() req: Record<string, string>) {
    return this.svc.getScorecardForm(req.tenantId, reviewId);
  }

  @Get(':reviewId/transcript')
  transcript(@Param('reviewId') reviewId: string, @Req() req: Record<string, string>) {
    return this.svc.getTranscript(req.tenantId, reviewId);
  }

  @Get(':reviewId/ai-insights')
  aiInsights() {
    return this.svc.getAiInsights();
  }

  @Get(':reviewId')
  detail(@Param('reviewId') reviewId: string, @Req() req: Record<string, string>) {
    return this.svc.getReviewDetail(req.tenantId, reviewId);
  }

  @Patch(':reviewId')
  patch(
    @Param('reviewId') reviewId: string,
    @Body() body: unknown,
    @Req() req: Record<string, string>,
  ) {
    return this.svc.patchReview(req.tenantId, reviewId, body);
  }

  @Post(':reviewId/mark-na')
  markNa(@Param('reviewId') reviewId: string, @Req() req: Record<string, string>) {
    return this.svc.markNa(req.tenantId, reviewId);
  }

  @Post(':reviewId/answers')
  saveAnswer(
    @Param('reviewId') reviewId: string,
    @Body() body: unknown,
    @Req() req: Record<string, string>,
  ) {
    return this.svc.saveAnswer(req.tenantId, reviewId, body);
  }

  @Post(':reviewId/save-draft')
  saveDraft(
    @Param('reviewId') reviewId: string,
    @Body() body: any,
    @Req() req: Record<string, string>,
  ) {
    return this.svc.saveDraft(req.tenantId, reviewId, body);
  }

  @Post(':reviewId/submit')
  submit(
    @Param('reviewId') reviewId: string,
    @Body() body: any,
    @Req() req: Record<string, string>,
  ) {
    return this.svc.submitReview(req.tenantId, reviewId, body);
  }

  @Post(':reviewId/export')
  export(@Param('reviewId') reviewId: string) {
    return this.svc.exportReview(reviewId);
  }

  @Post(':reviewId/clone')
  clone(@Param('reviewId') reviewId: string) {
    return this.svc.cloneReview(reviewId);
  }

  @Post(':reviewId/share')
  share() {
    return { success: true };
  }

  @Post(':reviewId/reopen')
  reopen(@Param('reviewId') reviewId: string, @Req() req: Record<string, string>) {
    return this.svc.patchReview(req.tenantId, reviewId, {});
  }
}

@Controller('api/scorecards')
@UseGuards(TenantGuard)
export class M02FrontendScorecardsController {
  constructor(private readonly svc: M02FrontendCallReviewsService) {}

  @Get()
  list() {
    return this.svc.getScorecards();
  }
}

@Controller('api/users')
@UseGuards(TenantGuard)
export class M02FrontendUsersController {
  constructor(private readonly svc: M02FrontendCallReviewsService) {}

  @Get()
  list() {
    return this.svc.getUsers();
  }
}

@Controller('api/meta')
@UseGuards(TenantGuard)
export class M02FrontendMetaController {
  constructor(private readonly svc: M02FrontendCallReviewsService) {}

  @Get('coaching-tags')
  coachingTags() {
    return this.svc.getCoachingTags();
  }
}

/** Manager "All Calls" tab — separate from M01 GET /api/calls (unified single-port API) */
@Controller('api/manager/calls')
@UseGuards(TenantGuard)
export class M02FrontendManagerCallsController {
  constructor(private readonly svc: M02FrontendCallReviewsService) {}

  @Get()
  listCalls(@Query() query: Record<string, string>, @Req() req: Record<string, string>) {
    return this.svc.listReviews(req.tenantId, query);
  }
}

@Controller('api/analytics')
@UseGuards(TenantGuard)
export class M02FrontendAnalyticsController {
  constructor(private readonly svc: M02FrontendCallReviewsService) {}

  @Get('summary')
  summary() {
    return this.svc.getAnalyticsSummary();
  }

  @Get('score-trend')
  scoreTrend() {
    return this.svc.getScoreTrend();
  }

  @Get('focus-areas')
  focusAreas() {
    return this.svc.getFocusAreas();
  }

  @Get('common-tags')
  commonTags() {
    return this.svc.getCommonTags();
  }

  @Get('review-history')
  history(@Query() query: Record<string, string>) {
    return this.svc.getReviewHistory(query);
  }
}
