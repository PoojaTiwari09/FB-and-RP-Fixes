export declare class SessionEntity {
    id: string;
    rep_id: string;
    scenario_id: string;
    assignment_id?: string;
    start_time: Date;
    end_time?: Date;
    status: string;
    messages_json: any;
    feedback_json?: any;
    voice_id?: string;
    transcript_text?: string;
    created_at: Date;
    updated_at: Date;
}
