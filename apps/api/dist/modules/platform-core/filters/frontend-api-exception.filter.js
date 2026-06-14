"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var FrontendApiExceptionFilter_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.FrontendApiExceptionFilter = void 0;
const common_1 = require("@nestjs/common");
let FrontendApiExceptionFilter = FrontendApiExceptionFilter_1 = class FrontendApiExceptionFilter {
    logger = new common_1.Logger(FrontendApiExceptionFilter_1.name);
    catch(exception, host) {
        const ctx = host.switchToHttp();
        const res = ctx.getResponse();
        const req = ctx.getRequest();
        const status = exception.getStatus();
        const payload = exception.getResponse();
        const message = typeof payload === 'string'
            ? payload
            : payload.message;
        const text = Array.isArray(message)
            ? message.join('; ')
            : message || exception.message;
        const code = this.statusToCode(status, text);
        if (status >= 500) {
            this.logger.error(`${req.method} ${req.url} — ${text}`);
        }
        const requestId = req.headers['x-request-id'] ||
            req.headers['x-trace-id'] ||
            req.headers['trace-id'] ||
            `req_err_${Date.now()}`;
        const timestamp = new Date().toISOString();
        res.status(status).json({
            success: false,
            error: {
                code,
                message: text,
                details: typeof payload === 'object' ? payload : null,
            },
            requestId,
            timestamp,
        });
    }
    statusToCode(status, message) {
        if (status === common_1.HttpStatus.NOT_FOUND)
            return 'NOT_FOUND';
        if (status === common_1.HttpStatus.UNAUTHORIZED)
            return 'UNAUTHORIZED';
        if (status === common_1.HttpStatus.FORBIDDEN)
            return 'FORBIDDEN';
        if (status === common_1.HttpStatus.BAD_REQUEST)
            return 'BAD_REQUEST';
        if (message.includes('tenant'))
            return 'TENANT_REQUIRED';
        return 'REQUEST_FAILED';
    }
};
exports.FrontendApiExceptionFilter = FrontendApiExceptionFilter;
exports.FrontendApiExceptionFilter = FrontendApiExceptionFilter = FrontendApiExceptionFilter_1 = __decorate([
    (0, common_1.Catch)(common_1.HttpException)
], FrontendApiExceptionFilter);
//# sourceMappingURL=frontend-api-exception.filter.js.map