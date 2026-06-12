import { Controller, Get, Post, Delete, Body, Param, UseGuards, Req, BadRequestException } from '@nestjs/common';
import { WorkspaceService } from '../services/workspace.service';
import { AuthGuard } from '../guards/auth.guard';

@Controller('api/v1/ai-summaries-genai/workspace')
@UseGuards(AuthGuard)
export class WorkspaceController {
  constructor(private readonly workspace: WorkspaceService) {}

  @Get()
  async getWorkspace(@Req() req: any) {
    return this.workspace.getWorkspace(req.user.orgId);
  }

  @Get('chat-history')
  getChatHistory(@Req() req: any) {
    return this.workspace.getChatHistory(req.user.orgId);
  }

  @Post('chat-history')
  saveChat(
    @Body() body: { question: string; answer: string; citations?: any[] },
    @Req() req: any,
  ) {
    // Validate body — reject empty, invalid types, missing fields
    if (!body || typeof body !== 'object' || Object.keys(body).length === 0) {
      throw new BadRequestException('Request body is required and cannot be empty');
    }
    if (!body.question || typeof body.question !== 'string') {
      throw new BadRequestException('question is required and must be a string');
    }
    if (!body.answer || typeof body.answer !== 'string') {
      throw new BadRequestException('answer is required and must be a string');
    }
    // Boundary: reject extremely large payloads
    const raw = JSON.stringify(body);
    if (raw.length > 10000) {
      throw new BadRequestException('Request payload too large');
    }
    return this.workspace.saveChat(
      req.user.orgId,
      req.user.userId,
      body.question,
      body.answer,
      body.citations || [],
    );
  }

  @Delete('chat-history/:id')
  deleteChat(@Param('id') id: string, @Req() req: any) {
    return this.workspace.deleteChat(req.user.orgId, id);
  }

  @Post('deals')
  createDeal(@Body() body: any, @Req() req: any) {
    // Validate body — reject empty, invalid types, missing fields
    if (!body || typeof body !== 'object' || Object.keys(body).length === 0) {
      throw new BadRequestException('Request body is required and cannot be empty');
    }
    if (body.exampleField === undefined || typeof body.exampleField !== 'string') {
      throw new BadRequestException('exampleField is required and must be a string');
    }
    if (body.count === undefined || typeof body.count !== 'number') {
      throw new BadRequestException('count is required and must be a number');
    }
    // Boundary: reject extremely large payloads
    const raw = JSON.stringify(body);
    if (raw.length > 10000) {
      throw new BadRequestException('Request payload too large');
    }
    return this.workspace.upsertDeal(req.user.orgId, body);
  }
}
