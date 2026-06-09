import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { z } from 'zod';
import { SessionsService, ScenariosService } from '../services/m09.service';
import { M09Repository } from '../repositories/m09.repository';
import {
  mapMessages,
  mapResults,
  mapSessionState,
  mapTrainingListItem,
  mapTrainingSetup,
} from './m09-frontend-trainings.mapper';

const StartSessionSchema = z.object({
  selectedVoiceId: z.string().optional(),
  trainingId: z.string().optional(),
});

const MessageSchema = z.object({
  text: z.string().min(1),
  inputType: z.enum(['text', 'voice']).optional(),
});

@Injectable()
export class M09FrontendTrainingsService {
  constructor(
    private readonly sessions: SessionsService,
    private readonly scenarios: ScenariosService,
    private readonly repo: M09Repository,
  ) {}

  async listTrainings(userId: string, orgId: string, status?: string) {
    const scenarios = await this.scenarios.findAll(orgId);
    const assignments = await this.repo.findAssignmentsByRep(userId, orgId);
    let items = scenarios.map((s: any) => {
      const a = assignments.find((x: any) => x.scenario_id === s.id);
      return mapTrainingListItem(s, a);
    });
    if (status && status !== 'all') {
      items = items.filter((i) => i.status === status);
    }
    return { trainings: items };
  }

  async getTraining(trainingId: string, orgId: string) {
    const scenario = await this.scenarios.findOne(trainingId, orgId);
    return mapTrainingSetup(scenario);
  }

  async startSession(
    trainingId: string,
    body: unknown,
    userId: string,
    orgId: string,
  ) {
    const dto = StartSessionSchema.parse(body);
    const result = await this.sessions.startSession(
      { scenarioId: trainingId, voiceId: dto.selectedVoiceId, selectedVoiceId: dto.selectedVoiceId },
      userId,
      orgId,
    );
    return {
      sessionId: result.sessionId || result.id,
      status: 'active',
      startedAt: new Date().toISOString(),
    };
  }

  async getSession(trainingId: string, sessionId: string, orgId: string) {
    const session = await this.repo.findSessionById(sessionId, orgId);
    if (session.scenario_id !== trainingId) {
      throw new NotFoundException('Session not found for this training');
    }
    const messages = typeof session.messages_json === 'string'
      ? JSON.parse(session.messages_json)
      : session.messages_json || [];
    const scenario = await this.scenarios.findOne(trainingId, orgId);
    return mapSessionState(session, scenario, messages);
  }

  async sendMessage(
    trainingId: string,
    sessionId: string,
    body: unknown,
    orgId: string,
  ) {
    const dto = MessageSchema.parse(body);
    const session = await this.repo.findSessionById(sessionId, orgId);
    if (session.scenario_id !== trainingId) {
      throw new NotFoundException('Session not found');
    }
    if (session.lifecycle_status === 'paused') {
      throw new BadRequestException('Session is paused');
    }

    const result = await this.sessions.sendMessage(
      { sessionId, message: dto.text, text: dto.text },
      orgId,
    );

    const ts = Math.floor((Date.now() - new Date(session.created_at).getTime()) / 1000);
    return {
      userMessage: {
        id: `u_${ts}`,
        sender: 'user',
        text: dto.text,
        timestampSeconds: ts,
      },
      aiResponse: {
        id: `ai_${ts}`,
        sender: 'ai',
        text: result.reply,
        timestampSeconds: ts + 1,
        audioUrl: result.audio ? `data:audio/mp3;base64,${result.audio}` : null,
      },
      scorecardUpdate: { pb_01: 'in-progress' },
    };
  }

  async pauseSession(trainingId: string, sessionId: string, orgId: string) {
    const session = await this.repo.findSessionById(sessionId, orgId);
    if (session.scenario_id !== trainingId) throw new NotFoundException('Session not found');
    const messages = typeof session.messages_json === 'string'
      ? JSON.parse(session.messages_json)
      : session.messages_json || [];
    const elapsed = Math.floor((Date.now() - new Date(session.created_at).getTime()) / 1000);
    await this.repo.updateSessionLifecycle(sessionId, {
      lifecycle_status: 'paused',
      elapsed_seconds: elapsed,
    });
    return { success: true, status: 'paused' };
  }

  async resumeSession(trainingId: string, sessionId: string, orgId: string) {
    const session = await this.repo.findSessionById(sessionId, orgId);
    if (session.scenario_id !== trainingId) throw new NotFoundException('Session not found');
    await this.repo.updateSessionLifecycle(sessionId, { lifecycle_status: 'active' });
    return { success: true, status: 'active' };
  }

  async endSession(trainingId: string, sessionId: string, orgId: string) {
    const session = await this.repo.findSessionById(sessionId, orgId);
    if (session.scenario_id !== trainingId) throw new NotFoundException('Session not found');
    await this.repo.updateSessionLifecycle(sessionId, { lifecycle_status: 'completed' });
    setImmediate(() => {
      this.sessions.endSession(sessionId, orgId).catch(() => undefined);
    });
    return { success: true, status: 'completed' };
  }

  async getResults(trainingId: string, sessionId: string, orgId: string) {
    const session = await this.repo.findSessionById(sessionId, orgId);
    if (session.scenario_id !== trainingId) throw new NotFoundException('Session not found');

    let feedback = session.feedback_json;
    if (typeof feedback === 'string') {
      try { feedback = JSON.parse(feedback); } catch { feedback = null; }
    }

    return mapResults(session, feedback);
  }

  async getManagerDashboard(orgId: string) {
    const scenarios = await this.scenarios.findAll(orgId);
    // Filter out custom manager-created scenarios so they do not leak into default lists
    const systemScenarios = scenarios.filter((s: any) => !s.context_text?.trim().startsWith('{'));
    const allSessions = await this.repo.findAllSessions('rep_01', orgId).catch(() => []);

    return {
      activeTrainings: systemScenarios.slice(0, 3).map((s: any, i: number) => ({
        id: s.id,
        repId: 'rep_01',
        repName: 'Sarah Chen',
        trainingTitle: s.persona_name || 'Training',
        assignedDate: new Date().toISOString(),
        dueDateIso: new Date(Date.now() + 14 * 86400000).toISOString(),
      })),
      trainings: systemScenarios.slice(0, 5).map((s: any) => {
        const scenarioSessions = allSessions.filter((sess: any) => sess.scenario_id === s.id);
        const lastSessionId = scenarioSessions.length > 0 ? scenarioSessions[0].id : `session_${s.id}`;
        return {
          id: s.id,
          repId: 'rep_01',
          repName: 'Sarah Chen',
          trainingTitle: s.persona_name || 'Training',
          completedDate: new Date().toISOString(),
          overallScore: 82,
          overallRating: 'Good',
          lastSessionId,
          isReassigned: false,
        };
      }),
    };
  }

  async createManagerTraining(body: unknown, orgId: string) {
    const dto = body as Record<string, any>;
    const created = await this.scenarios.create(
      {
        persona_name: dto.persona?.name || 'Custom Persona',
        persona_type: dto.persona?.jobTitle || 'Decision Maker',
        difficulty: 'medium',
        context_text: JSON.stringify(dto),
        scenario_name: dto.trainingTitle || 'Custom Training',
      } as any,
      orgId,
      'manager',
    );
    return { success: true, trainingId: created.id };
  }

  async reassignTraining(trainingId: string, body: unknown, orgId: string) {
    const scenario = await this.scenarios.findOne(trainingId, orgId);
    const newId = `${trainingId}_reassign_${Date.now()}`;
    await this.scenarios.create(
      {
        persona_name: `${scenario.persona_name} (Reassigned)`,
        persona_type: scenario.persona_type,
        difficulty: scenario.difficulty,
        context_text: scenario.context_text,
      },
      orgId,
    );
    return { success: true, newTrainingId: newId };
  }
}
