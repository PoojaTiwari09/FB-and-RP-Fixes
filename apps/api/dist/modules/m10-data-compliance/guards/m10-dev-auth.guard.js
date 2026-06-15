"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.M10DevAuthGuard = void 0;
const common_1 = require("@nestjs/common");
const DEMO_TENANT = "00000000-0000-0000-0000-000000000001";
const DEMO_USER = "00000000-0000-0000-0000-000000000002";
let M10DevAuthGuard = class M10DevAuthGuard {
    canActivate(context) {
        const req = context.switchToHttp().getRequest();
        const tenantId = req.headers["x-tenant-id"] ||
            req.headers["x-org-id"] ||
            DEMO_TENANT;
        const userId = req.headers["x-user-id"] || DEMO_USER;
        req.user = {
            userId,
            tenantId,
            email: req.headers["x-email"] || "dev@m10.local",
        };
        req.tenantId = tenantId;
        return true;
    }
};
exports.M10DevAuthGuard = M10DevAuthGuard;
exports.M10DevAuthGuard = M10DevAuthGuard = __decorate([
    (0, common_1.Injectable)()
], M10DevAuthGuard);
//# sourceMappingURL=m10-dev-auth.guard.js.map