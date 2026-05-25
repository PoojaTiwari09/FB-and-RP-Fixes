import { IsString, IsNotEmpty, IsOptional, IsArray } from 'class-validator';

export class CreateScenarioDto {
  @IsString()
  @IsNotEmpty()
  persona_name: string;

  @IsString()
  @IsNotEmpty()
  persona_type: string;

  @IsString()
  @IsNotEmpty()
  difficulty: string;

  @IsString()
  @IsOptional()
  context_text?: string;

  @IsString()
  @IsOptional()
  custom_prompt?: string;

  @IsString()
  @IsOptional()
  voice_id?: string;

  @IsString()
  @IsOptional()
  personality_traits?: string;

  @IsString()
  @IsOptional()
  evaluation_focus?: string;

  @IsString()
  @IsOptional()
  objection_style?: string;

  @IsString()
  @IsOptional()
  conversation_expectations?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  target_skills?: string[];

  @IsString()
  @IsOptional()
  decision_drivers?: string;

  @IsString()
  @IsOptional()
  communication_style?: string;
}

export class UpdateScenarioDto {
  @IsString()
  @IsOptional()
  persona_name?: string;

  @IsString()
  @IsOptional()
  persona_type?: string;

  @IsString()
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

  @IsString()
  @IsOptional()
  personality_traits?: string;

  @IsString()
  @IsOptional()
  evaluation_focus?: string;

  @IsString()
  @IsOptional()
  objection_style?: string;

  @IsString()
  @IsOptional()
  conversation_expectations?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  target_skills?: string[];

  @IsString()
  @IsOptional()
  decision_drivers?: string;

  @IsString()
  @IsOptional()
  communication_style?: string;
}
