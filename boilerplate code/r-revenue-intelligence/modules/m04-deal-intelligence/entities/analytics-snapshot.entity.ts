import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

export enum AnalyticsType {
  DEAL_METRICS = 'DEAL_METRICS',
  TEAM_METRICS = 'TEAM_METRICS',
  FORECAST_METRICS = 'FORECAST_METRICS',
  BOARD_METRICS = 'BOARD_METRICS',
}

@Entity('analytics_snapshots')
@Index(['userId', 'type', 'snapshotDate'])
@Index(['boardId', 'type', 'snapshotDate'])
export class AnalyticsSnapshot {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: AnalyticsType,
  })
  type: AnalyticsType;

  @Column({ type: 'uuid', nullable: true, name: 'user_id' })
  userId: string;

  @Column({ type: 'uuid', nullable: true, name: 'board_id' })
  boardId: string;

  @Column({ type: 'date', name: 'snapshot_date' })
  snapshotDate: Date;

  @Column({ type: 'jsonb' })
  metrics: Record<string, any>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
