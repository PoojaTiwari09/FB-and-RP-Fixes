import { IsString, IsNotEmpty, IsArray, IsOptional, IsEnum, IsDateString } from 'class-validator';

export class CreateAssignmentDto {
  @IsArray()
  @IsString({ each: true })
  repIds: string[];

  @IsString()
  @IsNotEmpty()
  scenarioId: string;

  @IsDateString()
  @IsNotEmpty()
  deadline: string;

  @IsString()
  @IsOptional()
  @IsEnum(['Low', 'Medium', 'High'])
  priority?: string;
}

export class UpdateAssignmentDto {
  @IsString()
  @IsOptional()
  @IsEnum(['Pending', 'In Progress', 'Completed'])
  status?: string;

  @IsString()
  @IsOptional()
  @IsEnum(['Low', 'Medium', 'High'])
  priority?: string;

  @IsDateString()
  @IsOptional()
  deadline?: string;
}
