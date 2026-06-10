import { M04EntityRepository as Repository } from '@/database/m04-entity.repository';
import { Deal } from '@/entities/deal.entity';
import { DealPlaybook } from '@/entities/deal-playbook.entity';
import { DealWarning } from '@/entities/deal-warning.entity';
import { DealActivity } from '@/entities/deal-activity.entity';
import { AIClientService } from './ai-client.service';
import { GenerateCoachingPromptsDto, CoachingPromptsResponseDto } from '@/schemas/coaching.dto';
export declare class CoachingService {
    private readonly dealRepository;
    private readonly playbookRepository;
    private readonly warningRepository;
    private readonly activityRepository;
    private readonly aiClientService;
    constructor(dealRepository: Repository<Deal>, playbookRepository: Repository<DealPlaybook>, warningRepository: Repository<DealWarning>, activityRepository: Repository<DealActivity>, aiClientService: AIClientService);
    generateCoachingPrompts(dto: GenerateCoachingPromptsDto): Promise<CoachingPromptsResponseDto>;
    private generateFallbackPrompts;
    getTeamCoachingOpportunities(managerId: string): Promise<CoachingPromptsResponseDto[]>;
}
