export type ConfidenceLevel = 'High' | 'Medium' | 'Low';
export type RiskLevel = 'HIGH' | 'MEDIUM' | 'LOW';

export interface TeamSummary {
  teamName: string;
  quarter: string;
  aiProjection: number;
  lastUpdated: string;
  manualForecast: number;
  rangeMin: number;
  rangeMax: number;
  closesOn: string;
  closedWon: number;
  weightedPipeline: number;
  expectedDeals: number;
  activeDeals: ActiveDeal[];
  mathData: RepMathData;
}

export interface RepForecast {
  id: string;
  repName: string;
  repInitials: string;
  avatarColor: string;
  aiPrediction: number;
  managerOverride: number | null;
  finalForecast: number;
  confidenceLevel: ConfidenceLevel;
  lastUpdated: string;
}

export interface ActiveDeal {
  id: string;
  name: string;
  stage: string;
  amount: number;
  aiConfidence: ConfidenceLevel;
  expectedClose: string;
  factor: number;
  contribution: number;
  lob: string;
}

export interface RepMathData {
  closedWon: {
    total: number;
    deals: { name: string; amount: number }[];
  };
  weightedPipeline: {
    total: number;
    stages: { name: string; pipeline: number; conv: number; contribution: number }[];
  };
  expectedDeals: {
    total: number;
    historicalRate: number;
    addressablePipeline: number;
  };
  formula: string;
}

export interface RepDetail {
  repId: string;
  repName: string;
  repInitials: string;
  avatarColor: string;
  quarter: string;
  aiProjection: number;
  lastUpdated: string;
  rangeMin: number;
  rangeMax: number;
  closesOn: string;
  closedWon: number;
  weightedPipeline: number;
  expectedDeals: number;
  activeDeals: ActiveDeal[];
  mathData: RepMathData;
}
