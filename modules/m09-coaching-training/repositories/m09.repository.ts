import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { m09MemoryStore, M09MemoryStore, isUuid } from './m09-memory.store';
import {
  scenarioFromUnified,
  scenarioToUnified,
  sessionFromUnified,
  sessionToUnified,
} from './m09-prisma-mappers';
import { randomUUID } from 'crypto';

@Injectable()
export class M09Repository {
  private readonly store: M09MemoryStore = m09MemoryStore;

  constructor(private readonly prisma: PrismaService) {}

  /** Legacy module-local Prisma models (TrainingScenario, …) — absent on unified client. */
  private hasLegacyModels(): boolean {
    return Boolean((this.prisma as any).trainingScenario);
  }

  private scenarioDelegate(): any | null {
    return (this.prisma as any).trainerscenarios ?? null;
  }

  private sessionDelegate(): any | null {
    return (this.prisma as any).trainersessions ?? null;
  }

  private unifiedUserDelegate(): any | null {
    const p = this.prisma as any;
    if (p.user?.findUnique) return p.user;
    return null;
  }

  private mapUnifiedUser(u: any) {
    return {
      id: u.id,
      email: u.email,
      name: u.name,
      role: String(u.role).toLowerCase(),
      status: 'active',
      org_id: u.tenantId,
      manager_id: null,
      password: u.passwordHash,
      created_at: u.createdAt,
    };
  }

  // ─── USER ───────────────────────────────────────────────────────────────────

  async getUserById(userId: string) {
    const mem = this.store.users.get(userId);
    if (mem) return mem;

    const delegate = this.unifiedUserDelegate();
    if (delegate) {
      const u = await delegate.findUnique({ where: { id: userId } });
      if (!u) throw new NotFoundException('User not found');
      return this.mapUnifiedUser(u);
    }

    if (this.hasLegacyModels()) {
      const user = await (this.prisma as any).user.findUnique({ where: { id: userId } });
      if (!user) throw new NotFoundException('User not found');
      return user;
    }

    throw new NotFoundException('User not found');
  }

  async findUserByEmail(email: string) {
    for (const u of this.store.users.values()) {
      if (u.email === email) return u;
    }
    const delegate = this.unifiedUserDelegate();
    if (delegate) {
      const u = await delegate.findFirst({ where: { email } });
      return u ? this.mapUnifiedUser(u) : null;
    }
    if (this.hasLegacyModels()) {
      return (this.prisma as any).user.findUnique({ where: { email } });
    }
    return null;
  }

  async createUser(data: any) {
    const id = data.id || randomUUID();
    const row = {
      id,
      email: data.email,
      name: data.name,
      role: data.role,
      status: data.status || 'active',
      org_id: data.org_id,
      manager_id: data.manager_id ?? null,
      password: data.password,
      created_at: new Date(),
    };
    this.store.users.set(id, row);
    return row;
  }

  async getManagerById(managerId: string) {
    return this.getUserById(managerId);
  }

  async getRepIdsByOrgId(orgId: string, managerId?: string): Promise<string[]> {
    const reps: string[] = [];
    for (const u of this.store.users.values()) {
      if (u.org_id === orgId && u.role === 'rep') {
        if (!managerId || u.manager_id === managerId) reps.push(u.id);
      }
    }
    if (reps.length) return reps;
    if (this.hasLegacyModels()) {
      const where: any = { org_id: orgId, role: 'rep' };
      if (managerId) where.manager_id = managerId;
      const rows = await (this.prisma as any).user.findMany({ where, select: { id: true } });
      return rows.map((r: any) => r.id);
    }
    return [];
  }

  async getRepsByOrgId(orgId: string, managerId?: string) {
    const out: any[] = [];
    for (const u of this.store.users.values()) {
      if (u.org_id === orgId && u.role === 'rep') {
        if (!managerId || u.manager_id === managerId) {
          out.push({
            id: u.id,
            name: u.name,
            email: u.email,
            status: u.status,
            manager_id: u.manager_id,
            created_at: u.created_at,
          });
        }
      }
    }
    if (out.length) return out;
    if (this.hasLegacyModels()) {
      const where: any = { org_id: orgId, role: 'rep' };
      if (managerId) where.manager_id = managerId;
      return (this.prisma as any).user.findMany({ where, select: { id: true, name: true, email: true, status: true, manager_id: true, created_at: true } });
    }
    return [];
  }

  // ─── SCENARIOS ──────────────────────────────────────────────────────────────

  async findAllScenarios(orgId: string) {
    const mem = [...this.store.scenarios.values()].filter((s) => s.org_id === orgId);
    if (mem.length) return mem.sort((a, b) => b.created_at.getTime() - a.created_at.getTime());

    const delegate = this.scenarioDelegate();
    if (delegate) {
      const rows = await delegate.findMany({
        where: { tenantid: orgId },
        orderBy: { createdat: 'desc' },
      });
      return rows.map(scenarioFromUnified);
    }

    if (this.hasLegacyModels()) {
      return (this.prisma as any).trainingScenario.findMany({
        where: { org_id: orgId },
        orderBy: { created_at: 'desc' },
      });
    }
    return [];
  }

  async findScenarioById(id: string, orgId: string) {
    const mem = this.store.scenarios.get(id);
    if (mem && mem.org_id === orgId) return mem;

    const delegate = this.scenarioDelegate();
    if (delegate) {
      const row = await delegate.findFirst({ where: { scenarioid: id, tenantid: orgId } });
      if (!row) throw new NotFoundException('Scenario not found');
      return scenarioFromUnified(row);
    }

    if (this.hasLegacyModels()) {
      const scenario = await (this.prisma as any).trainingScenario.findFirst({
        where: { id, org_id: orgId },
      });
      if (!scenario) throw new NotFoundException('Scenario not found');
      return scenario;
    }
    throw new NotFoundException('Scenario not found');
  }

  async createScenario(orgId: string, managerId: string, data: any) {
    const id = randomUUID();
    const row = {
      id,
      org_id: orgId,
      manager_id: managerId,
      persona_name: data.persona_name,
      persona_type: data.persona_type,
      difficulty: data.difficulty,
      context_text: data.context_text,
      custom_prompt: data.custom_prompt,
      voice_id: data.voice_id,
      created_at: new Date(),
    };
    this.store.scenarios.set(id, row);

    const delegate = this.scenarioDelegate();
    if (delegate && isUuid(id) && isUuid(orgId) && isUuid(managerId)) {
      try {
        await delegate.create({
          data: { scenarioid: id, ...scenarioToUnified(orgId, managerId, data) },
        });
      } catch {
        // dashboards table may be absent — memory row is sufficient for dev smoke.
      }
    } else if (this.hasLegacyModels()) {
      return (this.prisma as any).trainingScenario.create({ data: { ...row } });
    }
    return row;
  }

  async updateScenario(id: string, orgId: string, data: any) {
    const existing = await this.findScenarioById(id, orgId);
    const updated = { ...existing, ...data };
    this.store.scenarios.set(id, updated);
    if (this.hasLegacyModels()) {
      return (this.prisma as any).trainingScenario.update({ where: { id }, data });
    }
    return updated;
  }

  async deleteScenario(id: string, orgId: string) {
    await this.findScenarioById(id, orgId);
    this.store.scenarios.delete(id);
    const delegate = this.scenarioDelegate();
    if (delegate) {
      await delegate.deleteMany({ where: { scenarioid: id, tenantid: orgId } });
    } else if (this.hasLegacyModels()) {
      return (this.prisma as any).trainingScenario.delete({ where: { id } });
    }
    return { id };
  }

  async findScenarioByDifficulty(difficulty: string) {
    for (const s of this.store.scenarios.values()) {
      if (s.difficulty === difficulty) return s;
    }
    const delegate = this.scenarioDelegate();
    if (delegate) {
      const row = await delegate.findFirst({ where: { difficulty } });
      return row ? scenarioFromUnified(row) : null;
    }
    if (this.hasLegacyModels()) {
      return (this.prisma as any).trainingScenario.findFirst({ where: { difficulty } });
    }
    return null;
  }

  // ─── SESSIONS ───────────────────────────────────────────────────────────────

  private parseSession(session: any) {
    return this.store.parseSession(session);
  }

  async findAllSessions(repId: string, orgId: string) {
    const sessions = [...this.store.sessions.values()].filter(
      (s) => s.rep_id === repId && this.store.scenarios.get(s.scenario_id)?.org_id === orgId,
    );
    if (sessions.length) {
      return sessions.map((s) => this.parseSession(s)).sort((a, b) => b.created_at.getTime() - a.created_at.getTime());
    }

    const delegate = this.sessionDelegate();
    if (delegate) {
      const rows = await delegate.findMany({
        where: { userid: repId, tenantid: orgId },
        orderBy: { createdat: 'desc' },
      });
      return Promise.all(
        rows.map(async (r: any) => {
          const sc = await this.findScenarioById(r.scenarioid, orgId).catch(() => null);
          return this.parseSession(sessionFromUnified(r, sc));
        }),
      );
    }

    if (this.hasLegacyModels()) {
      const rows = await (this.prisma as any).trainingSession.findMany({
        where: { rep_id: repId, scenario: { org_id: orgId } },
        include: { scenario: true },
        orderBy: { created_at: 'desc' },
      });
      return rows.map((s: any) => this.parseSession(s));
    }
    return [];
  }

  async findCompletedSessions(repId: string, orgId: string) {
    const all = await this.findAllSessions(repId, orgId);
    return all.filter((s: any) => s.completed_at && s.feedback_json && !s.is_practice);
  }

  async findSessionById(id: string, orgId: string) {
    const mem = this.store.sessions.get(id);
    if (mem) {
      const sc = this.store.scenarios.get(mem.scenario_id);
      if (sc?.org_id !== orgId) throw new NotFoundException('Session not found');
      const parsed = this.parseSession(mem);
      parsed.scenario = sc;
      return parsed;
    }

    const delegate = this.sessionDelegate();
    if (delegate) {
      const row = await delegate.findFirst({ where: { sessionid: id, tenantid: orgId } });
      if (!row) throw new NotFoundException('Session not found');
      const sc = await this.findScenarioById(row.scenarioid, orgId);
      return this.parseSession(sessionFromUnified(row, sc));
    }

    if (this.hasLegacyModels()) {
      const session = await (this.prisma as any).trainingSession.findFirst({
        where: { id, rep: { org_id: orgId } },
        include: { scenario: true, rep: true },
      });
      if (!session) throw new NotFoundException('Session not found');
      return this.parseSession(session);
    }
    throw new NotFoundException('Session not found');
  }

  async findSessionByIdWithoutOrg(id: string) {
    const mem = this.store.sessions.get(id);
    if (mem) return this.parseSession(mem);
    if (this.hasLegacyModels()) {
      const session = await (this.prisma as any).trainingSession.findUnique({
        where: { id },
        include: { scenario: true },
      });
      if (!session) throw new NotFoundException('Session not found');
      return this.parseSession(session);
    }
    throw new NotFoundException('Session not found');
  }

  async createSession(data: {
    rep_id: string;
    scenario_id: string;
    messages_json: any[];
    selected_voice_id?: string;
    is_practice?: boolean;
  }) {
    const scenario = this.store.scenarios.get(data.scenario_id);
    const orgId = scenario?.org_id;
    const id = randomUUID();
    const row = {
      id,
      rep_id: data.rep_id,
      scenario_id: data.scenario_id,
      messages_json: data.messages_json,
      feedback_json: null,
      selected_voice_id: data.selected_voice_id || 'Xb7hH8MSUJpSbSDYk0k2',
      is_practice: data.is_practice ?? false,
      hints_used: 0,
      lifecycle_status: 'active' as 'completed' | 'active' | 'paused',
      elapsed_seconds: 0,
      created_at: new Date(),
      completed_at: null,
    };
    this.store.sessions.set(id, row);

    const delegate = this.sessionDelegate();
    const canPersistUnified =
      delegate &&
      orgId &&
      isUuid(id) &&
      isUuid(data.scenario_id) &&
      isUuid(data.rep_id) &&
      isUuid(orgId);
    if (canPersistUnified) {
      try {
        await delegate.create({
          data: {
            sessionid: id,
            ...sessionToUnified(orgId, data),
            conversation: data.messages_json,
          },
        });
      } catch {
        // Unified DB may lack tables or RLS — in-memory session remains authoritative for dev.
      }
    } else if (this.hasLegacyModels()) {
      const session = await (this.prisma as any).trainingSession.create({
        data: {
          rep_id: data.rep_id,
          scenario_id: data.scenario_id,
          messages_json: JSON.stringify(data.messages_json),
          selected_voice_id: data.selected_voice_id,
          is_practice: data.is_practice ?? false,
        },
      });
      return this.parseSession(session);
    }
    return this.parseSession(row);
  }

  async updateSessionLifecycle(
    id: string,
    patch: { lifecycle_status?: 'active' | 'paused' | 'completed'; elapsed_seconds?: number },
  ) {
    const s = this.store.sessions.get(id);
    if (!s) throw new NotFoundException('Session not found');
    if (patch.lifecycle_status) s.lifecycle_status = patch.lifecycle_status;
    if (patch.elapsed_seconds != null) s.elapsed_seconds = patch.elapsed_seconds;
    return this.parseSession(s);
  }

  async updateSessionMessages(id: string, messages: any[]) {
    const s = this.store.sessions.get(id);
    if (s) {
      s.messages_json = messages;
      const delegate = this.sessionDelegate();
      if (delegate) {
        await delegate.update({
          where: { sessionid: id },
          data: { conversation: messages },
        });
      }
      return s;
    }
    if (this.hasLegacyModels()) {
      return (this.prisma as any).trainingSession.update({
        where: { id },
        data: { messages_json: JSON.stringify(messages) },
      });
    }
    throw new NotFoundException('Session not found');
  }

  async updateSessionHintsUsed(id: string) {
    const s = this.store.sessions.get(id);
    if (s) {
      s.hints_used += 1;
      return s;
    }
    if (this.hasLegacyModels()) {
      return (this.prisma as any).trainingSession.update({
        where: { id },
        data: { hints_used: { increment: 1 } },
      });
    }
    throw new NotFoundException('Session not found');
  }

  async updateSessionFeedback(id: string, feedback: any, completedAt: Date) {
    const s = this.store.sessions.get(id);
    if (s) {
      s.feedback_json = feedback;
      s.completed_at = completedAt;
      const delegate = this.sessionDelegate();
      if (delegate) {
        await delegate.update({
          where: { sessionid: id },
          data: { scorecardresult: feedback, completedat: completedAt, status: 'completed' },
        });
      }
      return;
    }
    if (this.hasLegacyModels()) {
      await (this.prisma as any).trainingSession.update({
        where: { id },
        data: { feedback_json: JSON.stringify(feedback), completed_at: completedAt },
      });
      return;
    }
    throw new NotFoundException('Session not found');
  }

  async findRecentSessions(repId: string, limit: number = 5) {
    const all = [...this.store.sessions.values()]
      .filter((s) => s.rep_id === repId && s.feedback_json && !s.is_practice)
      .sort((a, b) => (b.completed_at?.getTime() || 0) - (a.completed_at?.getTime() || 0))
      .slice(0, limit);
    return all.map((s) => this.parseSession(s));
  }

  async getVoices() {
    const voices = [...this.store.voices.values()].filter((v) => v.is_active);
    if (voices.length) return voices.sort((a, b) => a.name.localeCompare(b.name));
    if (this.hasLegacyModels()) {
      return (this.prisma as any).aiVoice.findMany({
        where: { is_active: true },
        orderBy: { name: 'asc' },
      });
    }
    return voices;
  }

  // ─── ASSIGNMENTS (memory-only until unified model exists) ─────────────────

  private mapAssignments(assignments: any[]) {
    const now = new Date();
    return assignments.map((a) => {
      const isOverdue = a.status !== 'Completed' && a.deadline && new Date(a.deadline) < now;
      const progress = a.status === 'Completed' ? 100 : a.best_score || 0;
      return { ...a, is_overdue: isOverdue, progress };
    });
  }

  async bulkCreateAssignments(assignments: any[]) {
    for (const a of assignments) {
      const id = a.id || randomUUID();
      this.store.assignments.set(id, { ...a, id, assigned_at: a.assigned_at || new Date() });
    }
    if (this.hasLegacyModels()) {
      return (this.prisma as any).trainingAssignment.createMany({ data: assignments });
    }
    return { count: assignments.length };
  }

  async findAssignmentsByRep(repId: string, orgId: string) {
    const rows = [...this.store.assignments.values()].filter(
      (a) => a.rep_id === repId && this.store.users.get(a.rep_id)?.org_id === orgId,
    );
    return this.mapAssignments(
      rows.map((a) => ({
        ...a,
        scenario: this.store.scenarios.get(a.scenario_id),
        rep: this.store.users.get(a.rep_id),
      })),
    );
  }

  async findAssignmentsByManager(managerId: string, orgId: string) {
    const rows = [...this.store.assignments.values()].filter(
      (a) => a.manager_id === managerId && this.store.users.get(a.rep_id)?.org_id === orgId,
    );
    return this.mapAssignments(
      rows.map((a) => ({
        ...a,
        scenario: this.store.scenarios.get(a.scenario_id),
        rep: this.store.users.get(a.rep_id),
      })),
    );
  }

  async findAssignmentsByOrg(orgId: string) {
    const rows = [...this.store.assignments.values()].filter(
      (a) => this.store.users.get(a.rep_id)?.org_id === orgId,
    );
    return this.mapAssignments(rows);
  }

  async updateAssignment(id: string, data: any, managerId: string) {
    const a = this.store.assignments.get(id);
    if (!a || a.manager_id !== managerId) throw new NotFoundException('Assignment not found');
    Object.assign(a, data);
    return a;
  }

  async deleteAssignment(id: string, managerId: string) {
    const a = this.store.assignments.get(id);
    if (!a || a.manager_id !== managerId) throw new NotFoundException('Assignment not found');
    this.store.assignments.delete(id);
    return a;
  }

  async findAssignmentById(id: string) {
    const a = this.store.assignments.get(id);
    if (!a) return null;
    return {
      ...a,
      scenario: this.store.scenarios.get(a.scenario_id),
      rep: this.store.users.get(a.rep_id),
    };
  }

  async findAssignmentBySessionId(sessionId: string) {
    for (const a of this.store.assignments.values()) {
      if (a.session_id === sessionId) return a;
    }
    return null;
  }

  async findAssignmentByBestSessionId(sessionId: string) {
    for (const a of this.store.assignments.values()) {
      if (a.best_session_id === sessionId) return a;
    }
    return null;
  }

  async findAssignmentForRepSession(sessionId: string, repId: string, scenarioId?: string) {
    const bySession = await this.findAssignmentBySessionId(sessionId);
    if (bySession) return bySession;
    const byBest = await this.findAssignmentByBestSessionId(sessionId);
    if (byBest) return byBest;
    if (!scenarioId) return null;
    for (const a of this.store.assignments.values()) {
      if (a.rep_id === repId && a.scenario_id === scenarioId) return a;
    }
    return null;
  }

  async updateAssignmentById(id: string, data: any) {
    const a = this.store.assignments.get(id);
    if (!a) throw new NotFoundException('Assignment not found');
    Object.assign(a, data);
    return a;
  }

  // ─── COACHING (memory) ─────────────────────────────────────────────────────

  async findCoachingNotesByManager(managerId: string, orgId: string) {
    return [...this.store.notes.values()]
      .filter((n) => n.manager_id === managerId && n.org_id === orgId)
      .map((n) => ({ ...n, rep: this.store.users.get(n.rep_id) }))
      .sort((a, b) => b.created_at.getTime() - a.created_at.getTime());
  }

  async findCoachingNotesByRep(repId: string, orgId: string) {
    return [...this.store.notes.values()]
      .filter((n) => n.rep_id === repId && n.org_id === orgId)
      .sort((a, b) => b.created_at.getTime() - a.created_at.getTime());
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
    const id = randomUUID();
    const row = {
      id,
      ...data,
      is_agent_generated: data.is_agent_generated ?? false,
      created_at: new Date(),
    };
    this.store.notes.set(id, row as any);
    return row;
  }

  async findRecommendations(repId: string) {
    return [...this.store.recommendations.values()]
      .filter((r) => r.rep_id === repId && r.status === 'active')
      .sort((a, b) => b.generated_at.getTime() - a.generated_at.getTime());
  }

  async createRecommendation(data: {
    rep_id: string;
    focus_area: string;
    weakest_skill: string;
    recommendation_text: string;
    suggested_action: string;
    priority: string;
  }) {
    const id = randomUUID();
    const row = { id, ...data, status: 'active', generated_at: new Date() };
    this.store.recommendations.set(id, row);
    return row;
  }

  // ─── ANALYTICS ────────────────────────────────────────────────────────────

  async getSessionsByRepIds(repIds: string[]) {
    const sessions = [...this.store.sessions.values()].filter(
      (s) => repIds.includes(s.rep_id) && !s.is_practice,
    );
    return sessions.map((s) => this.parseSession(s));
  }

  async getAssignmentsByRepIds(repIds: string[]) {
    return [...this.store.assignments.values()].filter((a) => repIds.includes(a.rep_id));
  }

  async findOverdueAssignments() {
    const now = new Date();
    return [...this.store.assignments.values()].filter(
      (a) => ['Pending', 'In Progress'].includes(a.status) && a.deadline < now,
    );
  }

  /** Seed in-memory test corpus (used by /test/seed and /test/smoke). */
  seedTestData(hashedPassword: string) {
    return this.store.seedDefaults(hashedPassword);
  }
}
