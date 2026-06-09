export class CoachingFeedbackEvent {
  constructor(
    public readonly repId: string,
    public readonly managerId: string,
    public readonly overallScore: number,
  ) {}
}
