"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SanitizeInterceptor = void 0;
const common_1 = require("@nestjs/common");
const operators_1 = require("rxjs/operators");
let SanitizeInterceptor = class SanitizeInterceptor {
    intercept(_ctx, next) {
        return next.handle().pipe((0, operators_1.map)((data) => this.sanitize(data)));
    }
    sanitize(obj) {
        if (obj === null || obj === undefined)
            return obj;
        if (typeof obj !== 'object')
            return obj;
        if (Array.isArray(obj))
            return obj.map((i) => this.sanitize(i));
        const sanitized = {};
        for (const [k, v] of Object.entries(obj)) {
            if (['password', 'password_hash', 'secret', 'token'].includes(k))
                continue;
            sanitized[k] = this.sanitize(v);
        }
        return sanitized;
    }
};
exports.SanitizeInterceptor = SanitizeInterceptor;
exports.SanitizeInterceptor = SanitizeInterceptor = __decorate([
    (0, common_1.Injectable)()
], SanitizeInterceptor);
//# sourceMappingURL=audit-sanitize.interceptor.js.map