"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ActivitiesService = void 0;
const common_1 = require("@nestjs/common");
const supabase_1 = require("../config/supabase");
let ActivitiesService = class ActivitiesService {
    supabase = (0, supabase_1.getSupabase)();
    async getActivities(companyHubspotId, type, limit = 50, fromDate, toDate, page = 1, pageSize = 50) {
        const usePagination = page > 1 || pageSize !== 50;
        let query = this.supabase
            .from('crm_activities')
            .select('*', { count: 'exact' })
            .eq('company_hubspot_id', companyHubspotId)
            .order('timestamp', { ascending: false });
        if (type)
            query = query.eq('type', type.toUpperCase());
        if (fromDate)
            query = query.gte('timestamp', fromDate);
        if (toDate)
            query = query.lte('timestamp', toDate);
        if (usePagination) {
            const from = (page - 1) * pageSize;
            query = query.range(from, from + pageSize - 1);
        }
        else {
            query = query.limit(limit);
        }
        const { data, count, error } = await query;
        if (error)
            throw new Error(error.message);
        return {
            total: count || 0,
            page,
            page_size: usePagination ? pageSize : limit,
            activities: (data || []).map(a => ({
                id: a.hubspot_id,
                local_id: a.local_id,
                type: a.type,
                direction: a.direction,
                timestamp: a.timestamp,
                body: a.body,
                duration_seconds: a.duration_seconds,
                rep_talk_pct: a.rep_talk_pct,
                client_talk_pct: a.client_talk_pct,
                call_outcome: a.call_outcome,
                subject: a.subject,
                snippet: a.snippet,
                title: a.title,
                attendee_contact_ids: a.attendee_contact_ids,
                assigned_rep_id: a.assigned_rep_id,
            })),
        };
    }
};
exports.ActivitiesService = ActivitiesService;
exports.ActivitiesService = ActivitiesService = __decorate([
    (0, common_1.Injectable)()
], ActivitiesService);
//# sourceMappingURL=activities.service.js.map