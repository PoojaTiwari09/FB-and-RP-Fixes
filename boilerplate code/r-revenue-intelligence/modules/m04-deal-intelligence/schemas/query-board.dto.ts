import {
  IsOptional,
  IsEnum,
  IsInt,
  Min,
  Max,
  IsString,
  IsUUID,
  IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { BoardAudience, BoardStatus } from '@/entities';

export class QueryBoardDto {
  @ApiPropertyOptional({ description: 'Page number', minimum: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Page size', minimum: 1, maximum: 100, default: 25 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 25;

  @ApiPropertyOptional({ enum: BoardAudience, description: 'Filter by audience' })
  @IsOptional()
  @IsEnum(BoardAudience)
  audience?: BoardAudience;

  @ApiPropertyOptional({ enum: BoardStatus, description: 'Filter by status' })
  @IsOptional()
  @IsEnum(BoardStatus)
  status?: BoardStatus;

  @ApiPropertyOptional({ description: 'Filter by owner ID' })
  @IsOptional()
  @IsUUID()
  ownerId?: string;

  @ApiPropertyOptional({ description: 'Search by board name' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Include only boards user has access to' })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  accessibleOnly?: boolean = true;
}
