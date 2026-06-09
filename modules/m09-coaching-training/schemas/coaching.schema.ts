import { IsString, IsNotEmpty, IsOptional, IsEnum } from 'class-validator';

export class CreateNoteDto {
  @IsString()
  @IsNotEmpty()
  repId: string;

  @IsString()
  @IsNotEmpty()
  content: string;

  @IsString()
  @IsOptional()
  @IsEnum(['Low', 'Medium', 'High'])
  priority?: string;
}
