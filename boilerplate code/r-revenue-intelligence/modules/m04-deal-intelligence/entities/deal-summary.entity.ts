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

@Entity('deal_summaries')
@Index(['dealId', 'createdAt'])
export class DealSummary {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'deal_id' })
  dealId: string;

  @Column({ type: 'text' })
  summary: string;

  @Column({ type: 'jsonb', name: 'key_points' })
  keyPoints: string[];

  @Column({ type: 'jsonb', name: 'next_steps' })
  nextSteps: string[];

  @Column({ type: 'jsonb', nullable: true, name: 'competitor_mentions' })
  competitorMentions: string[];

  @Column({ type: 'decimal', precision: 5, scale: 2, name: 'confidence_score' })
  confidenceScore: number;

  @Column({ type: 'boolean', default: false, name: 'flagged_for_review' })
  flaggedForReview: boolean;

  @Column({ type: 'jsonb', nullable: true, name: 'weekly_changes' })
  weeklyChanges: Record<string, any>;

  @Column({ type: 'boolean', default: true, name: 'is_current' })
  isCurrent: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relations
  @ManyToOne(() => Deal, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'deal_id' })
  deal: Deal;
}
