"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var HmacWebhookGuard_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.HmacWebhookGuard = void 0;
const common_1 = require("@nestjs/common");
const crypto = __importStar(require("crypto"));
let HmacWebhookGuard = HmacWebhookGuard_1 = class HmacWebhookGuard {
    logger = new common_1.Logger(HmacWebhookGuard_1.name);
    canActivate(context) {
        const request = context.switchToHttp().getRequest();
        const secret = process.env.WEBHOOK_SECRET;
        const signature = request.headers['x-webhook-signature'];
        if (!secret) {
            if (request.headers['x-webhook-test'] === '1') {
                this.logger.warn('[HmacWebhookGuard] WEBHOOK_SECRET unset — allowing because x-webhook-test=1');
                return true;
            }
            throw new common_1.UnauthorizedException('WEBHOOK_SECRET not configured on the server');
        }
        if (!signature || typeof signature !== 'string') {
            throw new common_1.UnauthorizedException('Missing x-webhook-signature header');
        }
        const body = JSON.stringify(request.body ?? {});
        const expected = crypto.createHmac('sha256', secret).update(body).digest('hex');
        const provided = signature.replace(/^sha256=/, '');
        const ok = provided.length === expected.length &&
            crypto.timingSafeEqual(Buffer.from(provided), Buffer.from(expected));
        if (!ok) {
            throw new common_1.UnauthorizedException('Invalid webhook signature');
        }
        return true;
    }
};
exports.HmacWebhookGuard = HmacWebhookGuard;
exports.HmacWebhookGuard = HmacWebhookGuard = HmacWebhookGuard_1 = __decorate([
    (0, common_1.Injectable)()
], HmacWebhookGuard);
//# sourceMappingURL=hmac-webhook.guard.js.map