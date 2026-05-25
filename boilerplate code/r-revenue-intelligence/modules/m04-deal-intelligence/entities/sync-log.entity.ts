import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

export enum SyncStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

export enum SyncType {
  FULL = 'FULL',
  INCREMENTAL = 'INCREMENTAL',
  WEBHOOK = 'WEBHOOK',
}

export enum SyncEntityType {
  DEAL = 'DEAL',
  CONTACT = 'CONTACT',
  ACTIVITY = 'ACTIVITY',
  OWNER = 'OWNER',
}

@Entity('sync_logs')
@Index(['entityType', 'status'])
@Index(['syncType', 'createdAt'])
export class SyncLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: SyncType,
  })
  syncType: SyncType;

  @Column({
    type: 'enum',
    enum: SyncEntityType,
    name: 'entity_type',
  })
  entityType: SyncEntityType;

  @Column({
    type: 'enum',
    enum: SyncStatus,
    default: SyncStatus.PENDING,
  })
  status: SyncStatus;

  @Column({ type: 'int', default: 0, name: 'records_processed' })
  recordsProcessed: number;

  @Column({ type: 'int', default: 0, name: 'records_created' })
  recordsCreated: number;

  @Column({ type: 'int', default: 0, name: 'records_updated' })
  recordsUpdated: number;

  @Column({ type: 'int', default: 0, name: 'records_failed' })
  recordsFailed: number;

  @Column({ type: 'text', nullable: true, name: 'error_message' })
  errorMessage: string;

  @Column({ type: 'jsonb', nullable: true, name: 'error_details' })
  errorDetails: Record<string, any>;

  @Column({ type: 'timestamp', nullable: true, name: 'started_at' })
  startedAt: Date;

  @Column({ type: 'timestamp', nullable: true, name: 'completed_at' })
  completedAt: Date;

  @Column({ type: 'int', nullable: true, name: 'duration_ms' })
  durationMs: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
