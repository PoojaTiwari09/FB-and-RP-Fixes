import { Controller, Post, Param, Body, UseGuards, Req, BadRequestException } from '@nestjs/common';
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
    // Validate body — reject empty, invalid types, missing fields
    if (!body || typeof body !== 'object' || Object.keys(body).length === 0) {
      throw new BadRequestException('Request body is required and cannot be empty');
    }
    if (!body.type || typeof body.type !== 'string') {
      throw new BadRequestException('type is required and must be a string');
    }
    if (body.sectionId !== undefined && typeof body.sectionId !== 'string') {
      throw new BadRequestException('sectionId must be a string');
    }
    if (body.note !== undefined && typeof body.note !== 'string') {
      throw new BadRequestException('note must be a string');
    }
    // Boundary: reject extremely large payloads
    const raw = JSON.stringify(body);
    if (raw.length > 10000) {
      throw new BadRequestException('Request payload too large');
    }
    return this.feedbackService.submitFeedback({
      orgId: req.user.orgId,
      userId: req.user.userId,
      reportId,
      ...body,
    });
  }
}
