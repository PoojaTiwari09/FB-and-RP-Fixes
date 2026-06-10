import { ArgumentsHost, ExceptionFilter } from '@nestjs/common';
import { ZodError } from 'zod';
export declare class ZodExceptionFilter implements ExceptionFilter {
    private readonly logger;
    catch(exception: ZodError, host: ArgumentsHost): void;
}
