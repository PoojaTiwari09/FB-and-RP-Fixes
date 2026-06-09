// src/modules/deal-drivers/dto/deal-drivers.dto.ts

import {
  IsArray, IsBoolean, IsDateString, IsEnum,
  IsOptional, IsString, IsUUID, Matches, MaxLength,
  ArrayMaxSize, ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { Period } from '../entities/deal-drivers.entities';

// ─── Existing query DTOs ──────────────────────────────────────────────────────

export class MatrixQueryDto {
  @IsUUID()
  managerId!: string;

  @IsUUID()
  boardId!: string;

  @IsEnum(Period)
  @IsOptional()
  period?: Period = Period.NOW;

  @IsString()
  @IsOptional()
  token?: string;
}

export class DrillDownQueryDto {
  @IsUUID()
  repId!: string;

  @IsUUID()
  warningId!: string;

  @IsUUID()
  boardId!: string;

  @IsEnum(Period)
  @IsOptional()
  period?: Period = Period.NOW;
}

export class BoardComparisonQueryDto {
  @IsUUID()
  baselineBoardId!: string;

  @IsUUID()
  comparisonBoardId!: string;

  @IsUUID()
  @IsOptional()
  managerId?: string;

  @IsEnum(Period)
  @IsOptional()
  period?: Period = Period.NOW;
}

export class CoachingQueryDto {
  @IsUUID()
  repId!: string;

  @IsUUID()
  boardId!: string;
}

// ─── V10: Warning event ingestion ─────────────────────────────────────────────

export enum WarningEventStatus {
  ACTIVE   = 'ACTIVE',
  RESOLVED = 'RESOLVED',
}

export class CreateWarningEventDto {
  @IsUUID()
  dealId!: string;

  @IsUUID()
  warningId!: string;

  @IsEnum(WarningEventStatus)
  status!: WarningEventStatus;

  @IsDateString()
  triggeredAt!: string;
}

// ─── V10: Deal lifecycle management ──────────────────────────────────────────

export class OpenDealLifecycleDto {
  @IsUUID()
  dealId!: string;

  @IsUUID()
  repId!: string;

  @IsUUID()
  boardId!: string;

  @IsDateString()
  openedAt!: string;
}

export class CloseDealLifecycleDto {
  @IsDateString()
  closedAt!: string;
}

export class CreateDealReassignmentDto {
  @IsUUID()
  dealId!: string;

  @IsUUID()
  fromRepId!: string;

  @IsUUID()
  toRepId!: string;

  @IsDateString()
  reassignedAt!: string;
}

// ─── V11 US-32: Bulk event ingestion ─────────────────────────────────────────

export class BulkWarningEventDto {
  @IsArray()
  @ArrayMaxSize(500)
  @ValidateNested({ each: true })
  @Type(() => CreateWarningEventDto)
  events!: CreateWarningEventDto[];
}

// ─── V11 US-28: Warning definition CRUD ──────────────────────────────────────

export class CreateWarningDefinitionDto {
  /**
   * Unique snake_case key for this warning.
   * Must start with a lowercase letter, contain only a-z, 0-9, _
   * and be at most 64 characters.
   */
  @IsString()
  @MaxLength(64)
  @Matches(/^[a-z][a-z0-9_]{0,63}$/, {
    message: 'key must be snake_case, start with a lowercase letter, max 64 chars',
  })
  key!: string;

  @IsString()
  @MaxLength(255)
  label!: string;

  @IsString()
  @IsOptional()
  description?: string;
}

export class UpdateWarningDefinitionDto {
  @IsString()
  @MaxLength(255)
  @IsOptional()
  label?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
