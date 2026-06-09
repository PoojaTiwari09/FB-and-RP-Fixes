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
  list(@Query() query: Record<string, string>, @Req() req: any) {
    return this.svc.listReviews(req.tenantId, query, req.userId, req.userRole);
  }

  @Get(':reviewId/view')
  view(@Param('reviewId') reviewId: string, @Req() req: any) {
    return this.svc.getSubmittedView(req.tenantId, reviewId, req.userId, req.userRole);
  }

  @Get(':reviewId/submitted')
  submitted(@Param('reviewId') reviewId: string, @Req() req: any) {
    return this.svc.getSubmitted(reviewId, req.userId, req.userRole);
  }

  @Get(':reviewId/summary')
  summary(@Param('reviewId') reviewId: string, @Req() req: any) {
    return this.svc.getSummary(req.tenantId, reviewId, req.userId, req.userRole);
  }

  @Get(':reviewId/coaching')
  getCoaching(@Param('reviewId') reviewId: string, @Req() req: any) {
    return this.svc.getCoaching(req.tenantId, reviewId, req.userId, req.userRole);
  }

  @Post(':reviewId/coaching')
  saveCoaching(
    @Param('reviewId') reviewId: string,
    @Body() body: unknown,
    @Req() req: any,
  ) {
    return this.svc.saveCoaching(req.tenantId, reviewId, body, req.userId, req.userRole);
  }

  @Get(':reviewId/scorecard')
  scorecard(@Param('reviewId') reviewId: string, @Req() req: any) {
    return this.svc.getScorecardForm(req.tenantId, reviewId, req.userId, req.userRole);
  }

  @Get(':reviewId/transcript')
  transcript(@Param('reviewId') reviewId: string, @Req() req: any) {
    return this.svc.getTranscript(req.tenantId, reviewId, req.userId, req.userRole);
  }

  @Get(':reviewId/ai-insights')
  aiInsights(@Req() req: any) {
    return this.svc.getAiInsights(req.userId, req.userRole);
  }

  @Get(':reviewId')
  detail(@Param('reviewId') reviewId: string, @Req() req: any) {
    return this.svc.getReviewDetail(req.tenantId, reviewId, req.userId, req.userRole);
  }

  @Patch(':reviewId')
  patch(
    @Param('reviewId') reviewId: string,
    @Body() body: unknown,
    @Req() req: any,
  ) {
    return this.svc.patchReview(req.tenantId, reviewId, body, req.userId, req.userRole);
  }

  @Post(':reviewId/mark-na')
  markNa(@Param('reviewId') reviewId: string, @Req() req: any) {
    return this.svc.markNa(req.tenantId, reviewId, req.userId, req.userRole);
  }

  @Post(':reviewId/answers')
  saveAnswer(
    @Param('reviewId') reviewId: string,
    @Body() body: unknown,
    @Req() req: any,
  ) {
    return this.svc.saveAnswer(req.tenantId, reviewId, body, req.userId, req.userRole);
  }

  @Post(':reviewId/save-draft')
  saveDraft(
    @Param('reviewId') reviewId: string,
    @Body() body: any,
    @Req() req: any,
  ) {
    return this.svc.saveDraft(req.tenantId, reviewId, body, req.userId, req.userRole);
  }

  @Post(':reviewId/submit')
  submit(
    @Param('reviewId') reviewId: string,
    @Body() body: any,
    @Req() req: any,
  ) {
    return this.svc.submitReview(req.tenantId, reviewId, body, req.userId, req.userRole);
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
  listCalls(@Query() query: Record<string, string>, @Req() req: any) {
    return this.svc.listReviews(req.tenantId, query, req.userId, req.userRole);
  }
}

@Controller('api/analytics')
@UseGuards(TenantGuard)
export class M02FrontendAnalyticsController {
  constructor(private readonly svc: M02FrontendCallReviewsService) {}

  @Get('summary')
  summary(@Req() req: any) {
    return this.svc.getAnalyticsSummary(req.userId, req.userRole);
  }

  @Get('score-trend')
  scoreTrend(@Req() req: any) {
    return this.svc.getScoreTrend(req.userId, req.userRole);
  }

  @Get('focus-areas')
  focusAreas(@Req() req: any) {
    return this.svc.getFocusAreas(req.userId, req.userRole);
  }
}
