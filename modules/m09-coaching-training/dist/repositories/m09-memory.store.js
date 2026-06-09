"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.m09MemoryStore = exports.M09MemoryStore = exports.M09_DEV_SCENARIO_2 = exports.M09_DEV_SCENARIO_1 = exports.M09_DEV_REP_ID = exports.M09_DEV_MANAGER_ID = exports.M09_DEV_ORG_ID = void 0;
exports.isUuid = isUuid;
exports.M09_DEV_ORG_ID = '00000000-0000-0000-0000-000000000001';
exports.M09_DEV_MANAGER_ID = '00000000-0000-0000-0000-000000000002';
exports.M09_DEV_REP_ID = '00000000-0000-0000-0000-000000000003';
exports.M09_DEV_SCENARIO_1 = '00000000-0000-0000-0000-000000000101';
exports.M09_DEV_SCENARIO_2 = '00000000-0000-0000-0000-000000000102';
function isUuid(value) {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}
class M09MemoryStore {
    constructor() {
        this.users = new Map();
        this.scenarios = new Map();
        this.sessions = new Map();
        this.assignments = new Map();
        this.voices = new Map();
        this.notes = new Map();
        this.recommendations = new Map();
    }
    seedDefaults(hashedPassword) {
        const orgId = exports.M09_DEV_ORG_ID;
        const manager = {
            id: exports.M09_DEV_MANAGER_ID,
            email: 'manager@example.com',
            name: 'John Manager',
            role: 'manager',
            status: 'active',
            password: hashedPassword,
            org_id: orgId,
            created_at: new Date(),
        };
        const rep = {
            id: exports.M09_DEV_REP_ID,
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
        const scenarios = [
            {
                id: exports.M09_DEV_SCENARIO_1,
                org_id: orgId,
                manager_id: manager.id,
                persona_name: 'Objection Oliver (Enterprise Buyer)',
                persona_type: 'competitive',
                difficulty: 'intermediate',
                context_text: 'You are Oliver, an enterprise software buyer who is highly skeptical of cloud migration.',
                custom_prompt: 'Respond with pricing objections.',
                voice_id: 'Xb7hH8MSUJpSbSDYk0k2',
                created_at: new Date(),
            },
            {
                id: exports.M09_DEV_SCENARIO_2,
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
        for (const s of scenarios)
            this.scenarios.set(s.id, s);
        return { orgId, managerId: manager.id, repId: rep.id };
    }
    attachScenario(session) {
        const scenario = this.scenarios.get(session.scenario_id);
        const rep = this.users.get(session.rep_id);
        return { ...session, scenario, rep };
    }
    parseSession(session) {
        const s = { ...session };
        if (typeof s.messages_json === 'string') {
            try {
                s.messages_json = JSON.parse(s.messages_json);
            }
            catch {
                s.messages_json = [];
            }
        }
        if (typeof s.feedback_json === 'string') {
            try {
                s.feedback_json = JSON.parse(s.feedback_json);
            }
            catch {
                s.feedback_json = null;
            }
        }
        return this.attachScenario(s);
    }
}
exports.M09MemoryStore = M09MemoryStore;
exports.m09MemoryStore = new M09MemoryStore();
//# sourceMappingURL=m09-memory.store.js.map