export declare class SessionCompletedEvent {
    readonly sessionId: string;
    readonly repId: string;
    readonly feedback: any;
    readonly scenario: any;
    constructor(sessionId: string, repId: string, feedback: any, scenario: any);
}
