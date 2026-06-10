export declare class EscalateRiskDto {
    riskReason: string;
}
export declare class DeescalateRiskDto {
    reason: string;
}
export declare class RiskEscalationResponseDto {
    id: string;
    isHighRisk: boolean;
    riskReason: string;
    escalatedBy: string;
    escalatedAt: Date;
    message: string;
}
