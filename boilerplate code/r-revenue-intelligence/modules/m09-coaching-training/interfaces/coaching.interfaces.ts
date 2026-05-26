export interface IChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface IScores {
  opening: number;
  discovery: number;
  objection_handling: number;
  talk_ratio: number;
  closing: number;
}

export interface ISessionFeedback {
  scores: IScores;
  overall_score: number;
  evaluation_summary: string;
  coaching_tips: string[];
}
