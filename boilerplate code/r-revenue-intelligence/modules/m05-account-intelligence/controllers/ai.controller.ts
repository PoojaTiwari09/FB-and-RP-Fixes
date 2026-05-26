import { Controller, Post, Body, Get } from '@nestjs/common';
import { AiService, SummaryRequest, ChatRequest } from '../services/ai.service';

@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Get('health')
  health() {
    return { status: 'ok', service: 'revenue-intelligence-ai' };
  }

  @Post('summary')
  async generateSummary(@Body() req: SummaryRequest) {
    return this.aiService.generateSummary(req);
  }

  @Post('chat')
  async chat(@Body() req: ChatRequest) {
    return this.aiService.chat(req);
  }
}
