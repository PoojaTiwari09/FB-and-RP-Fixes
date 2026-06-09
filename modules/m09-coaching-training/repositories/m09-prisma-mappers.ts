/** Map unified dashboards.trainerscenarios ↔ legacy TrainingScenario shape. */

export function scenarioFromUnified(row: any) {
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

export function scenarioToUnified(orgId: string, managerId: string, data: any) {
  return {
    tenantid: orgId,
    name: data.persona_name,
    personadescription: data.persona_type || '',
    context: data.context_text,
    difficulty: data.difficulty,
    createdby: managerId,
  };
}

export function sessionFromUnified(row: any, scenario?: any) {
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

export function sessionToUnified(orgId: string, data: {
  rep_id: string;
  scenario_id: string;
  messages_json: any[];
  is_practice?: boolean;
}) {
  return {
    scenarioid: data.scenario_id,
    tenantid: orgId,
    userid: data.rep_id,
    conversation: data.messages_json,
    status: data.is_practice ? 'practice' : 'started',
  };
}
