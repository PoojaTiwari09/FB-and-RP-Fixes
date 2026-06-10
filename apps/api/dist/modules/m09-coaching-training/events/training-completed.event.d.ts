export declare class TrainingCompletedEvent {
    readonly sessionId: string;
    readonly repId: string;
    readonly score: number;
    constructor(sessionId: string, repId: string, score: number);
}
