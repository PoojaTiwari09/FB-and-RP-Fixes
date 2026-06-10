"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.scenarioFromUnified = scenarioFromUnified;
exports.scenarioToUnified = scenarioToUnified;
exports.sessionFromUnified = sessionFromUnified;
exports.sessionToUnified = sessionToUnified;
function scenarioFromUnified(row) {
    return {
        id: row.scenarioid,
        org_id: row.tenantid,
        persona_name: row.name,
        persona_type: row.difficulty || 'generic',
        context_text: [row.personadescription, row.context].filter(Boolean).join('\n'),
        difficulty: row.difficulty || 'intermediate',
        custom_prompt: null,
        voice_id: null,
        manager_id: row.createdby,
        created_at: row.createdat,
    };
}
function scenarioToUnified(orgId, managerId, data) {
    return {
        tenantId: orgId,
        name: data.persona_name,
        personadescription: data.persona_type || '',
        context: data.context_text,
        difficulty: data.difficulty,
        createdby: managerId,
    };
}
function sessionFromUnified(row, scenario) {
    return {
        id: row.sessionid,
        rep_id: row.userid,
        scenario_id: row.scenarioid,
        messages_json: row.conversation ?? [],
        feedback_json: row.scorecardresult ?? null,
        completed_at: row.completedat,
        created_at: row.createdat,
        is_practice: row.status === 'practice',
        hints_used: 0,
        selected_voice_id: null,
        scenario,
    };
}
function sessionToUnified(orgId, data) {
    return {
        scenarioid: data.scenario_id,
        tenantId: orgId,
        userid: data.rep_id,
        conversation: data.messages_json,
        status: data.is_practice ? 'practice' : 'started',
    };
}
//# sourceMappingURL=m09-prisma-mappers.js.map