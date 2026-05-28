import { Controller, Get, Post, Delete, Body, Param, UseGuards, Req } from '@nestjs/common';
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
    return this.workspace.upsertDeal(req.user.orgId, body);
  }
}
