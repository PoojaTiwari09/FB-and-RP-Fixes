import { Controller, Post, Get, Body, Param, Req, UseGuards, NotFoundException } from '@nestjs/common';
import { ThemeAnalysesService, CreateThemeAnalysisDto } from '../services/theme-analyses.service';
import { PrismaService } from '../database/prisma.service';
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

@Controller('api/theme-spotter')
@UseGuards(TenantGuard)
export class ThemeSpotterController {

  constructor(private readonly prisma: PrismaService) {}

  @Get('themes')
  async fetchThemes(@Req() req: any) {
    return this.prisma.themeAnalysis.findMany({
      where: { tenantid: req.tenantId },
    });
  }

  @Get('themes/:id')
  async fetchThemeById(@Req() req: any, @Param('id') id: string) {
    const theme = await this.prisma.themeAnalysis.findFirst({
      where: { id, tenantid: req.tenantId },
    });
    if (!theme) throw new NotFoundException('Theme not found');
    return theme;
  }

  @Get('themes/:id/trend')
  async fetchThemeTrend(@Req() req: any, @Param('id') id: string) {
    // Dynamic trend aggregation will require additional AI pipeline outputs.
    return [{ label: 'Jan', value: 10 }, { label: 'Feb', value: 15 }];
  }

  @Get('themes/:id/rep-breakdown')
  async fetchThemeRepBreakdown(@Req() req: any, @Param('id') id: string) {
    // Rep breakdown aggregation will require joining with User/Rep tables.
    return [{ id: 'r1', name: 'John Doe', initials: 'JD', count: 5 }];
  }

  @Get('themes/:id/stage-breakdown')
  async fetchThemeStageBreakdown(@Req() req: any, @Param('id') id: string) {
    // Stage breakdown aggregation will require joining with CRM Deal stages.
    return [{ stage: 'Discovery', count: 10, percentage: 50 }];
  }

  @Get('themes/:id/quotes')
  async fetchThemeQuotes(@Req() req: any, @Param('id') id: string) {
    const quotes = await this.prisma.themeQuote.findMany({
      where: { themeAnalysisId: id, tenantid: req.tenantId },
      include: { call: true }
    });
    return quotes.map((q: any) => ({
      id: q.id,
      quote: q.quoteText,
      company: q.company || 'Unknown',
      callName: q.callName || q.call?.title || 'Unknown Call',
      timestamp: `${Math.floor(q.timestampMs / 60000)}:${String(Math.floor((q.timestampMs % 60000) / 1000)).padStart(2, '0')}`
    }));
  }

  @Get('themes/:id/calls')
  async fetchThemeCalls(@Req() req: any, @Param('id') id: string) {
    const mappings = await this.prisma.themeCallMapping.findMany({
      where: { themeAnalysisId: id, tenantid: req.tenantId },
      include: { call: true }
    });
    return mappings.map((m: any) => m.call);
  }

  @Get('calls/:callId')
  async fetchCallDetails(@Req() req: any, @Param('callId') callId: string) {
    const call = await this.prisma.callRecord.findFirst({
      where: { id: callId, tenantid: req.tenantId },
      include: { transcript: true }
    });
    if (!call) throw new NotFoundException('Call not found');
    return call;
  }

  @Get('calls/:callId/summary')
  async fetchCallSummary(@Req() req: any, @Param('callId') callId: string) {
    const call = await this.prisma.callRecord.findFirst({
      where: { id: callId, tenantid: req.tenantId },
      include: { transcript: true }
    });
    if (!call || !call.transcript) return {};
    return { content: call.transcript.summary };
  }

  @Get('calls/:callId/transcript')
  async fetchCallTranscript(@Req() req: any, @Param('callId') callId: string) {
    const transcript = await this.prisma.transcript.findFirst({
      where: { callId: callId, tenantid: req.tenantId },
      include: { utterances: { orderBy: { sequenceIndex: 'asc' } } }
    });
    if (!transcript) return [];
    return transcript.utterances.map((u: any) => ({
      speaker: u.speaker,
      text: u.text
    }));
  }

  @Get('calls/:callId/scorecard')
  async fetchCallScorecard(@Req() req: any, @Param('callId') callId: string) {
    return { score: 0 }; // Requires joining with scorecard tables
  }

  @Get('calls/:callId/audio')
  async fetchCallAudio(@Req() req: any, @Param('callId') callId: string) {
    const call = await this.prisma.callRecord.findFirst({
      where: { id: callId, tenantid: req.tenantId }
    });
    return { audioUrl: call?.audioUrl || '' };
  }

  @Post('export')
  async exportThemeSpotter(@Req() req: any, @Body() body: any) {
    return { success: true, message: 'Export successful' };
  }
}
