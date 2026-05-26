import { Injectable } from '@nestjs/common';
import { getSupabase } from '../config/supabase';

@Injectable()
export class ActivitiesService {
  private supabase = getSupabase();

  async getActivities(
    companyHubspotId: string,
    type?: string,
    limit: number = 50,
    fromDate?: string,
    toDate?: string,
    page: number = 1,
    pageSize: number = 50,
  ) {
    const usePagination = page > 1 || pageSize !== 50;

    let query = this.supabase
      .from('crm_activities')
      .select('*', { count: 'exact' })
      .eq('company_hubspot_id', companyHubspotId)
      .order('timestamp', { ascending: false });

    if (type) query = query.eq('type', type.toUpperCase());
    if (fromDate) query = query.gte('timestamp', fromDate);
    if (toDate) query = query.lte('timestamp', toDate);

    if (usePagination) {
      const from = (page - 1) * pageSize;
      query = query.range(from, from + pageSize - 1);
    } else {
      query = query.limit(limit);
    }

    const { data, count, error } = await query;
    if (error) throw new Error(error.message);

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
}
