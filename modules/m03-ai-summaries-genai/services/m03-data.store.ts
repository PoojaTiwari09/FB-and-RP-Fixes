/**
 * In-memory persistence for M03 (replaces Supabase for dev + unified-Prisma cutover).
 */
import { randomUUID } from 'crypto';

export const M03_DEV_ORG = 'a0000000-0000-0000-0000-000000000001';
export const M03_DEV_USER = 'c0000000-0000-0000-0000-000000000001';

export class M03DataStore {
  jobs = new Map<string, any>();
  reports = new Map<string, any>();
  citations = new Map<string, any[]>();
  feedback: any[] = [];
  auditLog: any[] = [];
  briefs = new Map<string, any>();
  querySessions = new Map<string, any>();
  chatHistory: any[] = [];

  workspace = {
    deals: [] as any[],
    accounts: [] as any[],
    contacts: [] as any[],
    calls: [] as any[],
  };

  seedWorkspace() {
    const org = M03_DEV_ORG;
    this.workspace.deals = [
      { id: 'deal-1', org_id: org, name: 'Acme Expansion', stage: 'Negotiation', account_id: 'acct-1', created_at: new Date().toISOString() },
      { id: 'deal-2', org_id: org, name: 'Globex Renewal', stage: 'Proposal', account_id: 'acct-2', created_at: new Date().toISOString() },
    ];
    this.workspace.accounts = [
      { id: 'acct-1', org_id: org, name: 'Acme Corp', region: 'NA' },
      { id: 'acct-2', org_id: org, name: 'Globex Inc', region: 'EMEA' },
    ];
    this.workspace.contacts = [
      { id: 'contact-1', org_id: org, name: 'John Buyer', email: 'john@acme.com', account_id: 'acct-1' },
    ];
    this.workspace.calls = [
      {
        id: 'call-1',
        org_id: org,
        title: 'Discovery — Acme',
        transcript: 'Rep discussed pricing and timeline. Customer raised budget concerns and competitor mention.',
        created_at: new Date().toISOString(),
      },
    ];
  }

  insertJob(row: any) {
    this.jobs.set(row.id, row);
  }

  getJob(id: string, orgId: string) {
    const j = this.jobs.get(id);
    return j && j.org_id === orgId ? j : null;
  }

  listJobs(orgId: string, userId: string, status?: string, limit = 20) {
    let rows = [...this.jobs.values()].filter((j) => j.org_id === orgId && j.user_id === userId);
    if (status) rows = rows.filter((j) => j.status === status);
    return rows.sort((a, b) => (b.created_at || '').localeCompare(a.created_at || '')).slice(0, limit);
  }

  countActiveJobs(orgId: string, userId: string) {
    return [...this.jobs.values()].filter(
      (j) => j.org_id === orgId && j.user_id === userId && ['QUEUED', 'PROCESSING'].includes(j.status),
    ).length;
  }

  updateJob(id: string, patch: Record<string, any>) {
    const j = this.jobs.get(id);
    if (!j) return;
    Object.assign(j, patch);
  }

  insertReport(row: any) {
    this.reports.set(row.id, row);
  }

  getReport(id: string, orgId: string) {
    const r = this.reports.get(id);
    return r && r.org_id === orgId ? r : null;
  }

  getCitations(reportId: string) {
    return this.citations.get(reportId) || [];
  }

  setCitations(reportId: string, rows: any[]) {
    this.citations.set(reportId, rows);
  }

  insertBrief(row: any) {
    this.briefs.set(row.id, row);
    return row;
  }

  listBriefs(orgId: string, entityId?: string) {
    return [...this.briefs.values()].filter(
      (b) => b.org_id === orgId && (!entityId || b.entity_id === entityId),
    );
  }
}

export const m03DataStore = new M03DataStore();
m03DataStore.seedWorkspace();
