import { CoachingService } from '@/services/coaching.service';
import { GenerateCoachingPromptsDto, CoachingPromptsResponseDto } from '@/schemas/coaching.dto';
import { AuthenticatedRequest } from '@/interfaces/authenticated-request.interface';
export declare class CoachingController {
    private readonly coachingService;
    constructor(coachingService: CoachingService);
    generatePrompts(dto: GenerateCoachingPromptsDto): Promise<CoachingPromptsResponseDto>;
    getPromptsForDeal(dealId: string): Promise<CoachingPromptsResponseDto>;
    getTeamOpportunities(req: AuthenticatedRequest): Promise<CoachingPromptsResponseDto[]>;
}
