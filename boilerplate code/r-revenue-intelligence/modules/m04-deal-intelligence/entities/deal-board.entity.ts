import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { BoardFilter } from './board-filter.entity';
import { BoardTab } from './board-tab.entity';
import { BoardColumn } from './board-column.entity';
import { BoardPermission } from './board-permission.entity';

export enum BoardAudience {
  AE = 'AE',
  MANAGER = 'MANAGER',
  EXEC = 'EXEC',
  EXECUTIVE = 'EXECUTIVE',
}

export enum BoardStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  ARCHIVED = 'ARCHIVED',
}

@Entity('deal_boards')
export class DealBoard {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({
    type: 'enum',
    enum: BoardAudience,
    array: true,
    default: [BoardAudience.AE],
  })
  audience: BoardAudience[];

  @Column({
    type: 'enum',
    enum: BoardStatus,
    default: BoardStatus.DRAFT,
  })
  status: BoardStatus;

  @Column({ type: 'uuid', name: 'owner_id' })
  ownerId: string;

  @Column({ type: 'boolean', default: false, name: 'is_locked' })
  isLocked: boolean;

  @Column({ type: 'boolean', default: false, name: 'allow_rep_column_reorder' })
  allowRepColumnReorder: boolean;

  @Column({ type: 'boolean', default: true, name: 'prevent_manual_deal_override' })
  preventManualDealOverride: boolean;

  @Column({ type: 'jsonb', nullable: true, name: 'metadata' })
  metadata: Record<string, any>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Column({ type: 'timestamp', nullable: true, name: 'published_at' })
  publishedAt: Date;

  // Relations
  @OneToMany(() => BoardFilter, (filter) => filter.board, {
    cascade: true,
    eager: false,
  })
  filters: BoardFilter[];

  @OneToMany(() => BoardTab, (tab) => tab.board, {
    cascade: true,
    eager: false,
  })
  tabs: BoardTab[];

  @OneToMany(() => BoardColumn, (column) => column.board, {
    cascade: true,
    eager: false,
  })
  columns: BoardColumn[];

  @OneToMany(() => BoardPermission, (permission) => permission.board, {
    cascade: true,
    eager: false,
  })
  permissions: BoardPermission[];
}
