import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';

/**
 * Maps Nest HttpException → locked frontend error contract:
 * { error: true, code, message }
 */
@Catch(HttpException)
export class FrontendApiExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(FrontendApiExceptionFilter.name);

  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse();
    const req = ctx.getRequest();
    const status = exception.getStatus();
    const payload = exception.getResponse();
    const message =
      typeof payload === 'string'
        ? payload
        : (payload as { message?: string | string[] }).message;

    const text = Array.isArray(message)
      ? message.join('; ')
      : message || exception.message;

    const code = this.statusToCode(status, text);

    if (status >= 500) {
      this.logger.error(`${req.method} ${req.url} — ${text}`);
    }

    res.status(status).json({
      error: true,
      code,
      message: text,
    });
  }

  private statusToCode(status: number, message: string): string {
    if (status === HttpStatus.NOT_FOUND) return 'NOT_FOUND';
    if (status === HttpStatus.UNAUTHORIZED) return 'UNAUTHORIZED';
    if (status === HttpStatus.FORBIDDEN) return 'FORBIDDEN';
    if (status === HttpStatus.BAD_REQUEST) return 'BAD_REQUEST';
    if (message.includes('tenant')) return 'TENANT_REQUIRED';
    return 'REQUEST_FAILED';
  }
}
