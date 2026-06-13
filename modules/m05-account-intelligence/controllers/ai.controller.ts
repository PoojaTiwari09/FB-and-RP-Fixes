import { Controller, Post, Body, Get, HttpCode } from '@nestjs/common';
import { AiService, SummaryRequest, ChatRequest } from '../services/ai.service';

@Controller('api/v1/account-intelligence/ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Get('health')
  health() {
    return { status: 'ok', service: 'revenue-intelligence-ai' };
  }

  @Post('summary')
  @HttpCode(200)
  async generateSummary(@Body() req: SummaryRequest) {
    return this.aiService.generateSummary(req);
  }

  @Post('chat')
  @HttpCode(200)
  async chat(@Body() req: ChatRequest) {
    return this.aiService.chat(req);
  }
}
