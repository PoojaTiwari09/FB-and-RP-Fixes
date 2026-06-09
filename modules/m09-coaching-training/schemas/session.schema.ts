import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class StartSessionDto {
  @IsString()
  @IsNotEmpty()
  scenarioId: string;

  @IsString()
  @IsOptional()
  voiceId?: string;

  @IsString()
  @IsOptional()
  assignmentId?: string;
}

export class SendMessageDto {
  @IsString()
  @IsNotEmpty()
  sessionId: string;

  @IsString()
  @IsNotEmpty()
  message: string;
}

export class EndSessionDto {
  @IsString()
  @IsNotEmpty()
  sessionId: string;
}
