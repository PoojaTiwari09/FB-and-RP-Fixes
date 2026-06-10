import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  UploadedFile,
  UseInterceptors,
  createParamDecorator,
  ExecutionContext,
  Injectable,
  CanActivate,
  UnauthorizedException,
  ForbiddenException,
  SetMetadata,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { FileInterceptor } from '@nestjs/platform-express';
import { Reflector } from '@nestjs/core';
import * as bcrypt from 'bcrypt';
import {
  LlmService,
  SessionsService,
  ScenariosService,
  CoachingService,
  TrainingService,
  AnalyticsService,
} from '../services/m09.service';
import { M09Repository } from '../repositories/m09.repository';
import { PrismaService } from '../database/prisma.service';
import {
  StartSessionDto,
  SendMessageDto,
  CreateScenarioDto,
  UpdateScenarioDto,
  CreateNoteDto,
  CreateAssignmentDto,
  UpdateAssignmentDto,
  ExportQueryDto,
} from '../schemas/m09.schema';

// ─── ROOT CONTROLLER ─────────────────────────────────────────────────────────

@Controller('api/v1/coaching-training')
export class AppController {
  @Get()
  root() {
    return {
      name: 'M09 Sales AI Coaching & Training API',
      version: '1.0.0',
      status: '🟢 Online',
      docs: 'http://localhost:4001/api/docs',
      health: 'http://localhost:4001/api/test/health',
      endpoints: {
        auth: ['POST /api/auth/register', 'POST /api/auth/login'],
        sessions: ['POST /api/sessions/start', 'POST /api/sessions/send-message', 'POST /api/sessions/end'],
        scenarios: ['GET /api/scenarios', 'POST /api/scenarios'],
        analytics: ['GET /api/analytics/dashboard', 'GET /api/analytics/my'],
        coaching: ['GET /api/coaching/notes', 'GET /api/coaching/recommendations'],
        training: ['GET /api/training/assignments', 'POST /api/training/assignments'],
      },
      timestamp: new Date().toISOString(),
    };
  }
}

// ─── DECORATORS & GUARDS ─────────────────────────────────────────────────────

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);

export const ROLES_KEY = 'roles';
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);

export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly repository: M09Repository,
    private readonly jwtService: JwtService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('No token provided');
    }

    const token = authHeader.split(' ')[1];
    
    let payload;
    try {
      payload = this.jwtService.verify(token);
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }

    if (!payload || !payload.sub) {
      throw new UnauthorizedException('Invalid token payload');
    }

    const user = await this.repository.getUserById(payload.sub);
    if (!user || user.status !== 'active') {
      throw new UnauthorizedException('User not active or not found');
    }

    request.user = user;
    return true;
  }
}

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles) return true;

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    if (!user || !user.role) {
      throw new ForbiddenException('Access denied: role not found');
    }

    const hasRole = requiredRoles.includes(user.role);
    if (!hasRole) {
      throw new ForbiddenException(`Access denied: required roles: ${requiredRoles.join(', ')}`);
    }

    return true;
  }
}

// ─── SESSIONS CONTROLLER ─────────────────────────────────────────────────────

@Controller('api/v1/coaching-training/sessions')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SessionsController {
  constructor(private readonly sessionsService: SessionsService) {}

  @Get()
  @Roles('rep')
  async findAll(@CurrentUser() user: any) {
    return this.sessionsService.findAll(user.id, user.org_id);
  }

  @Get('my')
  @Roles('rep')
  async getMySessions(@CurrentUser() user: any) {
    return this.sessionsService.getMySessions(user.id, user.org_id);
  }

  @Get('voices')
  @Public()
  async getVoices() {
    return this.sessionsService.getVoices();
  }

  @Get('get-voices')
  @Public()
  async getVoicesFrontendAlias() {
    return this.sessionsService.getVoices();
  }

  @Get(':id')
  async getSessionById(@Param('id') id: string, @CurrentUser() user: any) {
    return this.sessionsService.getSessionById(id, user.org_id);
  }

  @Get(':id/hint')
  @Roles('rep')
  async getHint(@Param('id') id: string, @CurrentUser() user: any) {
    return this.sessionsService.getHint(id, user.org_id);
  }

  @Post('start')
  @Roles('rep')
  async startSession(@Body() dto: StartSessionDto, @CurrentUser() user: any) {
    return this.sessionsService.startSession(dto, user.id, user.org_id);
  }

  @Post('send-message')
  @Roles('rep')
  async sendMessage(@Body() dto: SendMessageDto, @CurrentUser() user: any) {
    return this.sessionsService.sendMessage(dto, user.org_id);
  }

  @Post('send-voice')
  @Roles('rep')
  @UseInterceptors(FileInterceptor('audio'))
  async sendVoiceMessage(
    @Body('sessionId') sessionId: string,
    @UploadedFile() audio: any,
    @CurrentUser() user: any,
  ) {
    return this.sessionsService.sendVoiceMessage(sessionId, audio, user.org_id);
  }

  @Post('end')
  @Roles('rep')
  async endSession(@Body() dto: any, @CurrentUser() user: any) {
    return this.sessionsService.endSession(dto.sessionId, user.org_id);
  }

  @Post('submit-to-manager')
  @Roles('rep')
  async submitSessionToManager(
    @Body() body: { sessionId: string },
    @CurrentUser() user: any,
  ) {
    return this.sessionsService.submitSessionToManager(body.sessionId, user.id, user.org_id);
  }

  @Post('retry')
  @Roles('rep')
  async retrySession(@Body() dto: any, @CurrentUser() user: any) {
    return this.sessionsService.retrySession(dto.sessionId, user.id, user.org_id);
  }

  // ─── FRONTEND ALIAS ROUTES ────────────────────────────────────────────────
  // Match the URL patterns the existing frontend already calls

  @Post('message')
  @Roles('rep')
  async sendMessageAlias(@Body() dto: SendMessageDto, @CurrentUser() user: any) {
    return this.sessionsService.sendMessage(dto, user.org_id);
  }

  @Post('voice-message')
  @Roles('rep')
  @UseInterceptors(FileInterceptor('audio'))
  async sendVoiceMessageAlias(
    @Body('sessionId') sessionId: string,
    @UploadedFile() audio: any,
    @CurrentUser() user: any,
  ) {
    return this.sessionsService.sendVoiceMessage(sessionId, audio, user.org_id);
  }

  @Get('get-voices-legacy')
  @Public()
  async getVoicesAlias() {
    return this.sessionsService.getVoices();
  }

  // ─── CALL TRANSCRIPT ANALYZER ─────────────────────────────────────────────

  @Patch(':id')
  @Roles('rep')
  async updateSession(
    @Param('id') id: string,
    @Body() dto: { messages_json?: any[]; status?: string },
    @CurrentUser() user: any,
  ) {
    return this.sessionsService.updateSession(id, dto, user.org_id);
  }

  @Post('analyze-call')
  @Roles('rep')
  @UseInterceptors(FileInterceptor('audio'))
  async analyzeUploadedCall(
    @UploadedFile() audio: any,
    @CurrentUser() user: any,
  ) {
    return this.sessionsService.analyzeUploadedCall(user.id, user.org_id, audio);
  }
}

// ─── SCENARIOS CONTROLLER ────────────────────────────────────────────────────

@Controller('api/v1/coaching-training/scenarios')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ScenariosController {
  constructor(private readonly scenariosService: ScenariosService) {}

  @Get()
  async findAll(@CurrentUser() user: any) {
    return this.scenariosService.findAll(user.org_id);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.scenariosService.findOne(id, user.org_id);
  }

  @Post()
  @Roles('manager', 'org_admin')
  async create(@Body() dto: CreateScenarioDto, @CurrentUser() user: any) {
    return this.scenariosService.create(dto, user.org_id, user.id);
  }

  @Patch(':id')
  @Roles('manager', 'org_admin')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateScenarioDto,
    @CurrentUser() user: any,
  ) {
    return this.scenariosService.update(id, dto, user.org_id);
  }

  @Delete(':id')
  @Roles('manager', 'org_admin')
  async delete(@Param('id') id: string, @CurrentUser() user: any) {
    return this.scenariosService.delete(id, user.org_id);
  }

  @Post('transcribe')
  @Roles('manager', 'org_admin')
  @UseInterceptors(FileInterceptor('audio'))
  async transcribeAudio(@UploadedFile() audio: any) {
    if (!audio) throw new BadRequestException('No audio file provided');
    const transcript = await this.scenariosService.transcribeAudio(audio.buffer);
    return { transcript };
  }

  @Post('analyze-audio')
  @Roles('manager', 'org_admin')
  @UseInterceptors(FileInterceptor('audio'))
  async analyzeAudio(@UploadedFile() audio: any) {
    if (!audio) throw new BadRequestException('No audio file provided');
    return this.scenariosService.analyzeAudioForScenario(audio.buffer);
  }

  @Post('generate-persona')
  @Roles('manager', 'org_admin')
  async generatePersona(@Body('transcript') transcript: string) {
    if (!transcript) throw new BadRequestException('Transcript is required');
    return this.scenariosService.generatePersonaFromTranscript(transcript);
  }
}

// ─── COACHING CONTROLLER ─────────────────────────────────────────────────────

@Controller('api/v1/coaching-training/coaching')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CoachingController {
  constructor(private readonly coachingService: CoachingService) {}

  @Get('notes')
  async getNotes(@CurrentUser() user: any) {
    return this.coachingService.getNotes(user.id, user.role, user.org_id);
  }

  @Post('notes')
  @Roles('manager', 'org_admin')
  async createNote(@Body() dto: CreateNoteDto, @CurrentUser() user: any) {
    return this.coachingService.createNote(
      user.id,
      dto.repId,
      dto.content,
      dto.priority,
      user.org_id,
    );
  }

  @Get('recommendations')
  @Roles('rep')
  async getRecommendations(@CurrentUser() user: any) {
    return this.coachingService.getRecommendations(user.id);
  }

  @Post('recommendations')
  @Roles('manager', 'org_admin')
  async pushRecommendation(
    @Body() dto: { repId: string; focusArea: string; text: string },
    @CurrentUser() user: any,
  ) {
    return this.coachingService.pushRecommendation(user.id, dto.repId, dto.focusArea, dto.text);
  }
}

// ─── TRAINING CONTROLLER ─────────────────────────────────────────────────────

@Controller('api/v1/coaching-training/training')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TrainingController {
  constructor(
    private readonly trainingService: TrainingService,
    private readonly sessionsService: SessionsService,
  ) {}

  @Post('submit-session')
  @Roles('rep')
  async submitSessionToManager(
    @Body() body: { sessionId: string },
    @CurrentUser() user: any,
  ) {
    return this.sessionsService.submitSessionToManager(body.sessionId, user.id, user.org_id);
  }

  @Post('assignments')
  @Roles('manager', 'org_admin')
  async createAssignments(
    @Body() dto: CreateAssignmentDto,
    @CurrentUser() user: any,
  ) {
    return this.trainingService.createAssignments(dto, user.id, user.org_id);
  }

  @Get('assignments')
  async getAssignments(@CurrentUser() user: any) {
    return this.trainingService.getAssignments(user);
  }

  @Patch('assignments/:id')
  @Roles('manager', 'org_admin', 'rep')
  async updateAssignment(
    @Param('id') id: string,
    @Body() dto: UpdateAssignmentDto,
    @CurrentUser() user: any,
  ) {
    if (user.role === 'rep') {
      return this.trainingService.updateAssignmentByRep(id, dto, user.id);
    }
    return this.trainingService.updateAssignment(id, dto, user.id);
  }

  @Delete('assignments/:id')
  @Roles('manager', 'org_admin')
  async deleteAssignment(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ) {
    return this.trainingService.deleteAssignment(id, user.id);
  }
}

// ─── ANALYTICS CONTROLLER ────────────────────────────────────────────────────

@Controller('api/v1/coaching-training/analytics')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('dashboard')
  @Roles('manager', 'org_admin')
  async getDashboardStats(@CurrentUser() user: any) {
    return this.analyticsService.getDashboardStats(user.org_id, user.role === 'manager' ? user.id : undefined);
  }

  @Get('reps')
  @Roles('manager', 'org_admin')
  async getRepsWithStats(@CurrentUser() user: any) {
    return this.analyticsService.getRepsWithStats(user.org_id, user.role === 'manager' ? user.id : undefined);
  }

  @Get('compare/:repId')
  @Roles('manager', 'org_admin')
  async getRepComparison(
    @Param('repId') repId: string,
    @CurrentUser() user: any,
  ) {
    return this.analyticsService.getRepComparison(repId, user.org_id, user.role === 'manager' ? user.id : undefined);
  }

  @Get('team')
  @Roles('manager', 'org_admin')
  async getTeamAnalytics(@CurrentUser() user: any) {
    return this.analyticsService.getTeamAnalytics(user.org_id, user.role === 'manager' ? user.id : undefined);
  }

  @Get('activity')
  @Roles('manager', 'org_admin')
  async getActivityMetrics(@CurrentUser() user: any) {
    return this.analyticsService.getActivityMetrics(user.org_id, user.role === 'manager' ? user.id : undefined);
  }

  @Get('interactions')
  @Roles('manager', 'org_admin')
  async getInteractionAnalytics(@CurrentUser() user: any) {
    return this.analyticsService.getInteractionAnalytics(user.org_id, user.role === 'manager' ? user.id : undefined);
  }

  @Get('topics')
  @Roles('manager', 'org_admin')
  async getTopicInsights(@CurrentUser() user: any) {
    return this.analyticsService.getTopicInsights(user.org_id, user.role === 'manager' ? user.id : undefined);
  }

  @Get('call-drilldown/:sessionId')
  @Roles('manager', 'org_admin', 'rep')
  async getCallDrilldown(
    @Param('sessionId') sessionId: string,
    @CurrentUser() user: any,
  ) {
    return this.analyticsService.getCallDrilldown(sessionId, user.org_id);
  }

  @Get('benchmarks')
  @Roles('manager', 'org_admin', 'rep')
  async getBenchmarks(@CurrentUser() user: any) {
    return this.analyticsService.getBenchmarks(user.org_id, user.role === 'manager' ? user.id : undefined);
  }

  @Get('manager-review')
  @Roles('manager', 'org_admin')
  async getManagerReview(@CurrentUser() user: any) {
    return this.analyticsService.getManagerReview(user.id, user.org_id);
  }

  @Get('training-report')
  @Roles('manager', 'org_admin')
  async getTrainingReport(@CurrentUser() user: any) {
    return this.analyticsService.getTrainingReport(user.org_id, user.role === 'manager' ? user.id : undefined);
  }

  @Get('export')
  @Roles('manager', 'org_admin')
  async exportCsv(@CurrentUser() user: any, @Query() query: ExportQueryDto) {
    return this.analyticsService.exportCsv(user.org_id, query, user.role === 'manager' ? user.id : undefined);
  }

  @Get('export-training')
  @Roles('manager', 'org_admin')
  async exportTrainingCsv(
    @CurrentUser() user: any,
    @Query() query: ExportQueryDto,
  ) {
    return this.analyticsService.exportTrainingCsv(user.org_id, query, user.role === 'manager' ? user.id : undefined);
  }

  @Get('my')
  @Roles('rep')
  async getMyAnalytics(@CurrentUser() user: any) {
    return this.analyticsService.getMyAnalytics(user.id, user.org_id);
  }

  @Get('my-notes')
  @Roles('rep')
  async getMyNotes(@CurrentUser() user: any) {
    return this.analyticsService.getMyNotes(user.id, user.org_id);
  }

  @Get('my-assignments')
  @Roles('rep')
  async getMyAssignments(@CurrentUser() user: any) {
    return this.analyticsService.getMyAssignments(user.id, user.org_id);
  }
}

@Controller('api/v1/coaching-training/test')
export class TestController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly repository: M09Repository,
    private readonly sessionsService: SessionsService,
    private readonly analyticsService: AnalyticsService,
    private readonly llmService: LlmService,
    private readonly jwtService: JwtService,
  ) {}

  private async ensureSeedData() {
    const hashedPassword = await bcrypt.hash('password123', 10);
    const seed = this.repository.seedTestData(hashedPassword);
    return {
      success: true,
      message: 'Test data seeded successfully',
      repId: seed.repId,
      managerId: seed.managerId,
      orgId: seed.orgId,
    };
  }

  @Public()
  @Get('health')
  async health() {
    await this.prisma.$queryRaw`SELECT 1`;
    const scenarios = await this.repository.findAllScenarios(
      '00000000-0000-0000-0000-000000000001',
    ).catch(() => []);

    return {
      success: true,
      database: 'up',
      aiMode: this.llmService.getRuntimeMode(),
      provider: this.llmService.getActiveProviderName(),
      counts: {
        scenarios: scenarios.length,
      },
      timestamp: new Date().toISOString(),
    };
  }

  @Public()
  @Post('seed')
  async seedTestData() {
    return this.ensureSeedData();
  }

  @Public()
  @Post('token')
  async generateToken(@Body() dto: { userId?: string }) {
    let userId = dto.userId;
    if (!userId || userId === 'mock_data' || !userId.includes('-')) {
      userId = '00000000-0000-0000-0000-000000000002';
    }
    const user = await this.repository.getUserById(userId);
    const token = this.jwtService.sign({
      sub: user.id,
      email: user.email,
      role: user.role,
      org_id: user.org_id,
    });
    return { token, userId: user.id, org_id: user.org_id, role: user.role };
  }

  @Public()
  @Post('smoke')
  async smokeTest() {
    const seed = await this.ensureSeedData();
    const scenarios = await this.repository.findAllScenarios(seed.orgId);
    const voices = await this.repository.getVoices();

    const session = await this.sessionsService.startSession(
      {
        scenarioId: scenarios[0].id,
        voiceId: voices[0]?.id,
      },
      seed.repId,
      seed.orgId,
    );

    const turn = await this.sessionsService.sendMessage(
      {
        sessionId: session.sessionId,
        message: 'We help reduce ramp time and improve rep consistency. What matters most to you right now?',
      },
      seed.orgId,
    );

    const feedback = await this.sessionsService.endSession(session.sessionId, seed.orgId);
    const analytics = await this.analyticsService.getMyAnalytics(seed.repId, seed.orgId);

    return {
      success: true,
      aiMode: this.llmService.getRuntimeMode(),
      sessionId: session.sessionId,
      replyPreview: turn.reply,
      finalScore: feedback.overall_score,
      analyticsEntries: analytics.length,
    };
  }
}
