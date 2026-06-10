import { PlaybookType, PlaybookItemStatus } from '@/entities/deal-playbook.entity';
export { PlaybookType, PlaybookItemStatus };
export declare class CreatePlaybookItemDto {
    type: PlaybookType;
    criterion: string;
    notes?: string;
    order?: number;
}
export declare class UpdatePlaybookItemDto {
    status?: PlaybookItemStatus;
    notes?: string;
    aiSuggestion?: string;
}
export declare class PlaybookItemResponseDto {
    id: string;
    dealId: string;
    type: PlaybookType;
    criterion: string;
    status: PlaybookItemStatus;
    notes?: string;
    aiSuggestion?: string;
    order: number;
    completedBy?: string;
    completedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}
export declare class PlaybookSummaryDto {
    type: PlaybookType;
    totalItems: number;
    completedItems: number;
    inProgressItems: number;
    notStartedItems: number;
    completionPercentage: number;
    items: PlaybookItemResponseDto[];
}
export declare class GeneratePlaybookSuggestionsDto {
    type: PlaybookType;
}
