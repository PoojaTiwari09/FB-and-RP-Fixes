import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { DealBoard } from './deal-board.entity';

export enum ColumnType {
  CRM = 'CRM',
  AI = 'AI',
  PLAYBOOK = 'PLAYBOOK',
  SYSTEM = 'SYSTEM',
  COMPUTED = 'COMPUTED',
}

export enum ColumnDataType {
  STRING = 'STRING',
  NUMBER = 'NUMBER',
  DATE = 'DATE',
  BOOLEAN = 'BOOLEAN',
  ENUM = 'ENUM',
  ARRAY = 'ARRAY',
  OBJECT = 'OBJECT',
  CURRENCY = 'CURRENCY',
  PICKLIST = 'PICKLIST',
}

@Entity('board_columns')
export class BoardColumn {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'board_id' })
  boardId: string;

  @Column({ type: 'varchar', length: 255 })
  label: string;

  @Column({ type: 'varchar', length: 255, name: 'field_key' })
  fieldKey: string;

  @Column({
    type: 'enum',
    enum: ColumnType,
  })
  type: ColumnType;

  @Column({
    type: 'enum',
    enum: ColumnDataType,
    name: 'data_type',
  })
  dataType: ColumnDataType;

  @Column({ type: 'int', default: 0 })
  order: number;

  @Column({ type: 'boolean', default: false, name: 'is_pinned' })
  isPinned: boolean;

  @Column({ type: 'boolean', default: true, name: 'is_visible' })
  isVisible: boolean;

  @Column({ type: 'boolean', default: true, name: 'is_sortable' })
  isSortable: boolean;

  @Column({ type: 'int', nullable: true })
  width: number;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  // Relations
  @ManyToOne(() => DealBoard, (board) => board.columns, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'board_id' })
  board: DealBoard;
}
