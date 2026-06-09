import { IsString, IsOptional, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class GenerateCoachingPromptsDto {
  @ApiProperty({
    description: 'Deal ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  dealId: string;

  @ApiPropertyOptional({
    description: 'Sales rep user ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  @IsOptional()
  repId?: string;
}

export class CoachingPromptDto {
  @ApiProperty({
    description: 'Coaching question',
    example: 'Have you identified the economic buyer for this deal?',
  })
  question: string;

  @ApiProperty({
    description: 'Context for the question',
    example: 'The MEDDICC playbook shows Economic Buyer criterion is not started',
  })
  context: string;

  @ApiProperty({
    description: 'Category of the prompt',
    example: 'Qualification',
  })
  category: string;
}

export class CoachingPromptsResponseDto {
  @ApiProperty({
    description: 'Deal ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  dealId: string;

  @ApiProperty({
    description: 'Deal name',
    example: 'Acme Corp - Enterprise Plan',
  })
  dealName: string;

  @ApiProperty({
    description: 'Sales rep name',
    example: 'John Doe',
  })
  repName: string;

  @ApiProperty({
    description: 'Deal stage',
    example: 'Proposal Sent',
  })
  stage: string;

  @ApiProperty({
    description: 'Coaching prompts',
    type: [CoachingPromptDto],
  })
  prompts: CoachingPromptDto[];

  @ApiProperty({
    description: 'Focus areas for coaching',
    example: ['Qualification', 'Stakeholder Engagement', 'Timeline Management'],
  })
  focusAreas: string[];

  @ApiProperty({
    description: 'Generated at timestamp',
    example: '2024-01-15T10:30:00Z',
  })
  generatedAt: Date;
}

export class CoachingSessionDto {
  @ApiProperty({
    description: 'Session ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'Deal ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  dealId: string;

  @ApiProperty({
    description: 'Manager ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  managerId: string;

  @ApiProperty({
    description: 'Sales rep ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  repId: string;

  @ApiProperty({
    description: 'Coaching notes',
    example: 'Discussed qualification criteria and next steps',
  })
  notes: string;

  @ApiProperty({
    description: 'Action items',
    example: ['Schedule call with economic buyer', 'Update MEDDICC playbook'],
  })
  actionItems: string[];

  @ApiProperty({
    description: 'Session date',
    example: '2024-01-15T10:30:00Z',
  })
  sessionDate: Date;

  @ApiProperty({
    description: 'Created at timestamp',
    example: '2024-01-15T10:30:00Z',
  })
  createdAt: Date;
}
