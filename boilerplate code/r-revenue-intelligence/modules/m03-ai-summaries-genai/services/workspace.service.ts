import { Injectable } from '@nestjs/common';
import { M03AiSummariesGenaiRepository } from '../repositories/m03.repository';
import { m03DataStore } from './m03-data.store';
import { randomUUID } from 'crypto';

@Injectable()
export class WorkspaceService {
  constructor(private readonly repo: M03AiSummariesGenaiRepository) {}

  async getWorkspace(tenantId: string) {
    const ws = await this.repo.getWorkspace(tenantId);
    return {
      deals: ws.deals.map(this.normalizeDeal),
      accounts: ws.accounts.map(this.normalizeAccount),
      contacts: ws.contacts.map(this.normalizeContact),
      calls: ws.calls.map(this.normalizeCall),
    };
  }

  getChatHistory(tenantId: string) {
    return this.repo.listChatHistory(tenantId);
  }

  async saveChat(tenantId: string, userId: string, question: string, answer: string, citations: any[]) {
    return this.repo.saveChatMessage({ tenantId, userId, question, answer, citations });
  }

  async deleteChat(tenantId: string, id: string) {
    const idx = m03DataStore.chatHistory.findIndex(
      (c) => c.id === id && (c.tenant_id === tenantId || c.org_id === tenantId),
    );
    if (idx >= 0) m03DataStore.chatHistory.splice(idx, 1);
    return { deleted: true };
  }

  upsertDeal(tenantId: string, payload: any) {
    const row = {
      id: payload.id || randomUUID(),
      org_id: tenantId,
      name: payload.name,
      stage: payload.stage || 'Qualification',
      account_id: payload.accountId || payload.account_id,
      created_at: new Date().toISOString(),
    };
    m03DataStore.workspace.deals = [
      row,
      ...m03DataStore.workspace.deals.filter((d) => d.id !== row.id),
    ];
    return this.normalizeDeal(row);
  }

  private normalizeDeal(d: any) {
    return {
      id: d.id,
      name: d.name,
      stage: d.stage ?? 'Qualification',
      accountId: d.account_id ?? d.accountId ?? '',
      account_id: d.account_id ?? d.accountId ?? '',
      created_at: d.created_at ?? '',
    };
  }

  private normalizeAccount(a: any) {
    return { id: a.id, name: a.name ?? '' };
  }

  private normalizeContact(c: any) {
    return {
      id: c.id,
      name: c.name ?? '',
      email: c.email ?? '',
      accountId: c.account_id ?? c.accountId ?? '',
      account_id: c.account_id ?? c.accountId ?? '',
    };
  }

  private normalizeCall(c: any) {
    return {
      id: c.id,
      title: c.title ?? 'Discovery Call',
      transcript: c.transcript ?? '',
      accountId: c.account_id ?? c.accountId ?? '',
      account_id: c.account_id ?? c.accountId ?? '',
      account_name: c.account_name ?? null,
      dealId: c.deal_id ?? c.dealId ?? '',
      deal_id: c.deal_id ?? c.dealId ?? '',
      created_at: c.created_at ?? '',
      duration_seconds: c.duration_seconds,
      call_source: c.call_source,
      participants: c.participants ?? [],
    };
  }
}
