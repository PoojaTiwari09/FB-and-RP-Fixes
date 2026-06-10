import { M04EntityRepository as Repository } from '@/database/m04-entity.repository';
import { DealPlaybook, PlaybookType } from '@/entities/deal-playbook.entity';
import { Deal } from '@/entities/deal.entity';
import { CreatePlaybookItemDto, UpdatePlaybookItemDto, PlaybookItemResponseDto, PlaybookSummaryDto } from '@/schemas/playbook.dto';
import { AIClientService } from './ai-client.service';
export declare class DealPlaybookService {
    private readonly playbookRepository;
    private readonly dealRepository;
    private readonly aiClientService;
    constructor(playbookRepository: Repository<DealPlaybook>, dealRepository: Repository<Deal>, aiClientService: AIClientService);
    getPlaybook(dealId: string, type?: PlaybookType): Promise<PlaybookSummaryDto[]>;
    createPlaybookItem(dealId: string, dto: CreatePlaybookItemDto): Promise<PlaybookItemResponseDto>;
    updatePlaybookItem(dealId: string, itemId: string, dto: UpdatePlaybookItemDto, userId?: string): Promise<PlaybookItemResponseDto>;
    deletePlaybookItem(dealId: string, itemId: string): Promise<void>;
    initializeMEDDICC(dealId: string): Promise<PlaybookSummaryDto>;
    initializeBANT(dealId: string): Promise<PlaybookSummaryDto>;
    generateAISuggestions(dealId: string, type: PlaybookType): Promise<PlaybookSummaryDto>;
    private toResponseDto;
}
