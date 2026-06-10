import { DealService } from '@/services/deal.service';
import { EscalateRiskDto, DeescalateRiskDto, RiskEscalationResponseDto } from '@/schemas/risk-escalation.dto';
import { AuthenticatedRequest } from '@/interfaces/authenticated-request.interface';
export declare class RiskEscalationController {
    private readonly dealService;
    constructor(dealService: DealService);
    escalateRisk(dealId: string, dto: EscalateRiskDto, req: AuthenticatedRequest): Promise<RiskEscalationResponseDto>;
    deescalateRisk(dealId: string, dto: DeescalateRiskDto, req: AuthenticatedRequest): Promise<{
        message: string;
        reason: string;
    }>;
}
