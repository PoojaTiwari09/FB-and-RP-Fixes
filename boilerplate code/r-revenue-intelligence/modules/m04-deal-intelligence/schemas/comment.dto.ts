import { IsString, IsBoolean, IsOptional, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCommentDto {
  @ApiProperty({
    description: 'Comment content',
    example: 'Customer is very interested in the enterprise plan',
  })
  @IsString()
  @MaxLength(5000)
  content: string;

  @ApiPropertyOptional({
    description: 'Is this a coaching comment from a manager',
    example: false,
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  isCoaching?: boolean;
}

export class UpdateCommentDto {
  @ApiProperty({
    description: 'Comment content',
    example: 'Customer is very interested in the enterprise plan',
  })
  @IsString()
  @MaxLength(5000)
  content: string;
}

export class CommentResponseDto {
  @ApiProperty({
    description: 'Comment ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'Deal ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  dealId: string;

  @ApiProperty({
    description: 'Comment content',
    example: 'Customer is very interested in the enterprise plan',
  })
  content: string;

  @ApiProperty({
    description: 'Author user ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  authorId: string;

  @ApiProperty({
    description: 'Author name',
    example: 'John Doe',
  })
  authorName: string;

  @ApiProperty({
    description: 'Author role',
    example: 'MANAGER',
  })
  authorRole: string;

  @ApiProperty({
    description: 'Is this a coaching comment',
    example: false,
  })
  isCoaching: boolean;

  @ApiProperty({
    description: 'Is the comment edited',
    example: false,
  })
  isEdited: boolean;

  @ApiPropertyOptional({
    description: 'Edited at timestamp',
    example: '2024-01-15T10:30:00Z',
  })
  editedAt?: Date;

  @ApiProperty({
    description: 'Created at timestamp',
    example: '2024-01-15T10:30:00Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Updated at timestamp',
    example: '2024-01-15T10:30:00Z',
  })
  updatedAt: Date;
}
