export class SessionCompletedEvent {
  constructor(
    public readonly sessionId: string,
    public readonly repId: string,
    public readonly feedback: any,
    public readonly scenario: any,
  ) {}
}
