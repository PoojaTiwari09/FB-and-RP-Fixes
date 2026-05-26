import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserPreference, PreferenceScope } from '@/entities/user-preference.entity';
import { User } from '@/entities/user.entity';
import {
  SaveFiltersRequestDto,
  GetFiltersResponseDto,
  SaveViewSettingsRequestDto,
  GetViewSettingsResponseDto,
  SaveNotificationSettingsRequestDto,
  GetNotificationSettingsResponseDto,
  SaveCoachingSettingsRequestDto,
  GetCoachingSettingsResponseDto,
  SaveGlobalSettingsRequestDto,
  GetGlobalSettingsResponseDto,
  AllSettingsResponseDto,
  ViewSettingsDto,
  FilterSettingDto,
  NotificationSettingsDto,
  CoachingSettingsDto,
  GlobalSettingsDto,
} from '@/schemas/settings.dto';
import { UserRole } from '@/interfaces/user-role.enum';

@Injectable()
export class SettingsService {
  constructor(
    @InjectRepository(UserPreference)
    private readonly preferenceRepository: Repository<UserPreference>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  // ============= Filter Settings =============

  async saveFilters(userId: string, dto: SaveFiltersRequestDto): Promise<GetFiltersResponseDto> {
    const scope = dto.boardId ? PreferenceScope.BOARD : PreferenceScope.GLOBAL;
    const scopeId = dto.boardId || null;

    // Find or create preference
    const whereClause: any = {
      userId,
      scope,
      preferenceKey: 'filters',
    };
    
    if (scopeId) {
      whereClause.scopeId = scopeId;
    }

    let preference = await this.preferenceRepository.findOne({
      where: whereClause,
    });

    if (preference) {
      preference.preferenceValue = { filters: dto.filters };
      preference.updatedAt = new Date();
    } else {
      preference = this.preferenceRepository.create({
        userId,
        scope,
        scopeId: scopeId,
        preferenceKey: 'filters',
        preferenceValue: { filters: dto.filters },
      });
    }

    await this.preferenceRepository.save(preference);

    return {
      userId,
      boardId: dto.boardId,
      filters: dto.filters,
      updatedAt: preference.updatedAt,
    };
  }

  async getFilters(userId: string, boardId?: string): Promise<GetFiltersResponseDto> {
    const scope = boardId ? PreferenceScope.BOARD : PreferenceScope.GLOBAL;
    const scopeId = boardId || null;

    const whereClause: any = {
      userId,
      scope,
      preferenceKey: 'filters',
    };
    
    if (scopeId) {
      whereClause.scopeId = scopeId;
    }

    const preference = await this.preferenceRepository.findOne({
      where: whereClause,
    });

    if (!preference) {
      return {
        userId,
        boardId,
        filters: [],
        updatedAt: new Date(),
      };
    }

    return {
      userId,
      boardId,
      filters: preference.preferenceValue.filters || [],
      updatedAt: preference.updatedAt,
    };
  }

  // ============= View Settings =============

  async saveViewSettings(
    userId: string,
    dto: SaveViewSettingsRequestDto,
  ): Promise<GetViewSettingsResponseDto> {
    const scope = dto.boardId ? PreferenceScope.BOARD : PreferenceScope.GLOBAL;
    const scopeId = dto.boardId || null;

    const whereClause: any = {
      userId,
      scope,
      preferenceKey: 'viewSettings',
    };
    
    if (scopeId) {
      whereClause.scopeId = scopeId;
    }

    let preference = await this.preferenceRepository.findOne({
      where: whereClause,
    });

    const settings: ViewSettingsDto = {
      boardId: dto.boardId,
      columns: dto.columns,
      sortField: dto.sortField,
      sortOrder: dto.sortOrder,
      groupBy: dto.groupBy,
      activeTab: dto.activeTab,
      showCompletedTasks: dto.showCompletedTasks,
      compactView: dto.compactView,
    };

    if (preference) {
      preference.preferenceValue = settings;
      preference.updatedAt = new Date();
    } else {
      preference = this.preferenceRepository.create({
        userId,
        scope,
        scopeId: scopeId,
        preferenceKey: 'viewSettings',
        preferenceValue: settings,
      });
    }

    await this.preferenceRepository.save(preference);

    return {
      userId,
      boardId: dto.boardId,
      settings,
      updatedAt: preference.updatedAt,
    };
  }

  async getViewSettings(userId: string, boardId?: string): Promise<GetViewSettingsResponseDto> {
    const scope = boardId ? PreferenceScope.BOARD : PreferenceScope.GLOBAL;
    const scopeId = boardId || null;

    const whereClause: any = {
      userId,
      scope,
      preferenceKey: 'viewSettings',
    };
    
    if (scopeId) {
      whereClause.scopeId = scopeId;
    }

    const preference = await this.preferenceRepository.findOne({
      where: whereClause,
    });

    const defaultSettings: ViewSettingsDto = {
      boardId,
      columns: [],
      sortField: 'aiScore',
      sortOrder: 'DESC' as any,
      groupBy: 'NONE' as any,
      activeTab: 'Pipeline',
      showCompletedTasks: false,
      compactView: false,
    };

    if (!preference) {
      return {
        userId,
        boardId,
        settings: defaultSettings,
        updatedAt: new Date(),
      };
    }

    return {
      userId,
      boardId,
      settings: preference.preferenceValue as ViewSettingsDto,
      updatedAt: preference.updatedAt,
    };
  }

  // ============= Notification Settings =============

  async saveNotificationSettings(
    userId: string,
    dto: SaveNotificationSettingsRequestDto,
  ): Promise<GetNotificationSettingsResponseDto> {
    let preference = await this.preferenceRepository.findOne({
      where: {
        userId,
        scope: PreferenceScope.GLOBAL,
        preferenceKey: 'notificationSettings',
      },
    });

    const settings: NotificationSettingsDto = {
      emailEnabled: dto.emailEnabled,
      inAppEnabled: dto.inAppEnabled,
      notifyOnWarnings: dto.notifyOnWarnings,
      notifyOnTaskAssignments: dto.notifyOnTaskAssignments,
      notifyOnComments: dto.notifyOnComments,
      notifyOnRiskEscalations: dto.notifyOnRiskEscalations,
      dailyDigestEnabled: dto.dailyDigestEnabled,
      weeklySummaryEnabled: dto.weeklySummaryEnabled,
    };

    if (preference) {
      preference.preferenceValue = settings;
      preference.updatedAt = new Date();
    } else {
      preference = this.preferenceRepository.create({
        userId,
        scope: PreferenceScope.GLOBAL,
        preferenceKey: 'notificationSettings',
        preferenceValue: settings,
      });
    }

    await this.preferenceRepository.save(preference);

    return {
      userId,
      settings,
      updatedAt: preference.updatedAt,
    };
  }

  async getNotificationSettings(userId: string): Promise<GetNotificationSettingsResponseDto> {
    const preference = await this.preferenceRepository.findOne({
      where: {
        userId,
        scope: PreferenceScope.GLOBAL,
        preferenceKey: 'notificationSettings',
      },
    });

    const defaultSettings: NotificationSettingsDto = {
      emailEnabled: true,
      inAppEnabled: true,
      notifyOnWarnings: true,
      notifyOnTaskAssignments: true,
      notifyOnComments: true,
      notifyOnRiskEscalations: true,
      dailyDigestEnabled: false,
      weeklySummaryEnabled: true,
    };

    if (!preference) {
      return {
        userId,
        settings: defaultSettings,
        updatedAt: new Date(),
      };
    }

    return {
      userId,
      settings: preference.preferenceValue as NotificationSettingsDto,
      updatedAt: preference.updatedAt,
    };
  }

  // ============= Coaching Settings (Manager Only) =============

  async saveCoachingSettings(
    userId: string,
    dto: SaveCoachingSettingsRequestDto,
  ): Promise<GetCoachingSettingsResponseDto> {
    // Verify user is a manager
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user || (user.role !== UserRole.MANAGER && user.role !== UserRole.ADMIN)) {
      throw new Error('Only managers and admins can save coaching settings');
    }

    let preference = await this.preferenceRepository.findOne({
      where: {
        userId,
        scope: PreferenceScope.GLOBAL,
        preferenceKey: 'coachingSettings',
      },
    });

    const settings: CoachingSettingsDto = {
      autoAssignTasks: dto.autoAssignTasks,
      defaultTaskDueDays: dto.defaultTaskDueDays,
      riskEscalationThreshold: dto.riskEscalationThreshold,
      autoEscalateHighRisk: dto.autoEscalateHighRisk,
      requireCommentOnEscalation: dto.requireCommentOnEscalation,
      trackMeddpiccCompletion: dto.trackMeddpiccCompletion,
    };

    if (preference) {
      preference.preferenceValue = settings;
      preference.updatedAt = new Date();
    } else {
      preference = this.preferenceRepository.create({
        userId,
        scope: PreferenceScope.GLOBAL,
        preferenceKey: 'coachingSettings',
        preferenceValue: settings,
      });
    }

    await this.preferenceRepository.save(preference);

    return {
      managerId: userId,
      settings,
      updatedAt: preference.updatedAt,
    };
  }

  async getCoachingSettings(userId: string): Promise<GetCoachingSettingsResponseDto> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user || (user.role !== UserRole.MANAGER && user.role !== UserRole.ADMIN)) {
      throw new Error('Only managers and admins can access coaching settings');
    }

    const preference = await this.preferenceRepository.findOne({
      where: {
        userId,
        scope: PreferenceScope.GLOBAL,
        preferenceKey: 'coachingSettings',
      },
    });

    const defaultSettings: CoachingSettingsDto = {
      autoAssignTasks: true,
      defaultTaskDueDays: 3,
      riskEscalationThreshold: 40,
      autoEscalateHighRisk: false,
      requireCommentOnEscalation: true,
      trackMeddpiccCompletion: true,
    };

    if (!preference) {
      return {
        managerId: userId,
        settings: defaultSettings,
        updatedAt: new Date(),
      };
    }

    return {
      managerId: userId,
      settings: preference.preferenceValue as CoachingSettingsDto,
      updatedAt: preference.updatedAt,
    };
  }

  // ============= Global Settings =============

  async saveGlobalSettings(
    userId: string,
    dto: SaveGlobalSettingsRequestDto,
  ): Promise<GetGlobalSettingsResponseDto> {
    let preference = await this.preferenceRepository.findOne({
      where: {
        userId,
        scope: PreferenceScope.GLOBAL,
        preferenceKey: 'globalSettings',
      },
    });

    const settings: GlobalSettingsDto = {
      defaultBoardView: dto.defaultBoardView,
      timezone: dto.timezone,
      dateFormat: dto.dateFormat,
      currencySymbol: dto.currencySymbol,
      theme: dto.theme,
    };

    if (preference) {
      preference.preferenceValue = settings;
      preference.updatedAt = new Date();
    } else {
      preference = this.preferenceRepository.create({
        userId,
        scope: PreferenceScope.GLOBAL,
        preferenceKey: 'globalSettings',
        preferenceValue: settings,
      });
    }

    await this.preferenceRepository.save(preference);

    return {
      userId,
      settings,
      updatedAt: preference.updatedAt,
    };
  }

  async getGlobalSettings(userId: string): Promise<GetGlobalSettingsResponseDto> {
    const preference = await this.preferenceRepository.findOne({
      where: {
        userId,
        scope: PreferenceScope.GLOBAL,
        preferenceKey: 'globalSettings',
      },
    });

    const defaultSettings: GlobalSettingsDto = {
      defaultBoardView: 'list',
      timezone: 'America/New_York',
      dateFormat: 'MM/DD/YYYY',
      currencySymbol: '$',
      theme: 'light',
    };

    if (!preference) {
      return {
        userId,
        settings: defaultSettings,
        updatedAt: new Date(),
      };
    }

    return {
      userId,
      settings: preference.preferenceValue as GlobalSettingsDto,
      updatedAt: preference.updatedAt,
    };
  }

  // ============= Get All Settings =============

  async getAllSettings(userId: string): Promise<AllSettingsResponseDto> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const globalSettings = await this.getGlobalSettings(userId);
    const notificationSettings = await this.getNotificationSettings(userId);

    let coachingSettings: CoachingSettingsDto | undefined;
    if (user.role === UserRole.MANAGER || user.role === UserRole.ADMIN) {
      const coachingResponse = await this.getCoachingSettings(userId);
      coachingSettings = coachingResponse.settings;
    }

    // Get all view settings (by board)
    const viewPreferences = await this.preferenceRepository.find({
      where: {
        userId,
        preferenceKey: 'viewSettings',
      },
    });

    const viewSettings: Record<string, ViewSettingsDto> = {};
    for (const pref of viewPreferences) {
      const key = pref.scopeId || 'global';
      viewSettings[key] = pref.preferenceValue as ViewSettingsDto;
    }

    // Get all filter settings (by board)
    const filterPreferences = await this.preferenceRepository.find({
      where: {
        userId,
        preferenceKey: 'filters',
      },
    });

    const filterSettings: Record<string, FilterSettingDto[]> = {};
    for (const pref of filterPreferences) {
      const key = pref.scopeId || 'global';
      filterSettings[key] = (pref.preferenceValue as any).filters || [];
    }

    return {
      userId,
      globalSettings: globalSettings.settings,
      notificationSettings: notificationSettings.settings,
      coachingSettings,
      viewSettings,
      filterSettings,
    };
  }

  // ============= Delete Settings =============

  async deleteSettings(userId: string, preferenceKey: string, boardId?: string): Promise<void> {
    const scope = boardId ? PreferenceScope.BOARD : PreferenceScope.GLOBAL;
    const scopeId = boardId || null;

    const whereClause: any = {
      userId,
      scope,
      preferenceKey,
    };
    
    if (scopeId) {
      whereClause.scopeId = scopeId;
    }

    await this.preferenceRepository.delete(whereClause);
  }

  async resetAllSettings(userId: string): Promise<void> {
    await this.preferenceRepository.delete({ userId });
  }
}
