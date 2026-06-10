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
var SyncService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SyncService = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const hubspot = __importStar(require("@hubspot/api-client"));
const account_ownership_1 = require("../domain/account-ownership");
const supabase_1 = require("../config/supabase");
const STAGE_MAP = {
    appointmentscheduled: 'Prospecting',
    qualifiedtobuy: 'Qualification',
    presentationscheduled: 'Solution Presentation',
    decisionmakerboughtin: 'Proposal Sent',
    contractsent: 'Contract Negotiation',
    closedwon: 'Closed Won',
    closedlost: 'Closed Lost',
};
let SyncService = SyncService_1 = class SyncService {
    logger = new common_1.Logger(SyncService_1.name);
    supabase = (0, supabase_1.getSupabase)();
    hsClient;
    lastSync = null;
    isSyncing = false;
    lastScheduledAt = null;
    INTERVAL_MS = 300_000;
    constructor() {
        const token = process.env.HUBSPOT_ACCESS_TOKEN;
        if (!token) {
            this.logger.warn('HUBSPOT_ACCESS_TOKEN not set — sync will fail');
        }
        this.hsClient = new hubspot.Client({ accessToken: token || '' });
    }
    async scheduledSync() {
        this.logger.log('[SYNC] Scheduled sync starting...');
        this.lastScheduledAt = new Date();
        const result = await this.runFullSync();
        if (result.success) {
            this.logger.log(`[SYNC] Scheduled sync done: ${result.companies} companies, ${result.contacts} contacts, ${result.deals} deals (${result.duration_ms}ms)`);
        }
        else {
            this.logger.error(`[SYNC] Scheduled sync failed: ${result.error}`);
        }
    }
    async runFullSync() {
        if (this.isSyncing) {
            this.logger.warn('[SYNC] Sync already in progress — skipping');
            return {
                success: false,
                companies: 0,
                contacts: 0,
                deals: 0,
                duration_ms: 0,
                synced_at: new Date().toISOString(),
                error: 'Sync already in progress',
            };
        }
        this.isSyncing = true;
        const start = Date.now();
        try {
            const companiesCount = await this.syncCompanies();
            const contactsCount = await this.syncContacts();
            const dealsCount = await this.syncDeals();
            const result = {
                success: true,
                companies: companiesCount,
                contacts: contactsCount,
                deals: dealsCount,
                duration_ms: Date.now() - start,
                synced_at: new Date().toISOString(),
            };
            this.lastSync = result;
            return result;
        }
        catch (err) {
            const result = {
                success: false,
                companies: 0,
                contacts: 0,
                deals: 0,
                duration_ms: Date.now() - start,
                synced_at: new Date().toISOString(),
                error: err?.message || String(err),
            };
            this.lastSync = result;
            return result;
        }
        finally {
            this.isSyncing = false;
        }
    }
    getStatus() {
        let nextSyncInSeconds = null;
        if (this.lastScheduledAt) {
            const elapsed = Date.now() - this.lastScheduledAt.getTime();
            nextSyncInSeconds = Math.max(0, Math.round((this.INTERVAL_MS - elapsed) / 1000));
        }
        return {
            last_sync: this.lastSync,
            next_sync_in_seconds: nextSyncInSeconds,
            is_syncing: this.isSyncing,
        };
    }
    async syncCompanies() {
        const properties = [
            'name', 'domain', 'industry', 'type', 'city', 'country',
            'numberofemployees', 'exit_arr', 'segment', 'board_assignment',
            'local_id', 'hubspot_owner_id',
        ];
        let after = undefined;
        let total = 0;
        do {
            const response = await this.hsClient.crm.companies.basicApi.getPage(100, after, properties);
            const hubspotIds = response.results.map((c) => c.id);
            const { data: existingRows } = await this.supabase
                .from('crm_companies')
                .select('hubspot_id, assigned_rep_id')
                .in('hubspot_id', hubspotIds);
            const existingRepByHubspot = new Map((existingRows || []).map((r) => [r.hubspot_id, r.assigned_rep_id]));
            const rows = response.results.map((c) => ({
                hubspot_id: c.id,
                local_id: c.properties.local_id || null,
                name: c.properties.name || 'Unknown',
                domain: c.properties.domain || null,
                industry: c.properties.industry || null,
                type: c.properties.type || null,
                city: c.properties.city || null,
                country: c.properties.country || null,
                employee_count: c.properties.numberofemployees
                    ? parseInt(c.properties.numberofemployees, 10) : null,
                exit_arr: c.properties.exit_arr ? parseFloat(c.properties.exit_arr) : null,
                segment: c.properties.segment || null,
                board: c.properties.board_assignment || null,
                hubspot_owner_id: c.properties.hubspot_owner_id || null,
                assigned_rep_id: (0, account_ownership_1.assignedRepIdForHubSpotUpsert)(existingRepByHubspot.get(c.id), c.properties.hubspot_owner_id || null),
            }));
            if (rows.length > 0) {
                const { error } = await this.supabase
                    .from('crm_companies')
                    .upsert(rows, { onConflict: 'hubspot_id' });
                if (error) {
                    this.logger.error(`[SYNC] Companies upsert error: ${error.message}`);
                }
                else {
                    total += rows.length;
                }
            }
            after = response.paging?.next?.after;
            await this.sleep(200);
        } while (after);
        return total;
    }
    async syncContacts() {
        const properties = ['firstname', 'lastname', 'email', 'phone', 'jobtitle'];
        let after = undefined;
        let total = 0;
        do {
            const response = await this.hsClient.crm.contacts.basicApi.getPage(100, after, properties, undefined, ['companies']);
            const rows = response.results.map((c) => {
                const companyAssociation = c.associations?.companies?.results?.[0];
                return {
                    hubspot_id: c.id,
                    local_id: c.properties.local_id || null,
                    company_hubspot_id: companyAssociation?.id || null,
                    first_name: c.properties.firstname || null,
                    last_name: c.properties.lastname || null,
                    email: c.properties.email || null,
                    phone: c.properties.phone || null,
                    job_title: c.properties.jobtitle || null,
                };
            });
            if (rows.length > 0) {
                const { error } = await this.supabase
                    .from('crm_contacts')
                    .upsert(rows, { onConflict: 'hubspot_id' });
                if (error) {
                    this.logger.error(`[SYNC] Contacts upsert error: ${error.message}`);
                }
                else {
                    total += rows.length;
                }
            }
            after = response.paging?.next?.after;
            await this.sleep(200);
        } while (after);
        return total;
    }
    async syncDeals() {
        const properties = [
            'dealname', 'dealstage', 'amount', 'adjusted_amount',
            'closedate', 'createdate', 'local_id',
        ];
        let after = undefined;
        let total = 0;
        do {
            const response = await this.hsClient.crm.deals.basicApi.getPage(100, after, properties, undefined, ['companies', 'contacts']);
            const rows = response.results.map((d) => {
                const companyAssociation = d.associations?.companies?.results?.[0];
                const contactAssociation = d.associations?.contacts?.results?.[0];
                return {
                    hubspot_id: d.id,
                    local_id: d.properties.local_id || null,
                    company_hubspot_id: companyAssociation?.id || null,
                    name: d.properties.dealname || null,
                    stage: d.properties.dealstage
                        ? (STAGE_MAP[d.properties.dealstage] || d.properties.dealstage)
                        : null,
                    amount: d.properties.amount ? parseFloat(d.properties.amount) : null,
                    adjusted_amount: d.properties.adjusted_amount
                        ? parseFloat(d.properties.adjusted_amount) : null,
                    deal_type: null,
                    close_date: d.properties.closedate
                        ? d.properties.closedate.split('T')[0] : null,
                    created_at_crm: d.properties.createdate || null,
                    primary_contact_hubspot_id: contactAssociation?.id || null,
                };
            });
            if (rows.length > 0) {
                const { error } = await this.supabase
                    .from('crm_deals')
                    .upsert(rows, { onConflict: 'hubspot_id' });
                if (error) {
                    this.logger.error(`[SYNC] Deals upsert error: ${error.message}`);
                }
                else {
                    total += rows.length;
                }
            }
            after = response.paging?.next?.after;
            await this.sleep(200);
        } while (after);
        return total;
    }
    sleep(ms) {
        return new Promise((r) => setTimeout(r, ms));
    }
};
exports.SyncService = SyncService;
__decorate([
    (0, schedule_1.Interval)(300_000),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], SyncService.prototype, "scheduledSync", null);
exports.SyncService = SyncService = SyncService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], SyncService);
//# sourceMappingURL=sync.service.js.map