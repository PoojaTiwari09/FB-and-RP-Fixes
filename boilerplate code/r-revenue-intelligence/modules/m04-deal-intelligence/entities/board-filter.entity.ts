import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { DealBoard } from './deal-board.entity';

export enum FilterOperator {
  EQUALS = 'EQUALS',
  NOT_EQUALS = 'NOT_EQUALS',
  GREATER_THAN = 'GREATER_THAN',
  GREATER_THAN_OR_EQUAL = 'GREATER_THAN_OR_EQUAL',
  LESS_THAN = 'LESS_THAN',
  LESS_THAN_OR_EQUAL = 'LESS_THAN_OR_EQUAL',
  CONTAINS = 'CONTAINS',
  NOT_CONTAINS = 'NOT_CONTAINS',
  IN = 'IN',
  NOT_IN = 'NOT_IN',
  IS_NULL = 'IS_NULL',
  IS_NOT_NULL = 'IS_NOT_NULL',
}

export enum FilterLogic {
  AND = 'AND',
  OR = 'OR',
}

@Entity('board_filters')
export class BoardFilter {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'board_id' })
  boardId: string;

  @Column({ type: 'varchar', length: 255, name: 'field_name' })
  fieldName: string;

  @Column({
    type: 'enum',
    enum: FilterOperator,
  })
  operator: FilterOperator;

  @Column({ type: 'jsonb', nullable: true })
  value: any;

  @Column({
    type: 'enum',
    enum: FilterLogic,
    default: FilterLogic.AND,
  })
  logic: FilterLogic;

  @Column({ type: 'int', default: 0 })
  order: number;

  @Column({ type: 'boolean', default: false, name: 'is_locked' })
  isLocked: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  // Relations
  @ManyToOne(() => DealBoard, (board) => board.filters, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'board_id' })
  board: DealBoard;
}
