"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var HubSpotClientService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.HubSpotClientService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
let HubSpotClientService = HubSpotClientService_1 = class HubSpotClientService {
    configService;
    logger = new common_1.Logger(HubSpotClientService_1.name);
    defaultToken;
    apiUrl;
    rateLimit = { max: 100, window: 10_000, requests: [] };
    constructor(configService) {
        this.configService = configService;
        this.defaultToken =
            process.env.HUBSPOT_ACCESS_TOKEN ||
                process.env.HUBSPOT_API_KEY ||
                this.configService?.get('HUBSPOT_ACCESS_TOKEN') ||
                '';
        this.apiUrl =
            process.env.HUBSPOT_API_URL ||
                this.configService?.get('HUBSPOT_API_URL') ||
                'https://api.hubapi.com';
    }
    isConfigured() {
        return Boolean(this.defaultToken);
    }
    async throttle() {
        const now = Date.now();
        this.rateLimit.requests = this.rateLimit.requests.filter((t) => now - t < this.rateLimit.window);
        if (this.rateLimit.requests.length >= this.rateLimit.max) {
            const wait = this.rateLimit.window - (now - this.rateLimit.requests[0]);
            await new Promise((r) => setTimeout(r, wait));
            return this.throttle();
        }
        this.rateLimit.requests.push(now);
    }
    async request(method, path, options) {
        await this.throttle();
        const token = options?.accessToken || this.defaultToken;
        if (!token) {
            throw new common_1.HttpException('HubSpot not configured', common_1.HttpStatus.SERVICE_UNAVAILABLE);
        }
        const url = new URL(path.startsWith('http') ? path : `${this.apiUrl}${path}`);
        if (options?.params) {
            Object.entries(options.params).forEach(([k, v]) => url.searchParams.set(k, v));
        }
        const res = await fetch(url.toString(), {
            method,
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: options?.body != null ? JSON.stringify(options.body) : undefined,
        });
        if (!res.ok) {
            const text = await res.text();
            this.logger.error(`HubSpot ${method} ${path} failed: ${text}`);
            throw new common_1.HttpException(`HubSpot API error: ${text}`, res.status);
        }
        return res.json();
    }
    async getCrmDealsPage(accessToken, properties, limit = '50') {
        return this.request('GET', '/crm/v3/objects/deals', {
            accessToken,
            params: { limit, properties: properties.join(',') },
        });
    }
};
exports.HubSpotClientService = HubSpotClientService;
exports.HubSpotClientService = HubSpotClientService = HubSpotClientService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Optional)()),
    __metadata("design:paramtypes", [config_1.ConfigService])
], HubSpotClientService);
//# sourceMappingURL=hubspot-client.service.js.map