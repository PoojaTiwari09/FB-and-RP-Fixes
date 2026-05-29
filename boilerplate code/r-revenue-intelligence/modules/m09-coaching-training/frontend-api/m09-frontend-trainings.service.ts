import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { z } from 'zod';
import { SessionsService, ScenariosService } from '../services/m09.service';
import { M09Repository } from '../repositories/m09.repository';
import {
  mapMessages,
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
    return items;
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
    return {
      sessionId,
      trainingId,
      status: session.lifecycle_status || (session.completed_at ? 'completed' : 'active'),
      elapsedSeconds: session.elapsed_seconds ?? 0,
      messageCount: messages.length,
      selectedVoiceId: session.selected_voice_id,
      messages: mapMessages(messages),
    };
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
    // TTS optional: audioUrl null until vendor wired — text-only works for AI trainer
    return {
      userMessage: { id: `u_${ts}`, text: dto.text, timestamp: ts },
      aiResponse: {
        id: `ai_${ts}`,
        text: result.reply,
        timestamp: ts + 1,
        audioUrl: result.audio ? `data:audio/mp3;base64,${result.audio}` : null,
      },
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
    return {
      message: 'Session paused',
      sessionId,
      status: 'paused',
      elapsedSeconds: elapsed,
      messageCount: messages.length,
    };
  }

  async resumeSession(trainingId: string, sessionId: string, orgId: string) {
    const session = await this.repo.findSessionById(sessionId, orgId);
    if (session.scenario_id !== trainingId) throw new NotFoundException('Session not found');
    await this.repo.updateSessionLifecycle(sessionId, { lifecycle_status: 'active' });
    return { message: 'Session resumed', sessionId, status: 'active' };
  }

  async endSession(trainingId: string, sessionId: string, orgId: string) {
    const session = await this.repo.findSessionById(sessionId, orgId);
    if (session.scenario_id !== trainingId) throw new NotFoundException('Session not found');
    await this.repo.updateSessionLifecycle(sessionId, { lifecycle_status: 'completed' });
    setImmediate(() => {
      this.sessions.endSession(sessionId, orgId).catch(() => undefined);
    });
    return {
      message: 'Session ended. Evaluation started.',
      sessionId,
      status: 'completed',
      resultsReady: false,
    };
  }

  async getResults(trainingId: string, sessionId: string, orgId: string) {
    const session = await this.repo.findSessionById(sessionId, orgId);
    if (session.scenario_id !== trainingId) throw new NotFoundException('Session not found');

    let feedback = session.feedback_json;
    if (typeof feedback === 'string') {
      try { feedback = JSON.parse(feedback); } catch { feedback = null; }
    }

    if (!feedback) {
      return {
        sessionId,
        trainingTitle: session.scenario?.persona_name || 'Training',
        resultsReady: false,
        status: 'processing',
      };
    }

    return {
      sessionId,
      trainingTitle: session.scenario?.persona_name || 'Training',
      resultsReady: true,
      overallScore: feedback.overall_score ?? 0,
      overallRating: (feedback.overall_score ?? 0) >= 80 ? 'Good' : 'Needs Practice',
      overallDescription: feedback.evaluation_summary || '',
      highlightBadges: (feedback.strengths || []).slice(0, 3).map((s: string) => ({
        label: s,
        type: 'positive',
      })),
      coachingPlaybook: [],
      performanceBreakdown: [],
      transcript: mapMessages(
        typeof session.messages_json === 'string'
          ? JSON.parse(session.messages_json)
          : session.messages_json,
      ),
    };
  }
}
