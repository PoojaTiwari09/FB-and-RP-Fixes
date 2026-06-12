import { Controller, Post, Get, Body, Param, Req, UseGuards } from '@nestjs/common';
import { ThemeAnalysesService, CreateThemeAnalysisDto } from '../services/theme-analyses.service';
import { TenantGuard } from '../../platform-core/guards/tenant.guard';

@Controller('api/v1/m02-conversation-intelligence/theme-analyses')
@UseGuards(TenantGuard)
export class ThemeAnalysesController {
  constructor(private readonly themeAnalysesService: ThemeAnalysesService) {}

  @Post()
  async createThemeAnalysis(@Req() req: any, @Body() body: CreateThemeAnalysisDto) {
    // req.tenantId and req.userId are injected by TenantGuard
    return this.themeAnalysesService.createAnalysis(req.tenantId, req.userId, body);
  }

  @Get(':id')
  async getThemeAnalysis(@Req() req: any, @Param('id') id: string) {
    return this.themeAnalysesService.getAnalysis(req.tenantId, id);
  }
}
