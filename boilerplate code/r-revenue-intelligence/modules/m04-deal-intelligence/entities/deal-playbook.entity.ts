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

export enum PlaybookType {
  MEDDICC = 'MEDDICC',
  BANT = 'BANT',
  CUSTOM = 'CUSTOM',
}

export enum PlaybookItemStatus {
  NOT_STARTED = 'NOT_STARTED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  BLOCKED = 'BLOCKED',
}

@Entity('deal_playbooks')
@Index(['dealId', 'type'])
export class DealPlaybook {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'deal_id' })
  dealId: string;

  @Column({
    type: 'enum',
    enum: PlaybookType,
    default: PlaybookType.MEDDICC,
  })
  type: PlaybookType;

  @Column({ type: 'varchar', length: 255 })
  criterion: string;

  @Column({
    type: 'enum',
    enum: PlaybookItemStatus,
    default: PlaybookItemStatus.NOT_STARTED,
  })
  status: PlaybookItemStatus;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ type: 'text', nullable: true, name: 'ai_suggestion' })
  aiSuggestion: string;

  @Column({ type: 'int', default: 0 })
  order: number;

  @Column({ type: 'uuid', nullable: true, name: 'completed_by' })
  completedBy: string | null;

  @Column({ type: 'timestamp', nullable: true, name: 'completed_at' })
  completedAt: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relations
  @ManyToOne(() => Deal, (deal) => deal.playbooks, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'deal_id' })
  deal: Deal;
}
