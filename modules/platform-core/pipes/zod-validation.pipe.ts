import { PipeTransform, Injectable, ArgumentMetadata, BadRequestException } from '@nestjs/common';
import { ZodSchema, ZodError } from 'zod';

@Injectable()
export class ZodValidationPipe implements PipeTransform {
  constructor(private schema: ZodSchema<any>) {}

  transform(value: any, metadata: ArgumentMetadata) {
    if (metadata.type === 'custom') {
      return value; // Skip custom decorators
    }

    try {
      return this.schema.parse(value);
    } catch (error) {
      if (error instanceof ZodError) {
        const details = error.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
          received: value?.[e.path[0] as string] ?? typeof value,
        }));
        
        throw new BadRequestException({
          message: 'Validation failed',
          details,
        });
      }
      throw new BadRequestException('Validation failed');
    }
  }
}
