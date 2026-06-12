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
import { M04PrismaRepository } from './m04-prisma.repository';
import { PrismaService } from './prisma.service';
import { PrismaModule } from './prisma.module';

const ENTITY_BINDINGS: Array<{ entity: new () => unknown; collection: string }> = [
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
  useFactory: (prisma: PrismaService) =>
    new M04PrismaRepository(entity as new () => { id: string }, prisma, collection),
  inject: [PrismaService],
}));

@Global()
@Module({
  imports: [PrismaModule],
  providers: [
    ...repositoryProviders,
  ],
  exports: [...repositoryProviders.map((p) => p.provide)],
})
export class M04DatabaseModule {}
