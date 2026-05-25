export class TrainingCompletedEvent {
  constructor(
    public readonly sessionId: string,
    public readonly repId: string,
    public readonly score: number,
  ) {}
}
