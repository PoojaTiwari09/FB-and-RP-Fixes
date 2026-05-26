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

@Entity('deal_comments')
@Index(['dealId', 'createdAt'])
export class DealComment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'deal_id' })
  dealId: string;

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'uuid', name: 'author_id' })
  authorId: string;

  @Column({ type: 'varchar', length: 255, name: 'author_name' })
  authorName: string;

  @Column({ type: 'varchar', length: 50, name: 'author_role' })
  authorRole: string;

  @Column({ type: 'boolean', default: false, name: 'is_coaching' })
  isCoaching: boolean;

  @Column({ type: 'boolean', default: false, name: 'is_edited' })
  isEdited: boolean;

  @Column({ type: 'timestamp', nullable: true, name: 'edited_at' })
  editedAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relations
  @ManyToOne(() => Deal, (deal) => deal.comments, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'deal_id' })
  deal: Deal;
}
