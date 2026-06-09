import { IsString, IsNotEmpty, IsOptional, IsEnum, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class ExportQueryDto {
  @IsString()
  @IsOptional()
  @IsEnum(['csv', 'json'])
  format?: 'csv' | 'json';

  @IsString()
  @IsOptional()
  dateRange?: string;

  @IsString()
  @IsOptional()
  type?: string;
}

export class PaginationQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 10;
}
