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
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebhookSignatureGuard = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const crypto = __importStar(require("crypto"));
let WebhookSignatureGuard = class WebhookSignatureGuard {
    config;
    constructor(config) {
        this.config = config;
    }
    canActivate(context) {
        const req = context.switchToHttp().getRequest();
        const header = req.headers['x-webhook-signature'];
        if (!header) {
            throw new common_1.UnauthorizedException('Missing X-Webhook-Signature header.');
        }
        if (!header.startsWith('sha256=')) {
            throw new common_1.UnauthorizedException('X-Webhook-Signature must be in format sha256=<hex>.');
        }
        const secret = this.config.get('DEAL_DRIVERS_WEBHOOK_SECRET');
        if (!secret) {
            throw new common_1.UnauthorizedException('Webhook secret not configured on server.');
        }
        const rawBody = req.rawBody;
        if (!rawBody) {
            throw new common_1.UnauthorizedException('Raw request body unavailable. ' +
                'Ensure bodyParser is configured with verify callback in main.ts.');
        }
        const providedHex = header.slice('sha256='.length);
        const expectedHmac = crypto
            .createHmac('sha256', secret)
            .update(rawBody)
            .digest();
        let providedBuf;
        try {
            providedBuf = Buffer.from(providedHex, 'hex');
        }
        catch {
            throw new common_1.UnauthorizedException('Invalid signature hex encoding.');
        }
        if (expectedHmac.length !== providedBuf.length ||
            !crypto.timingSafeEqual(expectedHmac, providedBuf)) {
            throw new common_1.UnauthorizedException('Webhook signature mismatch.');
        }
        return true;
    }
};
exports.WebhookSignatureGuard = WebhookSignatureGuard;
exports.WebhookSignatureGuard = WebhookSignatureGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], WebhookSignatureGuard);
//# sourceMappingURL=webhook-signature.guard.js.map