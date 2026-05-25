import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Deal } from './deal.entity';

export enum ActivityType {
  CALL = 'CALL',
  EMAIL = 'EMAIL',
  MEETING = 'MEETING',
  NOTE = 'NOTE',
  TASK = 'TASK',
}

@Entity('deal_activities')
@Index(['dealId', 'activityDate'])
@Index(['dealId', 'type'])
export class DealActivity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'deal_id' })
  dealId: string;

  @Column({ type: 'varchar', length: 255, unique: true, name: 'crm_activity_id' })
  crmActivityId: string;

  @Column({
    type: 'enum',
    enum: ActivityType,
  })
  type: ActivityType;

  @Column({ type: 'varchar', length: 500, nullable: true })
  subject: string;

  @Column({ type: 'text', nullable: true })
  summary: string;

  @Column({ type: 'uuid', nullable: true, name: 'contact_id' })
  contactId: string;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'contact_name' })
  contactName: string;

  @Column({ type: 'timestamp', name: 'activity_date' })
  activityDate: Date;

  @Column({ type: 'int', nullable: true, name: 'duration_minutes' })
  durationMinutes: number;

  @Column({ type: 'jsonb', nullable: true, name: 'crm_data' })
  crmData: Record<string, any>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  // Relations
  @ManyToOne(() => Deal, (deal) => deal.activities, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'deal_id' })
  deal: Deal;
}
