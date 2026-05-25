import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

export enum AuditAction {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  PUBLISH = 'PUBLISH',
  UNPUBLISH = 'UNPUBLISH',
  SYNC = 'SYNC',
  ESCALATE = 'ESCALATE',
  VIEW_DEAL = 'VIEW_DEAL',
  UPDATE_DEAL = 'UPDATE_DEAL',
  GENERATE_SUMMARY = 'GENERATE_SUMMARY',
  FLAG_SUMMARY_FOR_REVIEW = 'FLAG_SUMMARY_FOR_REVIEW',
  UNFLAG_SUMMARY_FOR_REVIEW = 'UNFLAG_SUMMARY_FOR_REVIEW',
  GENERATE_WARNINGS = 'GENERATE_WARNINGS',
  RESOLVE_WARNING = 'RESOLVE_WARNING',
}

export enum AuditEntityType {
  BOARD = 'BOARD',
  DEAL = 'DEAL',
  FILTER = 'FILTER',
  TAB = 'TAB',
  COLUMN = 'COLUMN',
  PERMISSION = 'PERMISSION',
  WARNING = 'WARNING',
  PLAYBOOK = 'PLAYBOOK',
  COMMENT = 'COMMENT',
  TASK = 'TASK',
  DEAL_SUMMARY = 'DEAL_SUMMARY',
  DEAL_WARNING = 'DEAL_WARNING',
}

@Entity('audit_logs')
@Index(['entityType', 'entityId'])
@Index(['userId', 'createdAt'])
@Index(['action', 'createdAt'])
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: AuditEntityType,
    name: 'entity_type',
  })
  entityType: AuditEntityType;

  @Column({ type: 'uuid', name: 'entity_id' })
  entityId: string;

  @Column({
    type: 'enum',
    enum: AuditAction,
  })
  action: AuditAction;

  @Column({ type: 'uuid', nullable: true, name: 'user_id' })
  userId: string;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'user_name' })
  userName: string;

  @Column({ type: 'jsonb', nullable: true, name: 'changes_before' })
  changesBefore: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true, name: 'changes_after' })
  changesAfter: Record<string, any>;

  @Column({ type: 'varchar', length: 50, nullable: true, name: 'ip_address' })
  ipAddress: string;

  @Column({ type: 'text', nullable: true, name: 'user_agent' })
  userAgent: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
