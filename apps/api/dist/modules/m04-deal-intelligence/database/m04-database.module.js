"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.M04DatabaseModule = void 0;
const common_1 = require("@nestjs/common");
const entities_1 = require("../entities");
const inject_repository_1 = require("./inject-repository");
const m04_entity_repository_1 = require("./m04-entity.repository");
const m04_memory_store_1 = require("./m04-memory.store");
const ENTITY_BINDINGS = [
    { entity: entities_1.Deal, collection: 'deals' },
    { entity: entities_1.DealBoard, collection: 'boards' },
    { entity: entities_1.BoardFilter, collection: 'boardFilters' },
    { entity: entities_1.BoardTab, collection: 'boardTabs' },
    { entity: entities_1.BoardColumn, collection: 'boardColumns' },
    { entity: entities_1.BoardPermission, collection: 'boardPermissions' },
    { entity: entities_1.DealWarning, collection: 'dealWarnings' },
    { entity: entities_1.DealPlaybook, collection: 'dealPlaybooks' },
    { entity: entities_1.DealActivity, collection: 'dealActivities' },
    { entity: entities_1.DealComment, collection: 'dealComments' },
    { entity: entities_1.DealTask, collection: 'dealTasks' },
    { entity: entities_1.AuditLog, collection: 'auditLogs' },
    { entity: entities_1.SyncLog, collection: 'syncLogs' },
    { entity: entities_1.DealSummary, collection: 'dealSummaries' },
    { entity: entities_1.User, collection: 'users' },
    { entity: entities_1.Session, collection: 'sessions' },
    { entity: entities_1.UserPreference, collection: 'userPreferences' },
    { entity: entities_1.AnalyticsSnapshot, collection: 'analyticsSnapshots' },
];
const repositoryProviders = ENTITY_BINDINGS.map(({ entity, collection }) => ({
    provide: (0, inject_repository_1.getRepositoryToken)(entity),
    useFactory: (store) => new m04_entity_repository_1.M04EntityRepository(entity, store, collection),
    inject: [m04_memory_store_1.M04MemoryStore],
}));
let M04DatabaseModule = class M04DatabaseModule {
};
exports.M04DatabaseModule = M04DatabaseModule;
exports.M04DatabaseModule = M04DatabaseModule = __decorate([
    (0, common_1.Global)(),
    (0, common_1.Module)({
        providers: [
            { provide: m04_memory_store_1.M04MemoryStore, useValue: m04_memory_store_1.m04MemoryStore },
            ...repositoryProviders,
        ],
        exports: [m04_memory_store_1.M04MemoryStore, ...repositoryProviders.map((p) => p.provide)],
    })
], M04DatabaseModule);
//# sourceMappingURL=m04-database.module.js.map