import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum PreferenceScope {
  GLOBAL = 'GLOBAL',
  BOARD = 'BOARD',
  DEAL = 'DEAL',
}

@Entity('user_preferences')
@Index(['userId', 'scope', 'scopeId'])
export class UserPreference {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'user_id' })
  @Index()
  userId: string;

  @Column({
    type: 'enum',
    enum: PreferenceScope,
    default: PreferenceScope.GLOBAL,
  })
  scope: PreferenceScope;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'scope_id' })
  scopeId: string | null;

  @Column({ type: 'varchar', length: 255, name: 'preference_key' })
  preferenceKey: string;

  @Column({ type: 'jsonb', name: 'preference_value' })
  preferenceValue: Record<string, any>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
