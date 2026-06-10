"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TenantContextInterceptor = void 0;
const common_1 = require("@nestjs/common");
const rxjs_1 = require("rxjs");
const prisma_extension_1 = require("../database/prisma.extension");
let TenantContextInterceptor = class TenantContextInterceptor {
    intercept(context, next) {
        const request = context.switchToHttp().getRequest();
        const tenantId = request.user?.tenantId || request.headers['x-tenant-id'] || request.headers['tenant-id'];
        if (tenantId) {
            return new rxjs_1.Observable((subscriber) => {
                prisma_extension_1.tenantContext.run(tenantId, () => {
                    next.handle().subscribe(subscriber);
                });
            });
        }
        return next.handle();
    }
};
exports.TenantContextInterceptor = TenantContextInterceptor;
exports.TenantContextInterceptor = TenantContextInterceptor = __decorate([
    (0, common_1.Injectable)()
], TenantContextInterceptor);
//# sourceMappingURL=tenant-context.interceptor.js.map