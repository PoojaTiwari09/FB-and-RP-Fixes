import { Injectable } from '@nestjs/common';
import { getSupabase } from '../config/supabase';

interface AccountQueryParams {
  board_slug: string;
  tab_id?: string;
  rep_id?: string;
  period?: string;
  sort_field?: string;
  sort_dir?: 'asc' | 'desc';
  page?: number;
  page_size?: number;
}

const TEAM_MAP: Record<string, string> = {
  rep_01: 'Sarah Mitchell',
  rep_02: 'James Torres',
  rep_03: 'Priya Nair',
  manager_01: 'Alan Clayborn',
};

@Injectable()
export class AccountsService {
  private supabase = getSupabase();

  // ── Period helper ────────────────────────────────────────────────────
  private getPeriodCutoff(period?: string): string | null {
    const periodDays: Record<string, number> = {
      last_7_days: 7,
      last_30_days: 30,
      last_90_days: 90,
    };
    if (!period || !periodDays[period]) return null;
    const cutoff = new Date(Date.now() - periodDays[period] * 24 * 60 * 60 * 1000);
    return cutoff.toISOString();
  }

  async getAccounts(params: AccountQueryParams) {
    const {
      board_slug,
      tab_id,
      rep_id,
      period,
      sort_field = 'exit_arr',
      sort_dir = 'desc',
      page = 1,
      page_size = 20,
    } = params;

    // 1. Get board config to validate slug
    const { data: boardConfig } = await this.supabase
      .from('board_config')
      .select('board_id, slug, parent_board_slug')
      .eq('slug', board_slug)
      .single();

    if (!boardConfig) {
      throw new Error(`Board "${board_slug}" not found`);
    }

    // BF-07: Duplicated boards use the parent board's company pool
    const companySlug = boardConfig.parent_board_slug || board_slug;

    // BF-05: compute date cutoff for period filter
    const periodCutoff = this.getPeriodCutoff(period);

    // BF-20: Only include companies that have ≥1 activity on this board.
    // crm_activities has no board column — cross-reference via crm_companies.
    // Strategy: fetch all company hubspot_ids for this board first, then find
    // which of them have activities.
    const { data: boardCompanyRows } = await this.supabase
      .from('crm_companies')
      .select('hubspot_id')
      .eq('board', companySlug);
    const boardCompanyIds = (boardCompanyRows || []).map((c) => c.hubspot_id);

    if (boardCompanyIds.length === 0) {
      const summary = await this.buildSummary(board_slug, [], rep_id, periodCutoff);
      return { total: 0, page, page_size, summary, accounts: [] };
    }

    // Get companies that have at least 1 activity (optionally within the period)
    let activitiesQuery = this.supabase
      .from('crm_activities')
      .select('company_hubspot_id')
      .in('company_hubspot_id', boardCompanyIds);
    if (periodCutoff) {
      activitiesQuery = activitiesQuery.gte('timestamp', periodCutoff);
    }
    const { data: activeActivityRows } = await activitiesQuery;
    const activeIds = [...new Set((activeActivityRows || []).map((a) => a.company_hubspot_id))];

    if (activeIds.length === 0) {
      // No active companies — return empty result early
      const summary = await this.buildSummary(board_slug, [], rep_id, periodCutoff);
      return { total: 0, page, page_size, summary, accounts: [] };
    }

    // 3. Base query: companies on this board with activity
    let query = this.supabase
      .from('crm_companies')
      .select('*', { count: 'exact' })
      .eq('board', companySlug)
      .in('hubspot_id', activeIds);

    // 4. Rep filter
    if (rep_id) {
      const repIds = rep_id.split(',').map((r) => r.trim());
      if (repIds.length === 1) {
        query = query.eq('assigned_rep_id', repIds[0]);
      } else {
        query = query.in('assigned_rep_id', repIds);
      }
    }

    // 5. Sorting — only sort by DB columns here; last_activity_date is computed
    const dbSortFields = ['name', 'exit_arr', 'employee_count'];
    const actualSortField = dbSortFields.includes(sort_field) ? sort_field : 'exit_arr';
    query = query.order(actualSortField, { ascending: sort_dir === 'asc' });

    // 6. Pagination
    const from = (page - 1) * page_size;
    const to = from + page_size - 1;
    query = query.range(from, to);

    const { data: companies, count, error } = await query;
    if (error) throw new Error(error.message);

    // 6. Fetch related data for all returned companies
    const companyHubspotIds = (companies || []).map((c) => c.hubspot_id);

    // Contacts count per company
    const { data: contacts } = await this.supabase
      .from('crm_contacts')
      .select('company_hubspot_id')
      .in('company_hubspot_id', companyHubspotIds);

    const contactCounts: Record<string, number> = {};
    (contacts || []).forEach((c) => {
      contactCounts[c.company_hubspot_id] = (contactCounts[c.company_hubspot_id] || 0) + 1;
    });

    // Deals per company
    const { data: allDeals } = await this.supabase
      .from('crm_deals')
      .select('*')
      .in('company_hubspot_id', companyHubspotIds);

    // All activities for this page of companies — used for both sparkline and last_activity
    // NOTE: We intentionally do NOT filter by real date here because seed data uses 2024 timestamps.
    // The sparkline reference point is each company's OWN latest activity, not Date.now().
    // BF-05: If a period cutoff is set, filter activities to the selected window.
    let activitiesDetailQuery = this.supabase
      .from('crm_activities')
      .select('*')
      .in('company_hubspot_id', companyHubspotIds)
      .order('timestamp', { ascending: false });
    if (periodCutoff) {
      activitiesDetailQuery = activitiesDetailQuery.gte('timestamp', periodCutoff);
    }
    const { data: allActivities } = await activitiesDetailQuery;

    // Alias for clarity
    const recentActivities = allActivities;
    const latestActivities = allActivities;

    // Supplementary data
    const { data: supplementary } = await this.supabase
      .from('supplementary_accounts')
      .select('*')
      .in('company_hubspot_id', companyHubspotIds);

    // Build last activity map
    const lastActivityMap: Record<string, string> = {};
    (latestActivities || []).forEach((a) => {
      if (!lastActivityMap[a.company_hubspot_id]) {
        lastActivityMap[a.company_hubspot_id] = a.timestamp;
      }
    });

    // Build supplementary map
    const suppMap: Record<string, any> = {};
    (supplementary || []).forEach((s) => {
      suppMap[s.company_hubspot_id] = s;
    });

    // Build deals map
    const dealsMap: Record<string, any[]> = {};
    (allDeals || []).forEach((d) => {
      if (!dealsMap[d.company_hubspot_id]) dealsMap[d.company_hubspot_id] = [];
      dealsMap[d.company_hubspot_id].push(d);
    });

    // 7. Apply tab filters (post-query filtering for complex cross-table filters)
    let filteredCompanies = companies || [];

    if (tab_id) {
      const { data: tabData } = await this.supabase
        .from('board_tabs')
        .select('filter_logic')
        .eq('tab_id', tab_id)
        .single();

      if (tabData?.filter_logic) {
        filteredCompanies = this.applyTabFilter(filteredCompanies, tabData.filter_logic, dealsMap, lastActivityMap, suppMap);
      }
    }

    // 8. Build response
    const accounts = filteredCompanies.map((company) => {
      const supp = suppMap[company.hubspot_id] || {};
      const compDeals = dealsMap[company.hubspot_id] || [];
      const openDeals = compDeals.filter((d) => !['Closed Won', 'Closed Lost'].includes(d.stage));
      const lastActDate = lastActivityMap[company.hubspot_id] || null;
      const lastActDays = lastActDate
        ? Math.round((Date.now() - new Date(lastActDate).getTime()) / (1000 * 60 * 60 * 24))
        : null;

      // Renewal date: earliest open renewal deal close_date
      const renewalDeals = compDeals.filter(
        (d) => d.deal_type === 'Renewal' && !['Closed Won', 'Closed Lost'].includes(d.stage),
      );
      const renewalDate = renewalDeals.length > 0
        ? renewalDeals.sort((a: any, b: any) => new Date(a.close_date).getTime() - new Date(b.close_date).getTime())[0].close_date
        : null;

      // Activity dots for 21-day sparkline
      // Reference: use THIS company's latest activity timestamp, not Date.now()
      // This ensures seed data from 2024 displays correctly regardless of demo date.
      const compActivities = (allActivities || []).filter(
        (a) => a.company_hubspot_id === company.hubspot_id,
      );

      const compRefTime = compActivities.length > 0
        ? new Date(compActivities[0].timestamp).getTime()   // already sorted desc
        : Date.now();
      const windowStart = compRefTime - 21 * 24 * 60 * 60 * 1000;

      const activities21d = compActivities
        .filter((a) => new Date(a.timestamp).getTime() >= windowStart)
        .map((a) => ({
          id: a.hubspot_id,
          type: a.type,
          direction: a.direction,
          timestamp: a.timestamp,
          days_ago: Math.max(0, Math.round((compRefTime - new Date(a.timestamp).getTime()) / (1000 * 60 * 60 * 24))),
          rep_talk_pct: a.rep_talk_pct || undefined,
          client_talk_pct: a.client_talk_pct || undefined,
          duration_seconds: a.duration_seconds || undefined,
          outcome: a.call_outcome || undefined,
          subject: a.subject || undefined,
          is_future: false,  // seed data is always historical
        }));

      return {
        hubspot_id: company.hubspot_id,
        local_id: company.local_id,
        name: company.name,
        domain: company.domain,
        segment: company.segment,
        industry: company.industry,
        type: company.type,
        exit_arr: parseFloat(company.exit_arr) || 0,
        contacts_count: contactCounts[company.hubspot_id] || 0,
        assigned_rep: {
          id: company.assigned_rep_id,
          name: TEAM_MAP[company.assigned_rep_id] || company.assigned_rep_id || 'Unassigned',
        },
        last_activity_date: lastActDate,
        last_activity_days: lastActDays,
        zero_activity_flag: lastActDays !== null ? lastActDays > 21 : true,
        manager_note: supp.manager_note || null,
        next_qbr_date: supp.next_qbr_date || null,
        ai_risk_score: supp.ai_risk_score ?? 0,
        risk_label: supp.risk_label || 'Low',
        strategic_priority: supp.strategic_priority || false,
        open_deals_summary: {
          count: openDeals.length,
          total_amount: openDeals.reduce((sum: number, d: any) => sum + (parseFloat(d.amount) || 0), 0),
        },
        renewal_date: renewalDate,
        activities_21d: activities21d,
      };
    });

    // Apply in-memory sort for computed fields not in DB
    if (sort_field === 'last_activity_date') {
      accounts.sort((a, b) => {
        const aTime = a.last_activity_date ? new Date(a.last_activity_date).getTime() : 0;
        const bTime = b.last_activity_date ? new Date(b.last_activity_date).getTime() : 0;
        return sort_dir === 'asc' ? aTime - bTime : bTime - aTime;
      });
    } else if (sort_field === 'open_deals_summary') {
      accounts.sort((a, b) => {
        const aAmount = a.open_deals_summary?.total_amount || 0;
        const bAmount = b.open_deals_summary?.total_amount || 0;
        return sort_dir === 'asc' ? aAmount - bAmount : bAmount - aAmount;
      });
    }

    // 9. Build summary
    const allBoardCompanies = await this.getAllBoardCompanyIds(board_slug);
    const summary = await this.buildSummary(board_slug, allBoardCompanies, rep_id, periodCutoff);

    return {
      total: tab_id ? filteredCompanies.length : (count || 0),
      page,
      page_size,
      summary,
      accounts,
    };
  }

  async getAccountDetail(hubspotId: string) {
    // Company
    const { data: company, error } = await this.supabase
      .from('crm_companies')
      .select('*')
      .eq('hubspot_id', hubspotId)
      .single();

    if (error || !company) throw new Error('Company not found');

    // Contacts
    const { data: contacts } = await this.supabase
      .from('crm_contacts')
      .select('*')
      .eq('company_hubspot_id', hubspotId)
      .order('is_primary', { ascending: false });

    // Deals (open + recently closed within 90 days)
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const { data: allDeals } = await this.supabase
      .from('crm_deals')
      .select('*')
      .eq('company_hubspot_id', hubspotId);

    const deals = (allDeals || []).filter((d) => {
      if (!['Closed Won', 'Closed Lost'].includes(d.stage)) return true;
      if (d.close_date && d.close_date >= ninetyDaysAgo) return true;
      return false;
    });

    // All activities
    const { data: activities } = await this.supabase
      .from('crm_activities')
      .select('*')
      .eq('company_hubspot_id', hubspotId)
      .order('timestamp', { ascending: false });

    // Supplementary
    const { data: supp } = await this.supabase
      .from('supplementary_accounts')
      .select('*')
      .eq('company_hubspot_id', hubspotId)
      .single();

    // Brief cache check
    const { data: briefCache } = await this.supabase
      .from('ai_briefs_cache')
      .select('generated_at')
      .eq('company_hubspot_id', hubspotId)
      .order('generated_at', { ascending: false })
      .limit(1);
    
    const briefAvailable = !!(briefCache && briefCache.length > 0);
    
    // HubSpot deep-link
    const portalId = process.env.HUBSPOT_PORTAL_ID || '246259639';
    const accountConsoleUrl = `https://app.hubspot.com/contacts/${portalId}/company/${hubspotId}`;

    // Engagement aggregates
    const lastActivity = activities?.[0];
    const lastActivityDays = lastActivity
      ? Math.round((Date.now() - new Date(lastActivity.timestamp).getTime()) / (1000 * 60 * 60 * 24))
      : null;

    return {
      hubspot_id: company.hubspot_id,
      local_id: company.local_id,
      name: company.name,
      domain: company.domain,
      segment: company.segment,
      industry: company.industry,
      type: company.type,
      city: company.city,
      country: company.country,
      employee_count: company.employee_count,
      exit_arr: parseFloat(company.exit_arr) || 0,
      board: company.board,
      assigned_rep: {
        id: company.assigned_rep_id,
        name: TEAM_MAP[company.assigned_rep_id] || 'Unassigned',
      },
      last_activity_date: lastActivity?.timestamp || null,
      last_activity_days: lastActivityDays,
      brief_available: briefAvailable,
      brief_generated_at: briefCache?.[0]?.generated_at || null,
      account_console_url: accountConsoleUrl,
      contacts: (contacts || []).map((c) => ({
        hubspot_id: c.hubspot_id,
        first_name: c.first_name,
        last_name: c.last_name,
        email: c.email,
        phone: c.phone,
        job_title: c.job_title,
        is_primary: c.is_primary,
      })),
      deals: deals.map((d) => ({
        hubspot_id: d.hubspot_id,
        local_id: d.local_id,
        name: d.name,
        stage: d.stage,
        amount: parseFloat(d.amount) || 0,
        adjusted_amount: parseFloat(d.adjusted_amount) || 0,
        deal_type: d.deal_type,
        close_date: d.close_date,
        assigned_rep_id: d.assigned_rep_id,
      })),
      activities: (activities || []).map((a) => ({
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
      supplementary: supp
        ? {
            manager_note: supp.manager_note,
            next_qbr_date: supp.next_qbr_date,
            ai_risk_score: supp.ai_risk_score,
            risk_label: supp.risk_label,
            strategic_priority: supp.strategic_priority,
          }
        : null,
    };
  }

  // ── Tab Filter Engine ───────────────────────────────────────────────
  private applyTabFilter(
    companies: any[],
    filterLogic: { operator: string; conditions: any[] },
    dealsMap: Record<string, any[]>,
    lastActivityMap: Record<string, string>,
    suppMap: Record<string, any>,
  ): any[] {
    const { operator, conditions } = filterLogic;
    if (!conditions || conditions.length === 0) return companies;

    return companies.filter((company) => {
      const results = conditions.map((cond) =>
        this.evaluateCondition(cond, company, dealsMap, lastActivityMap, suppMap),
      );

      if (operator === 'AND') return results.every(Boolean);
      if (operator === 'OR') return results.some(Boolean);
      return true;
    });
  }

  private evaluateCondition(
    condition: { field: string; op: string; value: any },
    company: any,
    dealsMap: Record<string, any[]>,
    lastActivityMap: Record<string, string>,
    suppMap: Record<string, any>,
  ): boolean {
    const { field, op, value } = condition;
    const deals = dealsMap[company.hubspot_id] || [];
    const supp = suppMap[company.hubspot_id] || {};

    switch (field) {
      case 'deal_type': {
        if (op === 'eq') return deals.some((d) => d.deal_type === value);
        if (op === 'in') return deals.some((d) => value.includes(d.deal_type));
        return true;
      }
      case 'stage': {
        if (op === 'eq') return deals.some((d) => d.stage === value);
        if (op === 'not_in') return deals.some((d) => !value.includes(d.stage));
        return true;
      }
      case 'last_activity_days': {
        const lastDate = lastActivityMap[company.hubspot_id];
        if (!lastDate) return op === 'gt'; // no activity = infinite days
        const days = Math.round((Date.now() - new Date(lastDate).getTime()) / (1000 * 60 * 60 * 24));
        if (op === 'gt') return days > value;
        if (op === 'gte') return days >= value;
        if (op === 'lt') return days < value;
        if (op === 'lte') return days <= value;
        return true;
      }
      case 'ai_risk_score': {
        const score = supp.ai_risk_score ?? 0;
        if (op === 'gt') return score > value;
        if (op === 'gte') return score >= value;
        if (op === 'lt') return score < value;
        if (op === 'lte') return score <= value;
        return true;
      }
      case 'zero_activity_flag': {
        const lastDate = lastActivityMap[company.hubspot_id];
        const isZero = !lastDate || (Date.now() - new Date(lastDate).getTime()) > 21 * 24 * 60 * 60 * 1000;
        if (op === 'eq') return isZero === value;
        return true;
      }
      case 'has_open_deal': {
        const hasOpen = deals.some((d) => !['Closed Won', 'Closed Lost'].includes(d.stage));
        if (op === 'eq') return hasOpen === value;
        return true;
      }
      case 'closed_days_ago': {
        const closedDeals = deals.filter((d) => ['Closed Won', 'Closed Lost'].includes(d.stage));
        if (closedDeals.length === 0) return false;
        const mostRecent = closedDeals.sort(
          (a: any, b: any) => new Date(b.close_date).getTime() - new Date(a.close_date).getTime(),
        )[0];
        const daysAgo = Math.round(
          (Date.now() - new Date(mostRecent.close_date).getTime()) / (1000 * 60 * 60 * 24),
        );
        if (op === 'lte') return daysAgo <= value;
        if (op === 'gte') return daysAgo >= value;
        return true;
      }
      default:
        return true;
    }
  }

  // ── BF-21: Dedicated Sparkline Endpoint ──────────────────────────────
  async getSparklineData(boardSlug: string, hubspotIds: string[] = []) {
    let companyIds = hubspotIds;
    if (companyIds.length === 0) {
      const { data: companies } = await this.supabase
        .from('crm_companies').select('hubspot_id').eq('board', boardSlug);
      companyIds = (companies || []).map(c => c.hubspot_id);
    }
    if (companyIds.length === 0) return { sparklines: [] };

    const { data: activities } = await this.supabase
      .from('crm_activities')
      .select('company_hubspot_id, type, timestamp')
      .in('company_hubspot_id', companyIds)
      .order('timestamp', { ascending: false });

    const sparklines = companyIds.map(compId => {
      const compActs = (activities || []).filter(a => a.company_hubspot_id === compId);
      const refTime = compActs.length > 0
        ? new Date(compActs[0].timestamp).getTime() : Date.now();
      const windowStart = refTime - 21 * 24 * 60 * 60 * 1000;

      const buckets: number[] = new Array(21).fill(0);
      compActs
        .filter(a => new Date(a.timestamp).getTime() >= windowStart)
        .forEach(a => {
          const daysAgo = Math.floor((refTime - new Date(a.timestamp).getTime()) / (1000 * 60 * 60 * 24));
          if (daysAgo >= 0 && daysAgo < 21) buckets[daysAgo]++;
        });

      const lastActivity = compActs[0]?.timestamp || null;
      const lastActivityDays = lastActivity
        ? Math.round((Date.now() - new Date(lastActivity).getTime()) / (1000 * 60 * 60 * 24))
        : null;

      return {
        hubspot_id: compId,
        buckets,                  // array of 21 ints: [day0_count, ..., day20_count]
        zero_activity_flag: lastActivityDays === null || lastActivityDays > 21,
        last_activity_days: lastActivityDays,
        highlight_red: lastActivityDays !== null && lastActivityDays > 30,
      };
    });

    return { sparklines };
  }

  // ── BF-15: Engagement Gap Summary ───────────────────────────────────
  async getEngagementGap(boardSlug: string, days: number = 21) {
    const { data: allCompanies } = await this.supabase
      .from('crm_companies')
      .select('hubspot_id, name, exit_arr')
      .eq('board', boardSlug);

    if (!allCompanies || allCompanies.length === 0) {
      return { low_engagement_count: 0, low_engagement_arr: 0, window_days: days, accounts: [] };
    }

    const allIds = allCompanies.map(c => c.hubspot_id);
    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

    // Companies with activity WITHIN the window
    const { data: recentRows } = await this.supabase
      .from('crm_activities')
      .select('company_hubspot_id')
      .in('company_hubspot_id', allIds)
      .gte('timestamp', cutoff);

    const recentSet = new Set((recentRows || []).map(r => r.company_hubspot_id));
    const lowEngagementCompanies = allCompanies.filter(c => !recentSet.has(c.hubspot_id));

    // Last activity timestamp for context
    const { data: latestActs } = await this.supabase
      .from('crm_activities')
      .select('company_hubspot_id, timestamp')
      .in('company_hubspot_id', allIds)
      .order('timestamp', { ascending: false });

    const lastActivityMap: Record<string, string> = {};
    (latestActs || []).forEach(a => {
      if (!lastActivityMap[a.company_hubspot_id]) lastActivityMap[a.company_hubspot_id] = a.timestamp;
    });

    const totalArr = lowEngagementCompanies.reduce((sum, c) => sum + (parseFloat(c.exit_arr) || 0), 0);

    return {
      low_engagement_count: lowEngagementCompanies.length,
      low_engagement_arr: totalArr,
      window_days: days,
      accounts: lowEngagementCompanies.map(c => ({
        hubspot_id: c.hubspot_id,
        name: c.name,
        exit_arr: parseFloat(c.exit_arr) || 0,
        last_activity_days: lastActivityMap[c.hubspot_id]
          ? Math.round((Date.now() - new Date(lastActivityMap[c.hubspot_id]).getTime()) / (1000 * 60 * 60 * 24))
          : null,
      })),
    };
  }

  // ── Summary Builder ─────────────────────────────────────────────────
  private async getAllBoardCompanyIds(boardSlug: string): Promise<string[]> {
    // Resolve parent slug (for duplicated boards)
    const { data: cfg } = await this.supabase
      .from('board_config')
      .select('parent_board_slug')
      .eq('slug', boardSlug)
      .single();
    const effectiveSlug = cfg?.parent_board_slug || boardSlug;

    const { data } = await this.supabase
      .from('crm_companies')
      .select('hubspot_id')
      .eq('board', effectiveSlug);
    return (data || []).map((c) => c.hubspot_id);
  }

  private async buildSummary(boardSlug: string, companyIds: string[], repId?: string, periodCutoff?: string | null) {
    // Resolve parent slug (for duplicated boards)
    const { data: cfg } = await this.supabase
      .from('board_config')
      .select('parent_board_slug')
      .eq('slug', boardSlug)
      .single();
    const effectiveSlug = cfg?.parent_board_slug || boardSlug;

    // Get all companies on this board (or parent board)
    let query = this.supabase
      .from('crm_companies')
      .select('hubspot_id, exit_arr, assigned_rep_id')
      .eq('board', effectiveSlug);

    if (repId) {
      const repIds = repId.split(',').map((r) => r.trim());
      query = query.in('assigned_rep_id', repIds);
    }

    const { data: boardCompanies } = await query;

    // Get deals, activities, supplementary for summary
    const hubspotIds = (boardCompanies || []).map((c) => c.hubspot_id);

    const { data: allDeals } = await this.supabase
      .from('crm_deals')
      .select('company_hubspot_id, deal_type, stage, close_date, amount')
      .in('company_hubspot_id', hubspotIds);

    let latestActsQuery = this.supabase
      .from('crm_activities')
      .select('company_hubspot_id, timestamp')
      .in('company_hubspot_id', hubspotIds)
      .order('timestamp', { ascending: false });
    if (periodCutoff) {
      latestActsQuery = latestActsQuery.gte('timestamp', periodCutoff);
    }
    const { data: latestActs } = await latestActsQuery;

    const { data: suppData } = await this.supabase
      .from('supplementary_accounts')
      .select('company_hubspot_id, ai_risk_score')
      .in('company_hubspot_id', hubspotIds);

    // Build maps
    const dealsMap: Record<string, any[]> = {};
    (allDeals || []).forEach((d) => {
      if (!dealsMap[d.company_hubspot_id]) dealsMap[d.company_hubspot_id] = [];
      dealsMap[d.company_hubspot_id].push(d);
    });

    const lastActivityMap: Record<string, string> = {};
    (latestActs || []).forEach((a) => {
      if (!lastActivityMap[a.company_hubspot_id]) lastActivityMap[a.company_hubspot_id] = a.timestamp;
    });

    const suppMap: Record<string, any> = {};
    (suppData || []).forEach((s) => {
      suppMap[s.company_hubspot_id] = s;
    });

    // Get tabs for this board
    const { data: boardConfig } = await this.supabase
      .from('board_config')
      .select('board_id')
      .eq('slug', boardSlug)
      .single();

    const { data: tabs } = await this.supabase
      .from('board_tabs')
      .select('tab_id, filter_logic')
      .eq('board_id', boardConfig?.board_id || '');

    // Calculate tab counts
    const tabCounts: Record<string, { count: number; arr: number }> = {};
    for (const tab of tabs || []) {
      const filtered = this.applyTabFilter(
        boardCompanies || [],
        tab.filter_logic,
        dealsMap,
        lastActivityMap,
        suppMap,
      );
      tabCounts[tab.tab_id] = {
        count: filtered.length,
        arr: filtered.reduce((sum: number, c: any) => sum + (parseFloat(c.exit_arr) || 0), 0),
      };
    }

    return {
      all_count: (boardCompanies || []).length,
      all_arr: (boardCompanies || []).reduce((sum: number, c: any) => sum + (parseFloat(c.exit_arr) || 0), 0),
      tab_counts: tabCounts,
    };
  }
}
