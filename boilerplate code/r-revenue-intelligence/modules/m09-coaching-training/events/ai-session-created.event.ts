export class AiSessionCreatedEvent {
  constructor(
    public readonly sessionId: string,
    public readonly repId: string,
    public readonly scenarioId: string,
  ) {}
}
