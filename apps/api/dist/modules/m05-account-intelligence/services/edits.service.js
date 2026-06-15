"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EditsService = void 0;
const common_1 = require("@nestjs/common");
const supabase_1 = require("../config/supabase");
const hubspot_1 = require("../config/hubspot");
const VALID_DEAL_STAGES = [
    'Prospecting', 'Qualification', 'Solution Presentation',
    'Proposal Sent', 'Contract Negotiation', 'Contract Signed', 'Closed Won', 'Closed Lost',
];
const DEAL_STAGE_MAP = {
    'Prospecting': 'appointmentscheduled',
    'Qualification': 'qualifiedtobuy',
    'Solution Presentation': 'presentationscheduled',
    'Proposal Sent': 'decisionmakerboughtin',
    'Contract Negotiation': 'contractsent',
    'Closed Won': 'closedwon',
    'Closed Lost': 'closedlost',
};
let EditsService = class EditsService {
    supabase = (0, supabase_1.getSupabase)();
    async editCompany(hubspotId, field, value, role) {
        if (field === 'type' && !['Customer', 'New Business'].includes(value)) {
            throw new common_1.BadRequestException({
                field: 'type',
                message: "type must be 'Customer' or 'New Business'",
                allowed_values: ['Customer', 'New Business'],
            });
        }
        const { data: current } = await this.supabase
            .from('crm_companies')
            .select(field)
            .eq('hubspot_id', hubspotId)
            .single();
        const oldValue = current?.[field] || null;
        let hubspotUpdated = false;
        try {
            const hsClient = (0, hubspot_1.getHubspot)();
            const hsField = field === 'type' ? 'type' : field;
            await hsClient.crm.companies.basicApi.update(hubspotId, {
                properties: { [hsField]: value },
            });
            hubspotUpdated = true;
        }
        catch (err) {
            console.error(`HubSpot write-back failed for company ${hubspotId}:`, err.message);
        }
        const { error } = await this.supabase
            .from('crm_companies')
            .update({ [field]: value, updated_at: new Date().toISOString() })
            .eq('hubspot_id', hubspotId);
        if (error) {
            throw new common_1.BadRequestException(error.message);
        }
        console.log(`[AUDIT] Company ${hubspotId}: ${field} "${oldValue}" → "${value}" by ${role} at ${new Date().toISOString()}`);
        return { success: true, hubspot_updated: hubspotUpdated, postgres_updated: true };
    }
    async editDeal(dealHubspotId, field, value, role) {
        if (field === 'stage' && !VALID_DEAL_STAGES.includes(value)) {
            throw new common_1.BadRequestException({
                field: 'stage',
                message: 'Invalid stage',
                allowed_values: VALID_DEAL_STAGES,
            });
        }
        if (field === 'close_date') {
            const date = new Date(value);
            if (isNaN(date.getTime())) {
                throw new common_1.BadRequestException({
                    field: 'close_date',
                    message: 'close_date must be a valid ISO date string (e.g. 2025-12-31)',
                });
            }
        }
        const { data: current } = await this.supabase
            .from('crm_deals')
            .select(field)
            .eq('hubspot_id', dealHubspotId)
            .single();
        const oldValue = current?.[field] || null;
        let hubspotUpdated = false;
        try {
            const hsClient = (0, hubspot_1.getHubspot)();
            let hsField = field;
            let hsValue = value;
            if (field === 'stage') {
                hsField = 'dealstage';
                hsValue = DEAL_STAGE_MAP[value] || value;
            }
            else if (field === 'close_date') {
                hsField = 'closedate';
                hsValue = new Date(value).toISOString();
            }
            await hsClient.crm.deals.basicApi.update(dealHubspotId, {
                properties: { [hsField]: hsValue },
            });
            hubspotUpdated = true;
        }
        catch (err) {
            console.error(`HubSpot write-back failed for deal ${dealHubspotId}:`, err.message);
        }
        const { error } = await this.supabase
            .from('crm_deals')
            .update({ [field]: value, updated_at: new Date().toISOString() })
            .eq('hubspot_id', dealHubspotId);
        if (error) {
            throw new common_1.BadRequestException(error.message);
        }
        console.log(`[AUDIT] Deal ${dealHubspotId}: ${field} "${oldValue}" → "${value}" by ${role} at ${new Date().toISOString()}`);
        return { success: true, hubspot_updated: hubspotUpdated, postgres_updated: true };
    }
    async editSupplementary(companyHubspotId, field, value, role) {
        if (field === 'manager_note' && value && value.length > 500) {
            throw new common_1.BadRequestException({
                field: 'manager_note',
                message: 'manager_note must be 500 characters or fewer',
                max_length: 500,
            });
        }
        if (field === 'next_qbr_date' && value) {
            const date = new Date(value);
            if (isNaN(date.getTime())) {
                throw new common_1.BadRequestException({
                    field: 'next_qbr_date',
                    message: 'next_qbr_date must be a valid date',
                });
            }
        }
        const { data: current } = await this.supabase
            .from('supplementary_accounts')
            .select(field)
            .eq('company_hubspot_id', companyHubspotId)
            .single();
        const oldValue = current?.[field] || null;
        const { error } = await this.supabase
            .from('supplementary_accounts')
            .update({ [field]: value || null, updated_at: new Date().toISOString() })
            .eq('company_hubspot_id', companyHubspotId);
        if (error) {
            throw new common_1.BadRequestException(error.message);
        }
        console.log(`[AUDIT] Supplementary ${companyHubspotId}: ${field} "${oldValue}" → "${value}" by ${role} at ${new Date().toISOString()}`);
        return { success: true, hubspot_updated: false, postgres_updated: true };
    }
};
exports.EditsService = EditsService;
exports.EditsService = EditsService = __decorate([
    (0, common_1.Injectable)()
], EditsService);
//# sourceMappingURL=edits.service.js.map