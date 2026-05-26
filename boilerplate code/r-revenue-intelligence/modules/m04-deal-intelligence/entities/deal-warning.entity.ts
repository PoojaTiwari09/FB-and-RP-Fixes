import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Deal } from './deal.entity';

export enum WarningSeverity {
  CRITICAL = 'CRITICAL',
  CAUTION = 'CAUTION',
  INFO = 'INFO',
}

export enum WarningType {
  NO_CONTACT = 'NO_CONTACT',
  SINGLE_THREADED = 'SINGLE_THREADED',
  MISSING_CHAMPION = 'MISSING_CHAMPION',
  STALLED_DEAL = 'STALLED_DEAL',
  BUDGET_RISK = 'BUDGET_RISK',
  TIMELINE_RISK = 'TIMELINE_RISK',
  COMPETITOR_THREAT = 'COMPETITOR_THREAT',
  LOW_ENGAGEMENT = 'LOW_ENGAGEMENT',
  MISSING_DECISION_MAKER = 'MISSING_DECISION_MAKER',
  INCOMPLETE_QUALIFICATION = 'INCOMPLETE_QUALIFICATION',
}

@Entity('deal_warnings')
@Index(['dealId', 'severity'])
@Index(['dealId', 'isActive'])
export class DealWarning {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'deal_id' })
  dealId: string;

  @Column({
    type: 'enum',
    enum: WarningType,
  })
  type: WarningType;

  @Column({
    type: 'enum',
    enum: WarningSeverity,
  })
  severity: WarningSeverity;

  @Column({ type: 'text' })
  message: string;

  @Column({ type: 'text', nullable: true, name: 'recommended_action' })
  recommendedAction: string;

  @Column({ type: 'boolean', default: true, name: 'is_active' })
  isActive: boolean;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @Column({ type: 'timestamp', nullable: true, name: 'resolved_at' })
  resolvedAt: Date;

  @Column({ type: 'uuid', nullable: true, name: 'resolved_by' })
  resolvedBy: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relations
  @ManyToOne(() => Deal, (deal) => deal.warnings, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'deal_id' })
  deal: Deal;
}
