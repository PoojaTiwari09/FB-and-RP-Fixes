import { Controller, Post, Param, Body, UseGuards, Req } from '@nestjs/common';
import { FeedbackService } from '../services/feedback.service';
import { AuthGuard } from '../guards/auth.guard';

@Controller('api/v1/ai-summaries-genai/feedback')
@UseGuards(AuthGuard)
export class FeedbackController {
  constructor(private readonly feedbackService: FeedbackService) {}

  @Post('reports/:reportId')
  async submitReportFeedback(
    @Param('reportId') reportId: string,
    @Body() body: { type: string; sectionId?: string; bulletId?: string; note?: string },
    @Req() req,
  ) {
    return this.feedbackService.submitFeedback({
      orgId: req.user.orgId,
      userId: req.user.userId,
      reportId,
      ...body,
    });
  }
}
