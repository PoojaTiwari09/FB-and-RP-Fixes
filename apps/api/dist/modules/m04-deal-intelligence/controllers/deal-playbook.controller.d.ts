import { DealPlaybookService } from '@/services/deal-playbook.service';
import { CreatePlaybookItemDto, UpdatePlaybookItemDto, PlaybookItemResponseDto, PlaybookSummaryDto, PlaybookType, GeneratePlaybookSuggestionsDto } from '@/schemas/playbook.dto';
import { AuthenticatedRequest } from '@/interfaces/authenticated-request.interface';
export declare class DealPlaybookController {
    private readonly playbookService;
    constructor(playbookService: DealPlaybookService);
    getPlaybook(dealId: string, type?: PlaybookType): Promise<PlaybookSummaryDto[]>;
    createPlaybookItem(dealId: string, dto: CreatePlaybookItemDto): Promise<PlaybookItemResponseDto>;
    updatePlaybookItem(dealId: string, itemId: string, dto: UpdatePlaybookItemDto, req: AuthenticatedRequest): Promise<PlaybookItemResponseDto>;
    deletePlaybookItem(dealId: string, itemId: string): Promise<{
        message: string;
    }>;
    initializeMEDDICC(dealId: string): Promise<PlaybookSummaryDto>;
    initializeBANT(dealId: string): Promise<PlaybookSummaryDto>;
    generateAISuggestions(dealId: string, dto: GeneratePlaybookSuggestionsDto): Promise<PlaybookSummaryDto>;
}
