import { Global, Module } from '@nestjs/common';
import {
  AnalyticsSnapshot,
  AuditLog,
  BoardColumn,
  BoardFilter,
  BoardPermission,
  BoardTab,
  Deal,
  DealActivity,
  DealBoard,
  DealComment,
  DealPlaybook,
  DealSummary,
  DealTask,
  DealWarning,
  Session,
  SyncLog,
  User,
  UserPreference,
} from '../entities';
import { getRepositoryToken } from './inject-repository';
import { M04EntityRepository } from './m04-entity.repository';
import { m04MemoryStore, M04CollectionKey, M04MemoryStore } from './m04-memory.store';

const ENTITY_BINDINGS: Array<{ entity: new () => unknown; collection: M04CollectionKey }> = [
  { entity: Deal, collection: 'deals' },
  { entity: DealBoard, collection: 'boards' },
  { entity: BoardFilter, collection: 'boardFilters' },
  { entity: BoardTab, collection: 'boardTabs' },
  { entity: BoardColumn, collection: 'boardColumns' },
  { entity: BoardPermission, collection: 'boardPermissions' },
  { entity: DealWarning, collection: 'dealWarnings' },
  { entity: DealPlaybook, collection: 'dealPlaybooks' },
  { entity: DealActivity, collection: 'dealActivities' },
  { entity: DealComment, collection: 'dealComments' },
  { entity: DealTask, collection: 'dealTasks' },
  { entity: AuditLog, collection: 'auditLogs' },
  { entity: SyncLog, collection: 'syncLogs' },
  { entity: DealSummary, collection: 'dealSummaries' },
  { entity: User, collection: 'users' },
  { entity: Session, collection: 'sessions' },
  { entity: UserPreference, collection: 'userPreferences' },
  { entity: AnalyticsSnapshot, collection: 'analyticsSnapshots' },
];

const repositoryProviders = ENTITY_BINDINGS.map(({ entity, collection }) => ({
  provide: getRepositoryToken(entity),
  useFactory: (store: M04MemoryStore) =>
    new M04EntityRepository(entity as new () => { id: string }, store, collection),
  inject: [M04MemoryStore],
}));

@Global()
@Module({
  providers: [
    { provide: M04MemoryStore, useValue: m04MemoryStore },
    ...repositoryProviders,
  ],
  exports: [M04MemoryStore, ...repositoryProviders.map((p) => p.provide)],
})
export class M04DatabaseModule {}
