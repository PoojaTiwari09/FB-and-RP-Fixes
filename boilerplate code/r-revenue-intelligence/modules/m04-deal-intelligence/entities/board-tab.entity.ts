import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { DealBoard } from './deal-board.entity';

@Entity('board_tabs')
export class BoardTab {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'board_id' })
  boardId: string;

  @Column({ type: 'varchar', length: 255 })
  label: string;

  @Column({ type: 'varchar', length: 255, name: 'crm_field' })
  crmField: string;

  @Column({ type: 'jsonb', name: 'field_values' })
  fieldValues: string[];

  @Column({ type: 'int', default: 0 })
  order: number;

  @Column({ type: 'boolean', default: true, name: 'show_rollup' })
  showRollup: boolean;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  // Relations
  @ManyToOne(() => DealBoard, (board) => board.tabs, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'board_id' })
  board: DealBoard;
}
