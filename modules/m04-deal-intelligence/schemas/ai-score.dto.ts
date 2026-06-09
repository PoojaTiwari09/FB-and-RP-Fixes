import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AIScoreResponseDto {
  @ApiProperty({
    description: 'Deal ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  dealId: string;

  @ApiProperty({
    description: 'AI score (0-100)',
    example: 75,
  })
  score: number;

  @ApiProperty({
    description: 'Score explanation',
    example: 'High engagement, strong champion, but missing economic buyer',
  })
  explanation: string;

  @ApiProperty({
    description: 'Score factors',
    example: {
      engagement: 85,
      qualification: 70,
      momentum: 65,
      risk: 80,
    },
  })
  factors: Record<string, number>;

  @ApiProperty({
    description: 'Recommendations',
    type: [String],
    example: ['Schedule meeting with economic buyer', 'Update MEDDICC criteria'],
  })
  recommendations: string[];

  @ApiProperty({
    description: 'Generated at timestamp',
    example: '2024-01-15T10:30:00Z',
  })
  generatedAt: Date;
}

export class ScoreHistoryDto {
  @ApiProperty({
    description: 'Score',
    example: 75,
  })
  score: number;

  @ApiProperty({
    description: 'Recorded at timestamp',
    example: '2024-01-15T10:30:00Z',
  })
  recordedAt: Date;

  @ApiPropertyOptional({
    description: 'Change from previous score',
    example: 5,
  })
  change?: number;
}

export class ScoreHistoryResponseDto {
  @ApiProperty({
    description: 'Deal ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  dealId: string;

  @ApiProperty({
    description: 'Current score',
    example: 75,
  })
  currentScore: number;

  @ApiProperty({
    description: 'Score history',
    type: [ScoreHistoryDto],
  })
  history: ScoreHistoryDto[];

  @ApiProperty({
    description: 'Average score',
    example: 72.5,
  })
  averageScore: number;

  @ApiProperty({
    description: 'Trend (up, down, stable)',
    example: 'up',
  })
  trend: string;
}
