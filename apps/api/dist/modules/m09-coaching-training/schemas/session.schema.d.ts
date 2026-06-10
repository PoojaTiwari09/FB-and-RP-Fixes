export declare class StartSessionDto {
    scenarioId: string;
    voiceId?: string;
    assignmentId?: string;
}
export declare class SendMessageDto {
    sessionId: string;
    message: string;
}
export declare class EndSessionDto {
    sessionId: string;
}
