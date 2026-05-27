/**
 * In-memory + unified-Prisma storage for M09.
 * Used when legacy Prisma models (TrainingScenario, User.org_id, …) are absent
 * from @rri/database — maps to dashboards.trainerscenarios / trainersessions when present.
 */

import { randomUUID } from 'crypto';

export const M09_DEV_ORG_ID = '00000000-0000-0000-0000-000000000001';
export const M09_DEV_MANAGER_ID = '00000000-0000-0000-0000-000000000002';
export const M09_DEV_REP_ID = '00000000-0000-0000-0000-000000000003';
export const M09_DEV_SCENARIO_1 = '00000000-0000-0000-0000-000000000101';
export const M09_DEV_SCENARIO_2 = '00000000-0000-0000-0000-000000000102';

export function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

type UserRow = {
  id: string;
  email: string;
  name: string;
  role: string;
  status: string;
  org_id: string;
  manager_id?: string | null;
  password?: string | null;
  created_at: Date;
};

type ScenarioRow = {
  id: string;
  org_id: string;
  persona_name: string;
  persona_type: string;
  context_text: string;
  difficulty: string;
  custom_prompt?: string | null;
  voice_id?: string | null;
  manager_id?: string | null;
  created_at: Date;
};

type SessionRow = {
  id: string;
  rep_id: string;
  scenario_id: string;
  manager_id?: string | null;
  messages_json: any;
  feedback_json: any | null;
  selected_voice_id?: string | null;
  completed_at?: Date | null;
  created_at: Date;
  is_practice: boolean;
  hints_used: number;
  scenario?: ScenarioRow;
  rep?: UserRow;
};

type AssignmentRow = {
  id: string;
  rep_id: string;
  scenario_id: string;
  manager_id: string;
  session_id?: string | null;
  status: string;
  priority: string;
  deadline: Date;
  assigned_at: Date;
  completed_at?: Date | null;
  attempt_count: number;
  max_attempts?: number | null;
  max_hints?: number | null;
  best_score: number;
  best_session_id?: string | null;
  manager_score?: number | null;
  manager_note?: string | null;
  scenario?: ScenarioRow;
  rep?: UserRow;
};

type VoiceRow = { id: string; name: string; is_active: boolean };

type NoteRow = {
  id: string;
  rep_id: string;
  manager_id?: string | null;
  org_id: string;
  content: string;
  priority: string;
  is_agent_generated: boolean;
  weakest_skill?: string | null;
  created_at: Date;
  rep?: UserRow;
};

type RecommendationRow = {
  id: string;
  rep_id: string;
  focus_area: string;
  weakest_skill: string;
  recommendation_text: string;
  suggested_action: string;
  priority: string;
  status: string;
  generated_at: Date;
};

export class M09MemoryStore {
  users = new Map<string, UserRow>();
  scenarios = new Map<string, ScenarioRow>();
  sessions = new Map<string, SessionRow>();
  assignments = new Map<string, AssignmentRow>();
  voices = new Map<string, VoiceRow>();
  notes = new Map<string, NoteRow>();
  recommendations = new Map<string, RecommendationRow>();

  seedDefaults(hashedPassword: string) {
    const orgId = M09_DEV_ORG_ID;
    const manager: UserRow = {
      id: M09_DEV_MANAGER_ID,
      email: 'manager@example.com',
      name: 'John Manager',
      role: 'manager',
      status: 'active',
      password: hashedPassword,
      org_id: orgId,
      created_at: new Date(),
    };
    const rep: UserRow = {
      id: M09_DEV_REP_ID,
      email: 'rep@example.com',
      name: 'Sarah SalesRep',
      role: 'rep',
      status: 'active',
      password: hashedPassword,
      org_id: orgId,
      manager_id: manager.id,
      created_at: new Date(),
    };
    this.users.set(manager.id, manager);
    this.users.set(rep.id, rep);

    for (const v of [
      { id: 'Xb7hH8MSUJpSbSDYk0k2', name: 'Rachel', is_active: true },
      { id: '21m00Tcm4TlvDq8ikWAM', name: 'Rachel (Old)', is_active: true },
    ]) {
      this.voices.set(v.id, v);
    }

    const scenarios: ScenarioRow[] = [
      {
        id: M09_DEV_SCENARIO_1,
        org_id: orgId,
        manager_id: manager.id,
        persona_name: 'Objection Oliver (Enterprise Buyer)',
        persona_type: 'competitive',
        difficulty: 'intermediate',
        context_text:
          'You are Oliver, an enterprise software buyer who is highly skeptical of cloud migration.',
        custom_prompt: 'Respond with pricing objections.',
        voice_id: 'Xb7hH8MSUJpSbSDYk0k2',
        created_at: new Date(),
      },
      {
        id: M09_DEV_SCENARIO_2,
        org_id: orgId,
        manager_id: manager.id,
        persona_name: 'Closing Clara (Startup CEO)',
        persona_type: 'assertive',
        difficulty: 'advanced',
        context_text: 'You are Clara, CEO of a high-growth tech startup.',
        custom_prompt: 'Assess speed and agility.',
        voice_id: '21m00Tcm4TlvDq8ikWAM',
        created_at: new Date(),
      },
    ];
    for (const s of scenarios) this.scenarios.set(s.id, s);

    return { orgId, managerId: manager.id, repId: rep.id };
  }

  attachScenario(session: SessionRow): SessionRow {
    const scenario = this.scenarios.get(session.scenario_id);
    const rep = this.users.get(session.rep_id);
    return { ...session, scenario, rep };
  }

  parseSession(session: SessionRow): SessionRow {
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
    return this.attachScenario(s);
  }
}

/** Process-wide dev store (per-pod; acceptable for smoke / delegate-missing mode). */
export const m09MemoryStore = new M09MemoryStore();
