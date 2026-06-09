import { IsString, IsBoolean, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class EscalateRiskDto {
  @ApiProperty({
    description: 'Reason for escalation',
    example: 'Deal has been stalled for 3 weeks with no response from decision maker',
    maxLength: 500,
  })
  @IsString()
  @MaxLength(500)
  riskReason: string;
}

export class DeescalateRiskDto {
  @ApiProperty({
    description: 'Reason for de-escalation',
    example: 'Decision maker has re-engaged and scheduled next meeting',
    maxLength: 500,
  })
  @IsString()
  @MaxLength(500)
  reason: string;
}

export class RiskEscalationResponseDto {
  @ApiProperty({
    description: 'Deal ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'Is high risk',
    example: true,
  })
  isHighRisk: boolean;

  @ApiProperty({
    description: 'Risk reason',
    example: 'Deal has been stalled for 3 weeks with no response from decision maker',
  })
  riskReason: string;

  @ApiProperty({
    description: 'Escalated by user ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  escalatedBy: string;

  @ApiProperty({
    description: 'Escalated at timestamp',
    example: '2024-01-15T10:30:00Z',
  })
  escalatedAt: Date;

  @ApiProperty({
    description: 'Message',
    example: 'Deal escalated to high risk successfully',
  })
  message: string;
}
