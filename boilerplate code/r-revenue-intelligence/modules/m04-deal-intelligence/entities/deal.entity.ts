import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { DealWarning } from './deal-warning.entity';
import { DealPlaybook } from './deal-playbook.entity';
import { DealActivity } from './deal-activity.entity';
import { DealComment } from './deal-comment.entity';
import { DealTask } from './deal-task.entity';

export enum DealStage {
  PROSPECTING = 'PROSPECTING',
  QUALIFICATION = 'QUALIFICATION',
  NEEDS_ANALYSIS = 'NEEDS_ANALYSIS',
  PROPOSAL = 'PROPOSAL',
  NEGOTIATION = 'NEGOTIATION',
  CLOSED_WON = 'CLOSED_WON',
  CLOSED_LOST = 'CLOSED_LOST',
}

export enum ForecastCategory {
  PIPELINE = 'PIPELINE',
  BEST_CASE = 'BEST_CASE',
  COMMIT = 'COMMIT',
  CLOSED = 'CLOSED',
}

@Entity('deals')
@Index(['ownerId', 'stage'])
@Index(['ownerId', 'forecastCategory'])
@Index(['closeDate'])
@Index(['crmDealId'], { unique: true })
export class Deal {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255, unique: true, name: 'crm_deal_id' })
  crmDealId: string;

  @Column({ type: 'varchar', length: 500 })
  name: string;

  @Column({
    type: 'enum',
    enum: DealStage,
  })
  stage: DealStage;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  amount: number;

  @Column({
    type: 'enum',
    enum: ForecastCategory,
    name: 'forecast_category',
  })
  forecastCategory: ForecastCategory;

  @Column({ type: 'uuid', name: 'owner_id' })
  ownerId: string;

  @Column({ type: 'varchar', length: 255, name: 'owner_name' })
  ownerName: string;

  @Column({ type: 'uuid', nullable: true, name: 'account_id' })
  accountId: string;

  @Column({ type: 'varchar', length: 500, nullable: true, name: 'account_name' })
  accountName: string;

  @Column({ type: 'date', nullable: true, name: 'close_date' })
  closeDate: Date;

  @Column({ type: 'int', default: 0, name: 'probability' })
  probability: number;

  @Column({ type: 'int', default: 0, name: 'ai_score' })
  aiScore: number;

  @Column({ type: 'int', default: 0, name: 'warning_count' })
  warningCount: number;

  @Column({ type: 'int', default: 0, name: 'contact_count' })
  contactCount: number;

  @Column({ type: 'int', default: 0, name: 'activity_strength' })
  activityStrength: number;

  @Column({ type: 'boolean', default: false, name: 'is_high_risk' })
  isHighRisk: boolean;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'risk_reason' })
  riskReason: string;

  @Column({ type: 'text', nullable: true, name: 'next_step' })
  nextStep: string;

  @Column({ type: 'jsonb', nullable: true, name: 'crm_data' })
  crmData: Record<string, any>;

  @Column({ type: 'timestamp', nullable: true, name: 'last_activity_at' })
  lastActivityAt: Date;

  @Column({ type: 'timestamp', nullable: true, name: 'last_synced_at' })
  lastSyncedAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relations
  @OneToMany(() => DealWarning, (warning) => warning.deal, {
    cascade: false,
    eager: false,
  })
  warnings: DealWarning[];

  @OneToMany(() => DealPlaybook, (playbook) => playbook.deal, {
    cascade: false,
    eager: false,
  })
  playbooks: DealPlaybook[];

  @OneToMany(() => DealActivity, (activity) => activity.deal, {
    cascade: false,
    eager: false,
  })
  activities: DealActivity[];

  @OneToMany(() => DealComment, (comment) => comment.deal, {
    cascade: false,
    eager: false,
  })
  comments: DealComment[];

  @OneToMany(() => DealTask, (task) => task.deal, {
    cascade: false,
    eager: false,
  })
  tasks: DealTask[];
}
