import { SettingsService } from '@/services/settings.service';
import { SaveFiltersRequestDto, GetFiltersResponseDto, SaveViewSettingsRequestDto, GetViewSettingsResponseDto, SaveNotificationSettingsRequestDto, GetNotificationSettingsResponseDto, SaveCoachingSettingsRequestDto, GetCoachingSettingsResponseDto, SaveGlobalSettingsRequestDto, GetGlobalSettingsResponseDto, AllSettingsResponseDto } from '@/schemas/settings.dto';
import { AuthenticatedRequest } from '@/interfaces/authenticated-request.interface';
export declare class SettingsController {
    private readonly settingsService;
    constructor(settingsService: SettingsService);
    saveFilters(dto: SaveFiltersRequestDto, req: AuthenticatedRequest): Promise<GetFiltersResponseDto>;
    getFilters(boardId: string | undefined, req: AuthenticatedRequest): Promise<GetFiltersResponseDto>;
    saveViewSettings(dto: SaveViewSettingsRequestDto, req: AuthenticatedRequest): Promise<GetViewSettingsResponseDto>;
    getViewSettings(boardId: string | undefined, req: AuthenticatedRequest): Promise<GetViewSettingsResponseDto>;
    saveNotificationSettings(dto: SaveNotificationSettingsRequestDto, req: AuthenticatedRequest): Promise<GetNotificationSettingsResponseDto>;
    getNotificationSettings(req: AuthenticatedRequest): Promise<GetNotificationSettingsResponseDto>;
    saveCoachingSettings(dto: SaveCoachingSettingsRequestDto, req: AuthenticatedRequest): Promise<GetCoachingSettingsResponseDto>;
    getCoachingSettings(req: AuthenticatedRequest): Promise<GetCoachingSettingsResponseDto>;
    saveGlobalSettings(dto: SaveGlobalSettingsRequestDto, req: AuthenticatedRequest): Promise<GetGlobalSettingsResponseDto>;
    getGlobalSettings(req: AuthenticatedRequest): Promise<GetGlobalSettingsResponseDto>;
    getAllSettings(req: AuthenticatedRequest): Promise<AllSettingsResponseDto>;
    deleteSettings(preferenceKey: string, boardId: string | undefined, req: AuthenticatedRequest): Promise<{
        message: string;
    }>;
    resetAllSettings(req: AuthenticatedRequest): Promise<{
        message: string;
    }>;
}
