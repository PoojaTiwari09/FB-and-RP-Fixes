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
import { M01FrontendAiReviewerService } from './m01-frontend-ai-reviewer.service';

/** AI Call Reviewer (Sales Rep) — routes under /api/calls/:callId */
@Controller('api/calls/:callId')
@UseGuards(TenantGuard)
export class M01FrontendAiReviewerDetailController {
  constructor(private readonly svc: M01FrontendAiReviewerService) {}

  @Get('ai-insights')
  async aiInsights(@Param('callId') callId: string, @Req() req: Record<string, string>) {
    const record = await this.svc.loadCall(callId, req.tenantId);
    return this.svc.mapAiInsights(record);
  }

  @Get('audio-url')
  async audioUrl(@Param('callId') callId: string, @Req() req: Record<string, string>) {
    const record = await this.svc.loadCall(callId, req.tenantId);
    return this.svc.mapAudioUrl(record);
  }

  @Get('review')
  async review(@Param('callId') callId: string, @Req() req: Record<string, string>) {
    const record = await this.svc.loadCall(callId, req.tenantId);
    return this.svc.mapReview(record);
  }

  @Get('feedback')
  async feedback(@Param('callId') callId: string, @Req() req: Record<string, string>) {
    const record = await this.svc.loadCall(callId, req.tenantId);
    return this.svc.mapFeedback(record);
  }

  @Post('feedback/acknowledge')
  acknowledge(@Body() _body: unknown) {
    return this.svc.acknowledgeFeedback();
  }

  @Patch('action-items/:actionItemId')
  updateActionItem(@Body() _body: unknown) {
    return this.svc.updateActionItem();
  }

  /** SR transcript tab — `{ data: { entries } }` (separate from paginated /transcript) */
  @Get('transcript-entries')
  async transcriptEntries(@Param('callId') callId: string, @Req() req: Record<string, string>) {
    const record = await this.svc.loadCall(callId, req.tenantId);
    return this.svc.mapTranscript(record);
  }
}

@Controller('api/coaching')
@UseGuards(TenantGuard)
export class M01FrontendCoachingInsightsController {
  constructor(private readonly svc: M01FrontendAiReviewerService) {}

  @Get('insights')
  insights() {
    return this.svc.coachingInsights();
  }
}
