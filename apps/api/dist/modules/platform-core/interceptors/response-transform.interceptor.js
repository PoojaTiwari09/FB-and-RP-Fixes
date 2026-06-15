"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResponseTransformInterceptor = void 0;
const common_1 = require("@nestjs/common");
const operators_1 = require("rxjs/operators");
let ResponseTransformInterceptor = class ResponseTransformInterceptor {
    intercept(context, next) {
        const ctx = context.switchToHttp();
        const req = ctx.getRequest();
        return next.handle().pipe((0, operators_1.map)((data) => {
            const requestId = req.headers['x-request-id'] ||
                req.headers['x-trace-id'] ||
                req.headers['trace-id'] ||
                `req_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
            const timestamp = new Date().toISOString();
            const res = ctx.getResponse();
            if (res.headersSent) {
                return data;
            }
            const url = req.url || '';
            if (url.includes('/api/manager/')) {
                return data;
            }
            if (data && typeof data === 'object' && 'success' in data && 'data' in data) {
                return {
                    ...data,
                    meta: {
                        ...data.meta,
                        requestId: data.meta?.requestId || requestId,
                        timestamp: data.meta?.timestamp || timestamp,
                    }
                };
            }
            return {
                success: true,
                data: data ?? null,
                meta: {
                    requestId,
                    timestamp,
                },
            };
        }));
    }
};
exports.ResponseTransformInterceptor = ResponseTransformInterceptor;
exports.ResponseTransformInterceptor = ResponseTransformInterceptor = __decorate([
    (0, common_1.Injectable)()
], ResponseTransformInterceptor);
//# sourceMappingURL=response-transform.interceptor.js.map