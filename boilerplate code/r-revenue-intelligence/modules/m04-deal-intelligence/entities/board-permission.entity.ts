import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { DealBoard } from './deal-board.entity';

export enum PermissionRole {
  VIEWER = 'VIEWER',
  EDITOR = 'EDITOR',
  ADMIN = 'ADMIN',
}

export enum PermissionSubjectType {
  USER = 'USER',
  TEAM = 'TEAM',
}

@Entity('board_permissions')
@Unique(['boardId', 'subjectType', 'subjectId'])
export class BoardPermission {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'board_id' })
  boardId: string;

  @Column({
    type: 'enum',
    enum: PermissionSubjectType,
    name: 'subject_type',
  })
  subjectType: PermissionSubjectType;

  @Column({ type: 'uuid', name: 'subject_id' })
  subjectId: string;

  @Column({
    type: 'enum',
    enum: PermissionRole,
  })
  role: PermissionRole;

  @Column({ type: 'uuid', name: 'granted_by' })
  grantedBy: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relations
  @ManyToOne(() => DealBoard, (board) => board.permissions, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'board_id' })
  board: DealBoard;
}
