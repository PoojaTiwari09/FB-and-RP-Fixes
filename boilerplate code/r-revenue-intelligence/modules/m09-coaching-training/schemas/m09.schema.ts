import { IsString, IsNotEmpty, IsOptional, IsArray, IsEnum, IsInt, IsNumber, Min, Max, IsDateString } from 'class-validator';

// ─── AUTH SCHEMAS ─────────────────────────────────────────────────────────────

export class RegisterDto {
  @IsString()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  password: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsEnum(['admin', 'org_admin', 'manager', 'rep', 'trainer'])
  role: string;

  @IsString()
  @IsNotEmpty()
  org_id: string;

  @IsString()
  @IsOptional()
  manager_id?: string;
}

export class LoginDto {
  @IsString()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  password: string;
}

// ─── SESSION SCHEMAS ──────────────────────────────────────────────────────────

export class StartSessionDto {
  @IsString()
  @IsNotEmpty()
  scenarioId: string;

  @IsString()
  @IsOptional()
  voiceId?: string;

  @IsString()
  @IsOptional()
  selectedVoiceId?: string;

  @IsString()
  @IsOptional()
  assignmentId?: string;
}

export class SendMessageDto {
  @IsString()
  @IsNotEmpty()
  sessionId: string;

  @IsString()
  @IsOptional()
  message?: string;

  @IsString()
  @IsOptional()
  text?: string;
}

export class EndSessionDto {
  @IsString()
  @IsNotEmpty()
  sessionId: string;
}

// ─── SCENARIO SCHEMAS ────────────────────────────────────────────────────────

export class CreateScenarioDto {
  @IsString()
  @IsNotEmpty()
  persona_name: string;

  @IsString()
  @IsNotEmpty()
  persona_type: string;

  @IsString()
  @IsEnum(['beginner', 'intermediate', 'advanced'])
  difficulty: string;

  @IsString()
  @IsNotEmpty()
  context_text: string;

  @IsString()
  @IsOptional()
  custom_prompt?: string;

  @IsString()
  @IsOptional()
  voice_id?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  target_skills?: string[];

  @IsString()
  @IsOptional()
  evaluation_focus?: string;

  @IsString()
  @IsOptional()
  objection_style?: string;

  @IsString()
  @IsOptional()
  personality_traits?: string;

  @IsString()
  @IsOptional()
  objectives?: string;

  @IsString()
  @IsOptional()
  goals?: string;

  @IsString()
  @IsOptional()
  source_transcript?: string;
}

export class UpdateScenarioDto {
  @IsString()
  @IsOptional()
  persona_name?: string;

  @IsString()
  @IsOptional()
  persona_type?: string;

  @IsString()
  @IsEnum(['beginner', 'intermediate', 'advanced'])
  @IsOptional()
  difficulty?: string;

  @IsString()
  @IsOptional()
  context_text?: string;

  @IsString()
  @IsOptional()
  custom_prompt?: string;

  @IsString()
  @IsOptional()
  voice_id?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  target_skills?: string[];

  @IsString()
  @IsOptional()
  evaluation_focus?: string;

  @IsString()
  @IsOptional()
  objection_style?: string;

  @IsString()
  @IsOptional()
  personality_traits?: string;

  @IsString()
  @IsOptional()
  objectives?: string;

  @IsString()
  @IsOptional()
  goals?: string;

  @IsString()
  @IsOptional()
  source_transcript?: string;
}

// ─── COACHING SCHEMAS ────────────────────────────────────────────────────────

export class CreateNoteDto {
  @IsString()
  @IsNotEmpty()
  repId: string;

  @IsString()
  @IsNotEmpty()
  content: string;

  @IsString()
  @IsNotEmpty()
  priority: string;
}

// ─── TRAINING SCHEMAS ────────────────────────────────────────────────────────

export class CreateAssignmentDto {
  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty()
  repIds: string[];

  @IsString()
  @IsNotEmpty()
  scenarioId: string;

  @IsDateString()
  @IsNotEmpty()
  deadline: string;

  @IsString()
  @IsOptional()
  priority?: string; // 'Low' | 'Medium' | 'High'

  @IsNumber()
  @IsOptional()
  maxAttempts?: number;

  @IsNumber()
  @IsOptional()
  maxHints?: number;
}

export class UpdateAssignmentDto {
  @IsString()
  @IsOptional()
  status?: 'Pending' | 'In Progress' | 'Completed';

  @IsString()
  @IsOptional()
  priority?: 'Low' | 'Medium' | 'High';

  @IsDateString()
  @IsOptional()
  deadline?: string;

  @IsString()
  @IsOptional()
  best_session_id?: string;

  @IsNumber()
  @IsOptional()
  manager_score?: number;

  @IsString()
  @IsOptional()
  manager_note?: string;
}

// ─── ANALYTICS SCHEMAS ───────────────────────────────────────────────────────

export class ExportQueryDto {
  @IsString()
  @IsOptional()
  format?: 'csv' | 'json';

  @IsString()
  @IsOptional()
  dateRange?: string;

  @IsString()
  @IsOptional()
  type?: string;

  @IsString()
  @IsOptional()
  filters?: string;
}

export class PaginationQueryDto {
  @IsInt()
  @Min(1)
  @IsOptional()
  page?: number;

  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  limit?: number;
}
