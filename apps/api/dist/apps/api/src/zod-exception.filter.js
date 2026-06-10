"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var ZodExceptionFilter_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ZodExceptionFilter = void 0;
const common_1 = require("@nestjs/common");
const zod_1 = require("zod");
let ZodExceptionFilter = ZodExceptionFilter_1 = class ZodExceptionFilter {
    logger = new common_1.Logger(ZodExceptionFilter_1.name);
    catch(exception, host) {
        const ctx = host.switchToHttp();
        const res = ctx.getResponse();
        const req = ctx.getRequest();
        const issues = exception.issues.map((i) => ({
            path: i.path.join('.'),
            message: i.message,
            code: i.code,
        }));
        this.logger.warn(`[Validation] ${req.method} ${req.url} — ${issues.length} issue(s): ${issues
            .map((i) => `${i.path}: ${i.message}`)
            .join('; ')}`);
        res.status(common_1.HttpStatus.BAD_REQUEST).json({
            success: false,
            error: {
                code: 'VALIDATION_ERROR',
                message: 'Request payload failed validation',
                details: issues,
            },
        });
    }
};
exports.ZodExceptionFilter = ZodExceptionFilter;
exports.ZodExceptionFilter = ZodExceptionFilter = ZodExceptionFilter_1 = __decorate([
    (0, common_1.Catch)(zod_1.ZodError)
], ZodExceptionFilter);
//# sourceMappingURL=zod-exception.filter.js.map