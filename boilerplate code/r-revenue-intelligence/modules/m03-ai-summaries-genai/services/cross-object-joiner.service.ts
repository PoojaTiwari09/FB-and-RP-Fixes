/**
 * Core Feature 29: Cross-Object Data Joiner
 * Joins data across CRM objects (calls → deals → accounts → contacts)
 * for holistic research queries.
 *
 * TC-DR-29: Multi-object research joining.
 * TC-DR-30: No data leakage across org boundaries.
 */
import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../config/supabase.service';

export interface JoinedDataContext {
  calls: any[];
  emails: any[];
  deals: any[];
  accounts: any[];
  contacts: any[];
  relationships: {
    callToDeal: Record<string, string>;
    dealToAccount: Record<string, string>;
    accountToContacts: Record<string, string[]>;
  };
}

@Injectable()
export class CrossObjectJoinerService {
  constructor(private supabase: SupabaseService) {}

  /**
   * Join all CRM objects for a given scope.
   * TC-DR-29: Traverses call → deal → account → contact relationships.
   * TC-DR-30: Every query includes org_id filter for tenant isolation.
   */
  async joinForScope(
    orgId: string,
    scope: {
      accountIds?: string[];
      dealIds?: string[];
      region?: string;
      segment?: string;
      stage?: string;
      teamId?: string;
      periodDays?: number;
    },
  ): Promise<JoinedDataContext> {
    const client = this.supabase.getClient();
    if (!client) {
      return this.emptyContext();
    }

    try {
      // Step 1: Resolve accounts
      let accountIds = scope.accountIds || [];
      if (!accountIds.length) {
        let accountQuery = client
          .from('accounts')
          .select('id')
          .eq('org_id', orgId); // TC-DR-30: org isolation

        if (scope.region) accountQuery = accountQuery.eq('region', scope.region);
        if (scope.segment) accountQuery = accountQuery.eq('segment', scope.segment);

        const { data: accounts } = await accountQuery;
        accountIds = (accounts || []).map(a => a.id);
      }

      if (!accountIds.length) return this.emptyContext();

      // Step 2: Fetch accounts
      const { data: accounts } = await client
        .from('accounts')
        .select('*')
        .eq('org_id', orgId) // TC-DR-30
        .in('id', accountIds);

      // Step 3: Fetch deals linked to accounts
      let dealsQuery = client
        .from('deals')
        .select('*')
        .eq('org_id', orgId) // TC-DR-30
        .in('account_id', accountIds);

      if (scope.stage) dealsQuery = dealsQuery.eq('stage', scope.stage);

      const { data: deals } = await dealsQuery;
      const dealIds = (deals || []).map(d => d.id);

      // Step 4: Fetch contacts for accounts
      const { data: contacts } = await client
        .from('contacts')
        .select('*')
        .eq('org_id', orgId) // TC-DR-30
        .in('account_id', accountIds);

      // Step 5: Fetch calls linked to deals or accounts
      const periodStart = new Date();
      periodStart.setDate(periodStart.getDate() - (scope.periodDays || 60));

      let callsData: any[] = [];

      if (dealIds.length > 0) {
        const { data: dealCalls } = await client
          .from('calls')
          .select('*')
          .eq('org_id', orgId) // TC-DR-30
          .in('deal_id', dealIds)
          .gte('started_at', periodStart.toISOString())
          .order('started_at', { ascending: false });
        callsData.push(...(dealCalls || []));
      }

      const { data: accountCalls } = await client
        .from('calls')
        .select('*')
        .eq('org_id', orgId) // TC-DR-30
        .in('account_id', accountIds)
        .gte('started_at', periodStart.toISOString())
        .order('started_at', { ascending: false });

      // Merge and deduplicate calls
      const callMap = new Map();
      for (const call of [...callsData, ...(accountCalls || [])]) {
        callMap.set(call.id, call);
      }
      const calls = Array.from(callMap.values());

      // Step 6: Fetch emails
      let emailsData: any[] = [];
      if (dealIds.length > 0) {
        const { data: dealEmails } = await client
          .from('emails')
          .select('*')
          .eq('org_id', orgId) // TC-DR-30
          .in('deal_id', dealIds)
          .gte('sent_at', periodStart.toISOString());
        emailsData.push(...(dealEmails || []));
      }

      const { data: accountEmails } = await client
        .from('emails')
        .select('*')
        .eq('org_id', orgId)
        .in('account_id', accountIds)
        .gte('sent_at', periodStart.toISOString());

      const emailMap = new Map();
      for (const email of [...emailsData, ...(accountEmails || [])]) {
        emailMap.set(email.id, email);
      }
      const emails = Array.from(emailMap.values());

      // Build relationship maps
      const callToDeal: Record<string, string> = {};
      const dealToAccount: Record<string, string> = {};
      const accountToContacts: Record<string, string[]> = {};

      for (const call of calls) {
        if (call.deal_id) callToDeal[call.id] = call.deal_id;
      }
      for (const deal of (deals || [])) {
        if (deal.account_id) dealToAccount[deal.id] = deal.account_id;
      }
      for (const contact of (contacts || [])) {
        if (!accountToContacts[contact.account_id]) {
          accountToContacts[contact.account_id] = [];
        }
        accountToContacts[contact.account_id].push(contact.id);
      }

      // Enrich calls with user names
      const { data: users } = await client
        .from('users')
        .select('id, name')
        .eq('org_id', orgId);
      const userMap: Record<string, string> = {};
      for (const u of (users || [])) {
        userMap[u.id] = u.name;
      }
      for (const call of calls) {
        call.owner_name = userMap[call.owner_user_id] || 'Unknown';
      }

      return {
        calls,
        emails,
        deals: deals || [],
        accounts: accounts || [],
        contacts: contacts || [],
        relationships: { callToDeal, dealToAccount, accountToContacts },
      };
    } catch (err) {
      console.error('Cross-object join error:', err);
      return this.emptyContext();
    }
  }

  private emptyContext(): JoinedDataContext {
    return {
      calls: [],
      emails: [],
      deals: [],
      accounts: [],
      contacts: [],
      relationships: { callToDeal: {}, dealToAccount: {}, accountToContacts: {} },
    };
  }
}
