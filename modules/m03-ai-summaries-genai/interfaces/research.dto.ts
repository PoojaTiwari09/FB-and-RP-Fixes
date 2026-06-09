import { IsString, IsOptional, IsNumber, IsObject, MaxLength, Min, Max } from 'class-validator';

export class CreateJobDto {
  @IsString()
  @MaxLength(1000)
  query: string;

  @IsOptional()
  @IsString()
  contextType?: string = 'ACCOUNT';

  @IsOptional()
  @IsString()
  contextId?: string;

  @IsOptional()
  @IsString()
  scope?: string = 'ENTIRE_ACCOUNT';

  @IsOptional()
  @IsNumber()
  @Min(7)
  @Max(365)
  periodDays?: number = 60;

  @IsOptional()
  @IsObject()
  filters?: Record<string, any> = {};

  @IsOptional()
  webDataEnabled?: boolean = false;
}

export class JobStatusDto {
  jobId: string;
  status: string;
  progressPct: number;
  progressStage: string;
  query: string;
  filters: Record<string, any>;
  subQueries: any[];
  error: string | null;
  reportId: string | null;
  createdAt: string;
  completedAt: string | null;
}

export class FeedbackDto {
  @IsString()
  type: string; // THUMBS_UP | THUMBS_DOWN | FLAG_INACCURACY

  @IsOptional()
  @IsString()
  sectionId?: string;

  @IsOptional()
  @IsString()
  bulletId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}
