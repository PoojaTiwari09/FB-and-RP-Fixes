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
var WebhookController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebhookController = void 0;
const common_1 = require("@nestjs/common");
const crypto_1 = require("crypto");
const supabase_1 = require("../config/supabase");
const m05_env_1 = require("../config/m05-env");
let WebhookController = WebhookController_1 = class WebhookController {
    logger = new common_1.Logger(WebhookController_1.name);
    supabase = (0, supabase_1.getSupabase)();
    async receiveWebhook(events, signatureV3) {
        const secret = (0, m05_env_1.getM05HubspotWebhookSecret)();
        if ((0, m05_env_1.isProductionLike)() && !secret) {
            throw new common_1.BadRequestException('M05_HUBSPOT_WEBHOOK_SECRET must be configured in production/staging');
        }
        if (secret) {
            if (!signatureV3) {
                throw new common_1.UnauthorizedException('Missing x-hubspot-signature-v3 header');
            }
            const expected = (0, crypto_1.createHmac)('sha256', secret)
                .update(JSON.stringify(events))
                .digest('base64');
            const expectedBuf = Buffer.from(expected);
            const receivedBuf = Buffer.from(signatureV3);
            if (expectedBuf.length !== receivedBuf.length ||
                !(0, crypto_1.timingSafeEqual)(expectedBuf, receivedBuf)) {
                this.logger.warn('[WEBHOOK] Invalid HMAC signature — rejecting');
                throw new common_1.UnauthorizedException('Invalid webhook signature');
            }
        }
        else {
            this.logger.warn('[WEBHOOK] M05_HUBSPOT_WEBHOOK_SECRET unset — skipping HMAC (dev only)');
        }
        if (!Array.isArray(events) || events.length === 0) {
            return { processed: 0 };
        }
        this.logger.log(`[WEBHOOK] Received ${events.length} event(s)`);
        let processed = 0;
        for (const event of events) {
            try {
                await this.handleEvent(event);
                processed++;
            }
            catch (err) {
                this.logger.error(`[WEBHOOK] Error handling event ${event.eventId}: ${err?.message}`);
            }
        }
        return { processed };
    }
    async handleEvent(event) {
        const objectId = String(event.objectId);
        const prop = event.propertyName;
        const val = event.propertyValue;
        if (event.subscriptionType.startsWith('company.')) {
            await this.upsertCompanyProperty(objectId, prop, val);
        }
        else if (event.subscriptionType.startsWith('contact.')) {
            await this.upsertContactProperty(objectId, prop, val);
        }
        else if (event.subscriptionType.startsWith('deal.')) {
            await this.upsertDealProperty(objectId, prop, val);
        }
    }
    COMPANY_PROP_MAP = {
        name: 'name',
        domain: 'domain',
        industry: 'industry',
        city: 'city',
        country: 'country',
        numberofemployees: 'employee_count',
        exit_arr: 'exit_arr',
        segment: 'segment',
        board_assignment: 'board',
        hubspot_owner_id: 'hubspot_owner_id',
    };
    CONTACT_PROP_MAP = {
        firstname: 'first_name',
        lastname: 'last_name',
        email: 'email',
        phone: 'phone',
        jobtitle: 'job_title',
    };
    DEAL_PROP_MAP = {
        dealname: 'name',
        amount: 'amount',
        adjusted_amount: 'adjusted_amount',
        closedate: 'close_date',
    };
    async upsertCompanyProperty(hubspotId, prop, val) {
        const col = this.COMPANY_PROP_MAP[prop];
        if (!col)
            return;
        let coercedVal = val;
        if (col === 'employee_count')
            coercedVal = val ? parseInt(val, 10) : null;
        if (col === 'exit_arr')
            coercedVal = val ? parseFloat(val) : null;
        const patch = { [col]: coercedVal };
        if (col === 'hubspot_owner_id' && val) {
            const { data: existing } = await this.supabase
                .from('crm_companies')
                .select('assigned_rep_id')
                .eq('hubspot_id', hubspotId)
                .maybeSingle();
            if (!existing?.assigned_rep_id) {
                patch.assigned_rep_id = val;
            }
        }
        const { error } = await this.supabase
            .from('crm_companies')
            .update(patch)
            .eq('hubspot_id', hubspotId);
        if (error) {
            this.logger.error(`[WEBHOOK] company update error: ${error.message}`);
        }
    }
    async upsertContactProperty(hubspotId, prop, val) {
        const col = this.CONTACT_PROP_MAP[prop];
        if (!col)
            return;
        const { error } = await this.supabase
            .from('crm_contacts')
            .update({ [col]: val })
            .eq('hubspot_id', hubspotId);
        if (error) {
            this.logger.error(`[WEBHOOK] contact update error: ${error.message}`);
        }
    }
    async upsertDealProperty(hubspotId, prop, val) {
        const col = this.DEAL_PROP_MAP[prop];
        if (!col)
            return;
        let coercedVal = val;
        if (col === 'amount' || col === 'adjusted_amount')
            coercedVal = val ? parseFloat(val) : null;
        if (col === 'close_date')
            coercedVal = val ? val.split('T')[0] : null;
        const { error } = await this.supabase
            .from('crm_deals')
            .update({ [col]: coercedVal })
            .eq('hubspot_id', hubspotId);
        if (error) {
            this.logger.error(`[WEBHOOK] deal update error: ${error.message}`);
        }
    }
};
exports.WebhookController = WebhookController;
__decorate([
    (0, common_1.Post)('hubspot'),
    (0, common_1.HttpCode)(200),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Headers)('x-hubspot-signature-v3')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Array, String]),
    __metadata("design:returntype", Promise)
], WebhookController.prototype, "receiveWebhook", null);
exports.WebhookController = WebhookController = WebhookController_1 = __decorate([
    (0, common_1.Controller)('api/v1/account-intelligence/webhooks')
], WebhookController);
//# sourceMappingURL=webhook.controller.js.map