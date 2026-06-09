import {
  ArgumentsHost, Catch, ExceptionFilter, HttpStatus, Logger,
} from '@nestjs/common';
import { ZodError } from 'zod';

/**
 * ZodExceptionFilter — converts ZodError raised by `schema.parse(body)` calls
 * inside controllers into RFC-7807-style 400 responses. Previously these
 * bubbled up as 500s, which made request validation indistinguishable from
 * server bugs in client error logs.
 */
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
      statusCode: HttpStatus.BAD_REQUEST,
      error:      'Bad Request',
      message:    'Request payload failed validation',
      details:    issues,
      path:       req.url,
      timestamp:  new Date().toISOString(),
    });
  }
}
