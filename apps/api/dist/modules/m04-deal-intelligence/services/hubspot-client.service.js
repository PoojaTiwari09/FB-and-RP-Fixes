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
var HubSpotClientService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.HubSpotClientService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const axios_1 = require("@nestjs/axios");
const rxjs_1 = require("rxjs");
let HubSpotClientService = HubSpotClientService_1 = class HubSpotClientService {
    httpService;
    configService;
    logger = new common_1.Logger(HubSpotClientService_1.name);
    accessToken;
    apiUrl;
    rateLimit;
    constructor(httpService, configService) {
        this.httpService = httpService;
        this.configService = configService;
        this.accessToken =
            this.configService.get('HUBSPOT_ACCESS_TOKEN') ||
                this.configService.get('HUBSPOT_API_KEY') ||
                '';
        this.apiUrl = this.configService.get('HUBSPOT_API_URL') || 'https://api.hubapi.com';
        this.rateLimit = {
            max: this.configService.get('HUBSPOT_RATE_LIMIT_MAX', 100),
            window: this.configService.get('HUBSPOT_RATE_LIMIT_WINDOW', 10000),
            requests: [],
        };
    }
    isConfigured() {
        return Boolean(this.accessToken);
    }
    async checkRateLimit() {
        const now = Date.now();
        this.rateLimit.requests = this.rateLimit.requests.filter((timestamp) => now - timestamp < this.rateLimit.window);
        if (this.rateLimit.requests.length >= this.rateLimit.max) {
            const oldestRequest = this.rateLimit.requests[0];
            const waitTime = this.rateLimit.window - (now - oldestRequest);
            this.logger.warn(`Rate limit reached. Waiting ${waitTime}ms`);
            await new Promise((resolve) => setTimeout(resolve, waitTime));
            return this.checkRateLimit();
        }
        this.rateLimit.requests.push(now);
    }
    async request(method, endpoint, data, params) {
        await this.checkRateLimit();
        try {
            const response = await (0, rxjs_1.firstValueFrom)(this.httpService.request({
                method,
                url: `${this.apiUrl}${endpoint}`,
                headers: {
                    Authorization: `Bearer ${this.accessToken}`,
                    'Content-Type': 'application/json',
                },
                data,
                params,
            }));
            return response.data;
        }
        catch (error) {
            this.handleError(error);
        }
    }
    handleError(error) {
        const status = error.response?.status || common_1.HttpStatus.INTERNAL_SERVER_ERROR;
        const message = error.response?.data?.message || error.message;
        this.logger.error(`HubSpot API Error: ${message}`, error.stack);
        throw new common_1.HttpException({
            statusCode: status,
            message: `HubSpot API Error: ${message}`,
            error: 'HubSpot Integration Error',
        }, status);
    }
    async getDeals(limit = 100, after, properties) {
        const defaultProperties = [
            'dealname',
            'dealstage',
            'amount',
            'closedate',
            'pipeline',
            'hs_forecast_category',
            'hs_forecast_probability',
            'hubspot_owner_id',
            'hs_lastmodifieddate',
            'createdate',
        ];
        return this.request('GET', '/crm/v3/objects/deals', null, {
            limit,
            after,
            properties: properties || defaultProperties,
        });
    }
    async getDealById(dealId, properties) {
        const defaultProperties = [
            'dealname',
            'dealstage',
            'amount',
            'closedate',
            'pipeline',
            'hs_forecast_category',
            'hs_forecast_probability',
            'hubspot_owner_id',
            'hs_lastmodifieddate',
            'createdate',
        ];
        return this.request('GET', `/crm/v3/objects/deals/${dealId}`, null, {
            properties: properties || defaultProperties,
        });
    }
    async createDeal(properties) {
        return this.request('POST', '/crm/v3/objects/deals', {
            properties,
        });
    }
    async updateDeal(dealId, properties, idProperty) {
        return this.request('PATCH', `/crm/v3/objects/deals/${dealId}`, {
            properties,
        }, idProperty ? { idProperty } : undefined);
    }
    async findDealsByExactName(dealName) {
        return this.searchDeals([
            {
                filters: [
                    {
                        propertyName: 'dealname',
                        operator: 'EQ',
                        value: dealName,
                    },
                ],
            },
        ]);
    }
    async getDealAssociations(dealId, toObjectType) {
        const response = await this.request('GET', `/crm/v3/objects/deals/${dealId}/associations/${toObjectType}`);
        return response.results;
    }
    async getContacts(limit = 100, after) {
        return this.request('GET', '/crm/v3/objects/contacts', null, {
            limit,
            after,
            properties: ['firstname', 'lastname', 'email', 'jobtitle', 'phone', 'company'],
        });
    }
    async getContactById(contactId) {
        return this.request('GET', `/crm/v3/objects/contacts/${contactId}`, null, {
            properties: ['firstname', 'lastname', 'email', 'jobtitle', 'phone', 'company'],
        });
    }
    async getContactsByDeal(dealId) {
        const associations = await this.getDealAssociations(dealId, 'contacts');
        const contacts = await Promise.all(associations.map((assoc) => this.getContactById(assoc.id)));
        return contacts;
    }
    async getCallsForDeal(dealId) {
        const response = await this.request('GET', `/crm/v3/objects/calls`, null, {
            limit: 100,
            properties: ['hs_timestamp', 'hs_call_title', 'hs_call_body', 'hs_call_duration'],
        });
        return response.results;
    }
    async getEmailsForDeal(dealId) {
        const response = await this.request('GET', `/crm/v3/objects/emails`, null, {
            limit: 100,
            properties: ['hs_timestamp', 'hs_email_subject', 'hs_email_text'],
        });
        return response.results;
    }
    async getOwners() {
        const response = await this.request('GET', '/crm/v3/owners');
        return response.results;
    }
    async getOwnerById(ownerId) {
        return this.request('GET', `/crm/v3/owners/${ownerId}`);
    }
    async searchDeals(filters) {
        const response = await this.request('POST', '/crm/v3/objects/deals/search', {
            filterGroups: filters,
            properties: [
                'dealname',
                'dealstage',
                'amount',
                'closedate',
                'pipeline',
                'hs_forecast_category',
                'hubspot_owner_id',
            ],
            limit: 100,
        });
        return response.results;
    }
    async batchGetDeals(dealIds) {
        const response = await this.request('POST', '/crm/v3/objects/deals/batch/read', {
            properties: [
                'dealname',
                'dealstage',
                'amount',
                'closedate',
                'pipeline',
                'hs_forecast_category',
                'hubspot_owner_id',
            ],
            inputs: dealIds.map((id) => ({ id })),
        });
        return response.results;
    }
};
exports.HubSpotClientService = HubSpotClientService;
exports.HubSpotClientService = HubSpotClientService = HubSpotClientService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [axios_1.HttpService,
        config_1.ConfigService])
], HubSpotClientService);
//# sourceMappingURL=hubspot-client.service.js.map