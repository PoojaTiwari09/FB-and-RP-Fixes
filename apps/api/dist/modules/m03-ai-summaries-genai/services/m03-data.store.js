"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.m03DataStore = exports.M03DataStore = exports.M03_DEV_USER = exports.M03_DEV_ORG = void 0;
exports.M03_DEV_ORG = 'a0000000-0000-0000-0000-000000000001';
exports.M03_DEV_USER = 'c0000000-0000-0000-0000-000000000001';
class M03DataStore {
    jobs = new Map();
    reports = new Map();
    citations = new Map();
    feedback = [];
    auditLog = [];
    briefs = new Map();
    querySessions = new Map();
    chatHistory = [];
    workspace = {
        deals: [],
        accounts: [],
        contacts: [],
        calls: [],
    };
    seedWorkspace() {
        const org = exports.M03_DEV_ORG;
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
        const staticJobId = 'j0000000-0000-0000-0000-000000000001';
        const staticReportId = 'r0000000-0000-0000-0000-000000000001';
        this.jobs.set(staticJobId, {
            id: staticJobId,
            org_id: org,
            user_id: exports.M03_DEV_USER,
            query: 'What are the top risks?',
            status: 'COMPLETED',
            progress_pct: 100,
            progress_stage: 'Complete',
            report_id: staticReportId,
            created_at: new Date().toISOString(),
            completed_at: new Date().toISOString(),
        });
        this.reports.set(staticReportId, {
            id: staticReportId,
            job_id: staticJobId,
            org_id: org,
            query: 'What are the top risks?',
            status: 'COMPLETED',
            version: 1,
            content: { sections: [{ title: 'Executive Summary', body: 'Pre-seeded research report content.' }] },
            model_used: 'mock',
            created_at: new Date().toISOString(),
        });
    }
    insertJob(row) {
        this.jobs.set(row.id, row);
    }
    getJob(id, orgId) {
        const j = this.jobs.get(id);
        return j && j.org_id === orgId ? j : null;
    }
    listJobs(orgId, userId, status, limit = 20) {
        let rows = [...this.jobs.values()].filter((j) => j.org_id === orgId && j.user_id === userId);
        if (status)
            rows = rows.filter((j) => j.status === status);
        return rows.sort((a, b) => (b.created_at || '').localeCompare(a.created_at || '')).slice(0, limit);
    }
    countActiveJobs(orgId, userId) {
        return [...this.jobs.values()].filter((j) => j.org_id === orgId && j.user_id === userId && ['QUEUED', 'PROCESSING'].includes(j.status)).length;
    }
    updateJob(id, patch) {
        const j = this.jobs.get(id);
        if (!j)
            return;
        Object.assign(j, patch);
    }
    insertReport(row) {
        this.reports.set(row.id, row);
    }
    getReport(id, orgId) {
        const r = this.reports.get(id);
        return r && r.org_id === orgId ? r : null;
    }
    getCitations(reportId) {
        return this.citations.get(reportId) || [];
    }
    setCitations(reportId, rows) {
        this.citations.set(reportId, rows);
    }
    insertBrief(row) {
        this.briefs.set(row.id, row);
        return row;
    }
    listBriefs(orgId, entityId) {
        return [...this.briefs.values()].filter((b) => b.org_id === orgId && (!entityId || b.entity_id === entityId));
    }
}
exports.M03DataStore = M03DataStore;
exports.m03DataStore = new M03DataStore();
exports.m03DataStore.seedWorkspace();
//# sourceMappingURL=m03-data.store.js.map