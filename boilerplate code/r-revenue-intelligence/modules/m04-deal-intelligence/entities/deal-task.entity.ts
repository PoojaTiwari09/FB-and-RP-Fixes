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

export enum TaskStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum TaskPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

export enum TaskSource {
  AI_SUGGESTED = 'AI_SUGGESTED',
  MANAGER_ASSIGNED = 'MANAGER_ASSIGNED',
  USER_CREATED = 'USER_CREATED',
}

@Entity('deal_tasks')
@Index(['dealId', 'status'])
@Index(['dealId', 'dueDate'])
@Index(['assigneeId', 'status'])
export class DealTask {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'deal_id' })
  dealId: string;

  @Column({ type: 'varchar', length: 500 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({
    type: 'enum',
    enum: TaskStatus,
    default: TaskStatus.PENDING,
  })
  status: TaskStatus;

  @Column({
    type: 'enum',
    enum: TaskPriority,
    default: TaskPriority.MEDIUM,
  })
  priority: TaskPriority;

  @Column({
    type: 'enum',
    enum: TaskSource,
  })
  source: TaskSource;

  @Column({ type: 'uuid', name: 'assignee_id' })
  assigneeId: string;

  @Column({ type: 'varchar', length: 255, name: 'assignee_name' })
  assigneeName: string;

  @Column({ type: 'uuid', nullable: true, name: 'assigned_by' })
  assignedBy: string;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'assigned_by_name' })
  assignedByName: string;

  @Column({ type: 'date', nullable: true, name: 'due_date' })
  dueDate: Date | null;

  @Column({ type: 'timestamp', nullable: true, name: 'completed_at' })
  completedAt: Date | null;

  @Column({ type: 'uuid', nullable: true, name: 'completed_by' })
  completedBy: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'engage_todo_id' })
  engageTodoId: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relations
  @ManyToOne(() => Deal, (deal) => deal.tasks, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'deal_id' })
  deal: Deal;
}
