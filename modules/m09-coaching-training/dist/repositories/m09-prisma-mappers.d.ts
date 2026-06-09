export declare function scenarioFromUnified(row: any): {
    id: any;
    org_id: any;
    persona_name: any;
    persona_type: any;
    context_text: string;
    difficulty: any;
    custom_prompt: any;
    voice_id: any;
    manager_id: any;
    created_at: any;
};
export declare function scenarioToUnified(orgId: string, managerId: string, data: any): {
    tenantid: string;
    name: any;
    personadescription: any;
    context: any;
    difficulty: any;
    createdby: string;
};
export declare function sessionFromUnified(row: any, scenario?: any): {
    id: any;
    rep_id: any;
    scenario_id: any;
    messages_json: any;
    feedback_json: any;
    completed_at: any;
    created_at: any;
    is_practice: boolean;
    hints_used: number;
    selected_voice_id: any;
    scenario: any;
};
export declare function sessionToUnified(orgId: string, data: {
    rep_id: string;
    scenario_id: string;
    messages_json: any[];
    is_practice?: boolean;
}): {
    scenarioid: string;
    tenantid: string;
    userid: string;
    conversation: any[];
    status: string;
};
