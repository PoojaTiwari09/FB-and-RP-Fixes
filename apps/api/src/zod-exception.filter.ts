import {
  ArgumentsHost, Catch, ExceptionFilter, HttpStatus, Logger,
} from '@nestjs/common';
import { ZodError } from 'zod';

@Catch(ZodError)
export class ZodExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(ZodExceptionFilter.name);

  catch(exception: ZodError, host: ArgumentsHost) {
    const ctx  = host.switchToHttp();
    const res  = ctx.getResponse();
    const req  = ctx.getRequest();

    const issues = exception.issues.map((i) => ({
      path:    i.path.join('.'),
      message: i.message,
      code:    i.code,
    }));

    this.logger.warn(
      `[Validation] ${req.method} ${req.url} — ${issues.length} issue(s): ${issues
        .map((i) => `${i.path}: ${i.message}`)
        .join('; ')}`,
    );

    res.status(HttpStatus.BAD_REQUEST).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Request payload failed validation',
        details: issues,
      },
    });
  }
}
