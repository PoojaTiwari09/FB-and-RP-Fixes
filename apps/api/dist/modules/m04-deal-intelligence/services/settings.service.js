"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var _a, _b;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SettingsService = void 0;
const common_1 = require("@nestjs/common");
const inject_repository_1 = require("@m04/database/inject-repository");
const m04_prisma_repository_1 = require("@m04/database/m04-prisma.repository");
const user_preference_entity_1 = require("@m04/entities/user-preference.entity");
const user_entity_1 = require("@m04/entities/user.entity");
const user_role_enum_1 = require("@m04/interfaces/user-role.enum");
let SettingsService = class SettingsService {
    preferenceRepository;
    userRepository;
    constructor(preferenceRepository, userRepository) {
        this.preferenceRepository = preferenceRepository;
        this.userRepository = userRepository;
    }
    async saveFilters(userId, dto) {
        const scope = dto.boardId ? user_preference_entity_1.PreferenceScope.BOARD : user_preference_entity_1.PreferenceScope.GLOBAL;
        const scopeId = dto.boardId || null;
        const whereClause = {
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
        }
        else {
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
    async getFilters(userId, boardId) {
        const scope = boardId ? user_preference_entity_1.PreferenceScope.BOARD : user_preference_entity_1.PreferenceScope.GLOBAL;
        const scopeId = boardId || null;
        const whereClause = {
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
    async saveViewSettings(userId, dto) {
        const scope = dto.boardId ? user_preference_entity_1.PreferenceScope.BOARD : user_preference_entity_1.PreferenceScope.GLOBAL;
        const scopeId = dto.boardId || null;
        const whereClause = {
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
        const settings = {
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
        }
        else {
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
    async getViewSettings(userId, boardId) {
        const scope = boardId ? user_preference_entity_1.PreferenceScope.BOARD : user_preference_entity_1.PreferenceScope.GLOBAL;
        const scopeId = boardId || null;
        const whereClause = {
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
        const defaultSettings = {
            boardId,
            columns: [],
            sortField: 'aiScore',
            sortOrder: 'DESC',
            groupBy: 'NONE',
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
            settings: preference.preferenceValue,
            updatedAt: preference.updatedAt,
        };
    }
    async saveNotificationSettings(userId, dto) {
        let preference = await this.preferenceRepository.findOne({
            where: {
                userId,
                scope: user_preference_entity_1.PreferenceScope.GLOBAL,
                preferenceKey: 'notificationSettings',
            },
        });
        const settings = {
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
        }
        else {
            preference = this.preferenceRepository.create({
                userId,
                scope: user_preference_entity_1.PreferenceScope.GLOBAL,
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
    async getNotificationSettings(userId) {
        const preference = await this.preferenceRepository.findOne({
            where: {
                userId,
                scope: user_preference_entity_1.PreferenceScope.GLOBAL,
                preferenceKey: 'notificationSettings',
            },
        });
        const defaultSettings = {
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
            settings: preference.preferenceValue,
            updatedAt: preference.updatedAt,
        };
    }
    async saveCoachingSettings(userId, dto) {
        const user = await this.userRepository.findOne({ where: { id: userId } });
        if (!user || (user.role !== user_role_enum_1.UserRole.MANAGER && user.role !== user_role_enum_1.UserRole.ADMIN)) {
            throw new Error('Only managers and admins can save coaching settings');
        }
        let preference = await this.preferenceRepository.findOne({
            where: {
                userId,
                scope: user_preference_entity_1.PreferenceScope.GLOBAL,
                preferenceKey: 'coachingSettings',
            },
        });
        const settings = {
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
        }
        else {
            preference = this.preferenceRepository.create({
                userId,
                scope: user_preference_entity_1.PreferenceScope.GLOBAL,
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
    async getCoachingSettings(userId) {
        const user = await this.userRepository.findOne({ where: { id: userId } });
        if (!user || (user.role !== user_role_enum_1.UserRole.MANAGER && user.role !== user_role_enum_1.UserRole.ADMIN)) {
            throw new Error('Only managers and admins can access coaching settings');
        }
        const preference = await this.preferenceRepository.findOne({
            where: {
                userId,
                scope: user_preference_entity_1.PreferenceScope.GLOBAL,
                preferenceKey: 'coachingSettings',
            },
        });
        const defaultSettings = {
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
            settings: preference.preferenceValue,
            updatedAt: preference.updatedAt,
        };
    }
    async saveGlobalSettings(userId, dto) {
        let preference = await this.preferenceRepository.findOne({
            where: {
                userId,
                scope: user_preference_entity_1.PreferenceScope.GLOBAL,
                preferenceKey: 'globalSettings',
            },
        });
        const settings = {
            defaultBoardView: dto.defaultBoardView,
            timezone: dto.timezone,
            dateFormat: dto.dateFormat,
            currencySymbol: dto.currencySymbol,
            theme: dto.theme,
        };
        if (preference) {
            preference.preferenceValue = settings;
            preference.updatedAt = new Date();
        }
        else {
            preference = this.preferenceRepository.create({
                userId,
                scope: user_preference_entity_1.PreferenceScope.GLOBAL,
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
    async getGlobalSettings(userId) {
        const preference = await this.preferenceRepository.findOne({
            where: {
                userId,
                scope: user_preference_entity_1.PreferenceScope.GLOBAL,
                preferenceKey: 'globalSettings',
            },
        });
        const defaultSettings = {
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
            settings: preference.preferenceValue,
            updatedAt: preference.updatedAt,
        };
    }
    async getAllSettings(userId) {
        const user = await this.userRepository.findOne({ where: { id: userId } });
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        const globalSettings = await this.getGlobalSettings(userId);
        const notificationSettings = await this.getNotificationSettings(userId);
        let coachingSettings;
        if (user.role === user_role_enum_1.UserRole.MANAGER || user.role === user_role_enum_1.UserRole.ADMIN) {
            const coachingResponse = await this.getCoachingSettings(userId);
            coachingSettings = coachingResponse.settings;
        }
        const viewPreferences = await this.preferenceRepository.find({
            where: {
                userId,
                preferenceKey: 'viewSettings',
            },
        });
        const viewSettings = {};
        for (const pref of viewPreferences) {
            const key = pref.scopeId || 'global';
            viewSettings[key] = pref.preferenceValue;
        }
        const filterPreferences = await this.preferenceRepository.find({
            where: {
                userId,
                preferenceKey: 'filters',
            },
        });
        const filterSettings = {};
        for (const pref of filterPreferences) {
            const key = pref.scopeId || 'global';
            filterSettings[key] = pref.preferenceValue.filters || [];
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
    async deleteSettings(userId, preferenceKey, boardId) {
        const scope = boardId ? user_preference_entity_1.PreferenceScope.BOARD : user_preference_entity_1.PreferenceScope.GLOBAL;
        const scopeId = boardId || null;
        const whereClause = {
            userId,
            scope,
            preferenceKey,
        };
        if (scopeId) {
            whereClause.scopeId = scopeId;
        }
        await this.preferenceRepository.delete(whereClause);
    }
    async resetAllSettings(userId) {
        await this.preferenceRepository.delete({ userId });
    }
};
exports.SettingsService = SettingsService;
exports.SettingsService = SettingsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, inject_repository_1.InjectRepository)(user_preference_entity_1.UserPreference)),
    __param(1, (0, inject_repository_1.InjectRepository)(user_entity_1.User)),
    __metadata("design:paramtypes", [typeof (_a = typeof m04_prisma_repository_1.M04EntityRepository !== "undefined" && m04_prisma_repository_1.M04EntityRepository) === "function" ? _a : Object, typeof (_b = typeof m04_prisma_repository_1.M04EntityRepository !== "undefined" && m04_prisma_repository_1.M04EntityRepository) === "function" ? _b : Object])
], SettingsService);
//# sourceMappingURL=settings.service.js.map