import { M04EntityRepository as Repository } from '@/database/m04-entity.repository';
import { UserPreference } from '@/entities/user-preference.entity';
import { User } from '@/entities/user.entity';
import { SaveFiltersRequestDto, GetFiltersResponseDto, SaveViewSettingsRequestDto, GetViewSettingsResponseDto, SaveNotificationSettingsRequestDto, GetNotificationSettingsResponseDto, SaveCoachingSettingsRequestDto, GetCoachingSettingsResponseDto, SaveGlobalSettingsRequestDto, GetGlobalSettingsResponseDto, AllSettingsResponseDto } from '@/schemas/settings.dto';
export declare class SettingsService {
    private readonly preferenceRepository;
    private readonly userRepository;
    constructor(preferenceRepository: Repository<UserPreference>, userRepository: Repository<User>);
    saveFilters(userId: string, dto: SaveFiltersRequestDto): Promise<GetFiltersResponseDto>;
    getFilters(userId: string, boardId?: string): Promise<GetFiltersResponseDto>;
    saveViewSettings(userId: string, dto: SaveViewSettingsRequestDto): Promise<GetViewSettingsResponseDto>;
    getViewSettings(userId: string, boardId?: string): Promise<GetViewSettingsResponseDto>;
    saveNotificationSettings(userId: string, dto: SaveNotificationSettingsRequestDto): Promise<GetNotificationSettingsResponseDto>;
    getNotificationSettings(userId: string): Promise<GetNotificationSettingsResponseDto>;
    saveCoachingSettings(userId: string, dto: SaveCoachingSettingsRequestDto): Promise<GetCoachingSettingsResponseDto>;
    getCoachingSettings(userId: string): Promise<GetCoachingSettingsResponseDto>;
    saveGlobalSettings(userId: string, dto: SaveGlobalSettingsRequestDto): Promise<GetGlobalSettingsResponseDto>;
    getGlobalSettings(userId: string): Promise<GetGlobalSettingsResponseDto>;
    getAllSettings(userId: string): Promise<AllSettingsResponseDto>;
    deleteSettings(userId: string, preferenceKey: string, boardId?: string): Promise<void>;
    resetAllSettings(userId: string): Promise<void>;
}
