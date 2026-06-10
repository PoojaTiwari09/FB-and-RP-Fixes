import { ArgumentsHost, ExceptionFilter, HttpException } from '@nestjs/common';
export declare class FrontendApiExceptionFilter implements ExceptionFilter {
    private readonly logger;
    catch(exception: HttpException, host: ArgumentsHost): void;
    private statusToCode;
}
