import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class M09Repository {
  constructor(private readonly prisma: PrismaService) {}

  // ─── USER QUERIES ───────────────────────────────────────────────────────────

  async getUserById(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async findUserByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  async createUser(data: any) {
    return this.prisma.user.create({
      data,
    });
  }

  async getManagerById(managerId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: managerId },
    });
    if (!user) throw new NotFoundException('Manager not found');
    return user;
  }

  async getRepIdsByOrgId(orgId: string, managerId?: string): Promise<string[]> {
    const whereClause: any = { org_id: orgId, role: 'rep' };
    if (managerId) whereClause.manager_id = managerId;
    const reps = await this.prisma.user.findMany({
      where: whereClause,
      select: { id: true },
    });
    return reps.map((r) => r.id);
  }

  async getRepsByOrgId(orgId: string, managerId?: string) {
    const whereClause: any = { org_id: orgId, role: 'rep' };
    if (managerId) whereClause.manager_id = managerId;
    return this.prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        email: true,
        status: true,
        manager_id: true,
        created_at: true,
      },
    });
  }

  // ─── SCENARIO QUERIES ───────────────────────────────────────────────────────

  async findAllScenarios(orgId: string) {
    return this.prisma.trainingScenario.findMany({
      where: { org_id: orgId },
      orderBy: { created_at: 'desc' },
    });
  }

  async findScenarioById(id: string, orgId: string) {
    const scenario = await this.prisma.trainingScenario.findFirst({
      where: { id, org_id: orgId },
    });
    if (!scenario) throw new NotFoundException('Scenario not found');
    return scenario;
  }

  async createScenario(orgId: string, managerId: string, data: any) {
    return this.prisma.trainingScenario.create({
      data: {
        org_id: orgId,
        manager_id: managerId,
        persona_name: data.persona_name,
        persona_type: data.persona_type,
        difficulty: data.difficulty,
        context_text: data.context_text,
        custom_prompt: data.custom_prompt,
        voice_id: data.voice_id,
      },
    });
  }

  async updateScenario(id: string, orgId: string, data: any) {
    const scenario = await this.findScenarioById(id, orgId);
    return this.prisma.trainingScenario.update({
      where: { id: scenario.id },
      data: {
        persona_name: data.persona_name,
        persona_type: data.persona_type,
        difficulty: data.difficulty,
        context_text: data.context_text,
        custom_prompt: data.custom_prompt,
        voice_id: data.voice_id,
      },
    });
  }

  async deleteScenario(id: string, orgId: string) {
    const scenario = await this.findScenarioById(id, orgId);
    return this.prisma.trainingScenario.delete({
      where: { id: scenario.id },
    });
  }

  async findScenarioByDifficulty(difficulty: string) {
    return this.prisma.trainingScenario.findFirst({
      where: { difficulty },
    });
  }

  // ─── SESSION QUERIES ────────────────────────────────────────────────────────

  private parseSession(session: any) {
    if (!session) return session;
    const s = { ...session };
    if (typeof s.messages_json === 'string') {
      try {
        s.messages_json = JSON.parse(s.messages_json);
      } catch {
        s.messages_json = [];
      }
    }
    if (typeof s.feedback_json === 'string') {
      try {
        s.feedback_json = JSON.parse(s.feedback_json);
      } catch {
        s.feedback_json = null;
      }
    }
    return s;
  }

  async findAllSessions(repId: string, orgId: string) {
    const sessions = await this.prisma.trainingSession.findMany({
      where: {
        rep_id: repId,
        scenario: { org_id: orgId },
      },
      include: { scenario: true },
      orderBy: { created_at: 'desc' },
    });
    return sessions.map((s) => this.parseSession(s));
  }

  async findCompletedSessions(repId: string, orgId: string) {
    const sessions = await this.prisma.trainingSession.findMany({
      where: {
        rep_id: repId,
        scenario: { org_id: orgId },
        completed_at: { not: null },
        feedback_json: { not: null },
        is_practice: false,
      },
      include: { scenario: true },
      orderBy: { completed_at: 'desc' },
    });
    return sessions.map((s) => this.parseSession(s));
  }

  async findSessionById(id: string, orgId: string) {
    const session = await this.prisma.trainingSession.findFirst({
      where: {
        id,
        rep: { org_id: orgId },
      },
      include: { scenario: true, rep: true },
    });
    if (!session) throw new NotFoundException('Session not found');
    return this.parseSession(session);
  }

  async findSessionByIdWithoutOrg(id: string) {
    const session = await this.prisma.trainingSession.findUnique({
      where: { id },
      include: { scenario: true },
    });
    if (!session) throw new NotFoundException('Session not found');
    return this.parseSession(session);
  }

  async createSession(data: {
    rep_id: string;
    scenario_id: string;
    messages_json: any[];
    selected_voice_id?: string;
    is_practice?: boolean;
  }) {
    const session = await this.prisma.trainingSession.create({
      data: {
        rep_id: data.rep_id,
        scenario_id: data.scenario_id,
        messages_json: JSON.stringify(data.messages_json),
        selected_voice_id: data.selected_voice_id || 'Xb7hH8MSUJpSbSDYk0k2',
        is_practice: data.is_practice ?? false,
      },
    });
    return this.parseSession(session);
  }

  async updateSessionMessages(id: string, messages: any[]) {
    return this.prisma.trainingSession.update({
      where: { id },
      data: { messages_json: JSON.stringify(messages) },
    });
  }

  async updateSessionHintsUsed(id: string) {
    return this.prisma.trainingSession.update({
      where: { id },
      data: { hints_used: { increment: 1 } },
    });
  }

  async updateSessionFeedback(id: string, feedback: any, completedAt: Date) {
    await this.prisma.trainingSession.update({
      where: { id },
      data: {
        feedback_json: JSON.stringify(feedback),
        completed_at: completedAt,
      },
    });
  }

  async findRecentSessions(repId: string, limit: number = 5) {
    const sessions = await this.prisma.trainingSession.findMany({
      where: {
        rep_id: repId,
        feedback_json: { not: null },
        is_practice: false,
      },
      orderBy: { created_at: 'desc' },
      take: limit,
    });
    return sessions.map((s) => this.parseSession(s));
  }

  async getVoices() {
    return this.prisma.aiVoice.findMany({
      where: { is_active: true },
      orderBy: { name: 'asc' },
    });
  }

  // ─── ASSIGNMENT QUERIES ────────────────────────────────────────────────────

  private mapAssignments(assignments: any[]) {
    const now = new Date();
    return assignments.map(a => {
      const isOverdue = a.status !== 'Completed' && a.deadline && new Date(a.deadline) < now;
      const progress = a.status === 'Completed' ? 100 : (a.best_score || 0);
      return { ...a, is_overdue: isOverdue, progress };
    });
  }

  async bulkCreateAssignments(assignments: any[]) {
    return this.prisma.trainingAssignment.createMany({
      data: assignments,
    });
  }

  async findAssignmentsByRep(repId: string, orgId: string) {
    const assignments = await this.prisma.trainingAssignment.findMany({
      where: {
        rep_id: repId,
        rep: { org_id: orgId },
      },
      include: { scenario: true, rep: true },
      orderBy: { assigned_at: 'desc' },
    });
    return this.mapAssignments(assignments);
  }

  async findAssignmentsByManager(managerId: string, orgId: string) {
    const assignments = await this.prisma.trainingAssignment.findMany({
      where: {
        manager_id: managerId,
        rep: { org_id: orgId },
      },
      include: { scenario: true, rep: true },
      orderBy: { assigned_at: 'desc' },
    });
    return this.mapAssignments(assignments);
  }

  async findAssignmentsByOrg(orgId: string) {
    const assignments = await this.prisma.trainingAssignment.findMany({
      where: {
        rep: { org_id: orgId },
      },
      include: { scenario: true, rep: true },
      orderBy: { assigned_at: 'desc' },
    });
    return this.mapAssignments(assignments);
  }

  async updateAssignment(id: string, data: any, managerId: string) {
    return this.prisma.trainingAssignment.update({
      where: { id, manager_id: managerId },
      data,
    });
  }

  async deleteAssignment(id: string, managerId: string) {
    return this.prisma.trainingAssignment.delete({
      where: { id, manager_id: managerId },
    });
  }

  async findAssignmentById(id: string) {
    return this.prisma.trainingAssignment.findUnique({
      where: { id },
      include: { scenario: true, rep: true },
    });
  }

  async findAssignmentBySessionId(sessionId: string) {
    return this.prisma.trainingAssignment.findFirst({
      where: { session_id: sessionId },
    });
  }

  async findAssignmentByBestSessionId(sessionId: string) {
    return this.prisma.trainingAssignment.findFirst({
      where: { best_session_id: sessionId },
    });
  }

  async findAssignmentForRepSession(sessionId: string, repId: string, scenarioId?: string) {
    const bySession = await this.findAssignmentBySessionId(sessionId);
    if (bySession) return bySession;

    const byBest = await this.findAssignmentByBestSessionId(sessionId);
    if (byBest) return byBest;

    if (!scenarioId) return null;

    return this.prisma.trainingAssignment.findFirst({
      where: {
        rep_id: repId,
        scenario_id: scenarioId,
      },
      orderBy: { assigned_at: 'desc' },
    });
  }

  async updateAssignmentById(id: string, data: any) {
    return this.prisma.trainingAssignment.update({
      where: { id },
      data,
    });
  }

  // ─── COACHING QUERIES ──────────────────────────────────────────────────────

  async findCoachingNotesByManager(managerId: string, orgId: string) {
    return this.prisma.coachingNote.findMany({
      where: { manager_id: managerId, org_id: orgId },
      include: { rep: true },
      orderBy: { created_at: 'desc' },
    });
  }

  async findCoachingNotesByRep(repId: string, orgId: string) {
    return this.prisma.coachingNote.findMany({
      where: { rep_id: repId, org_id: orgId },
      orderBy: { created_at: 'desc' },
    });
  }

  async createCoachingNote(data: {
    rep_id: string;
    manager_id?: string;
    org_id: string;
    content: string;
    priority: string;
    is_agent_generated?: boolean;
    weakest_skill?: string;
  }) {
    return this.prisma.coachingNote.create({
      data: {
        rep_id: data.rep_id,
        manager_id: data.manager_id,
        org_id: data.org_id,
        content: data.content,
        priority: data.priority,
        is_agent_generated: data.is_agent_generated ?? false,
        weakest_skill: data.weakest_skill,
      },
    });
  }

  async findRecommendations(repId: string) {
    return this.prisma.coachingRecommendation.findMany({
      where: { rep_id: repId, status: 'active' },
      orderBy: { generated_at: 'desc' },
    });
  }

  async createRecommendation(data: {
    rep_id: string;
    focus_area: string;
    weakest_skill: string;
    recommendation_text: string;
    suggested_action: string;
    priority: string;
  }) {
    return this.prisma.coachingRecommendation.create({
      data,
    });
  }

  // ─── ANALYTICS JOINS & AGGREGATES ──────────────────────────────────────────

  async getSessionsByRepIds(repIds: string[]) {
    const sessions = await this.prisma.trainingSession.findMany({
      where: { rep_id: { in: repIds }, is_practice: false },
      include: { scenario: true },
    });
    return sessions.map((s) => this.parseSession(s));
  }

  async getAssignmentsByRepIds(repIds: string[]) {
    return this.prisma.trainingAssignment.findMany({
      where: { rep_id: { in: repIds } },
      include: { scenario: true, rep: true },
    });
  }

  async findOverdueAssignments() {
    return this.prisma.trainingAssignment.findMany({
      where: {
        status: { in: ['Pending', 'In Progress'] },
        deadline: { lt: new Date() },
      },
      include: {
        rep: true,
        scenario: true,
      },
    });
  }
}
