import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { M05DbClient } from '../database/m05-db.client';
import { getSupabase } from '../config/supabase';

export interface SummaryRequest {
  company_hubspot_id: string;
  scope?: string;
  period_days?: number;
  force_refresh?: boolean;
  brief_type?: string;
}

export interface ChatRequest {
  company_hubspot_id: string;
  message: string;
  conversation_history?: { role: string; content: string }[];
}

const SUMMARY_SYSTEM_PROMPT = `You are a Revenue Intelligence analyst for a B2B SaaS company.
Given account context data, produce a structured JSON brief.

Respond ONLY with valid JSON in this exact schema:
{
  "status": "At Risk | Healthy | Needs Attention",
  "key_risks": ["risk 1", "risk 2"],
  "recommended_steps": ["step 1", "step 2", "step 3"],
  "citations": [
    {"activity_id": "act_01", "type": "CALL", "date": "2025-01-15", "summary": "Rep talked 70%, client engagement was low"}
  ],
  "insufficient_data": false
}

Rules:
- Be concise and data-driven. Every risk must cite a specific activity or data point.
- If there are fewer than 3 activities total, set insufficient_data to true.
- Limit key_risks to 3 items maximum.
- Limit recommended_steps to 3 items maximum.
- Status must be one of: At Risk, Healthy, Needs Attention.`;

const BRIEF_TYPE_INSTRUCTIONS: Record<string, string> = {
  "full": "Generate a comprehensive brief covering status, all risks, and all recommended steps.",
  "summary": "Generate a concise 2-3 sentence executive summary with the top 1-2 risks only.",
  "risk_only": "Focus exclusively on risks and required actions. Omit any positive framing.",
};

const CHAT_SYSTEM_PROMPT = `You are a Revenue Intelligence analyst assistant for a B2B SaaS sales team.
You have deep knowledge of the account provided. Answer questions concisely and accurately,
citing specific activities, deals, or data points from the context.
IMPORTANT: When referencing activity dates, you MUST use the exact YYYY-MM-DD format as provided in the context (e.g. 2024-10-30). Do not use formats like 'October 30, 2024'.
Be direct and actionable — you are talking to a sales rep or manager.
If you don't have enough data to answer confidently, say so clearly.`;

@Injectable()
export class AiService {
  private db: M05DbClient;
  private groqApiKey: string;
  private groqModel = 'llama-3.3-70b-versatile';
  private groqBaseUrl = 'https://api.groq.com/openai/v1/chat/completions';

  constructor(private configService?: ConfigService) {
    const read = (k: string) =>
      this.configService?.get<string>(k) ?? process.env[k] ?? '';
    this.groqApiKey = read('GROQ_API_KEY');
    this.db = getSupabase();
  }

  async buildContext(companyHubspotId: string, scope: string, periodDays: number) {
    const { data: company } = await this.db
      .from('crm_companies')
      .select('*')
      .eq('hubspot_id', companyHubspotId)
      .single();

    if (!company) {
      throw new HttpException('Company not found', HttpStatus.NOT_FOUND);
    }

    const { data: contacts } = await this.db
      .from('crm_contacts')
      .select('first_name, last_name, job_title, is_primary')
      .eq('company_hubspot_id', companyHubspotId);

    const { data: allDeals } = await this.db
      .from('crm_deals')
      .select('name, stage, amount, adjusted_amount, deal_type, close_date')
      .eq('company_hubspot_id', companyHubspotId);

    const safeAllDeals = allDeals || [];
    const openDeals = safeAllDeals.filter(d => !['Closed Won', 'Closed Lost'].includes(d.stage));
    const closedDeals = safeAllDeals.filter(d => ['Closed Won', 'Closed Lost'].includes(d.stage));

    let activitiesQuery = this.db
      .from('crm_activities')
      .select('type, direction, timestamp, body, rep_talk_pct, client_talk_pct, call_outcome, subject, title, duration_seconds')
      .eq('company_hubspot_id', companyHubspotId)
      .order('timestamp', { ascending: false });

    if (periodDays > 0) {
      const cutoff = new Date(Date.now() - periodDays * 24 * 60 * 60 * 1000).toISOString();
      activitiesQuery = activitiesQuery.gte('timestamp', cutoff);
    }

    const { data: activities } = await activitiesQuery.limit(50);

    const { data: supp } = await this.db
      .from('supplementary_accounts')
      .select('manager_note, ai_risk_score, risk_label, next_qbr_date, strategic_priority')
      .eq('company_hubspot_id', companyHubspotId)
      .single();

    return {
      company,
      contacts: contacts || [],
      open_deals: scope !== 'deals_only' ? openDeals : safeAllDeals,
      closed_deals: scope === 'deals_only' ? [] : closedDeals,
      activities: activities || [],
      supplementary: supp || {},
      scope,
      period_days: periodDays,
    };
  }

  formatContextForPrompt(ctx: any): string {
    const c = ctx.company;
    const lines = [
      `ACCOUNT: ${c.name || 'Unknown'}`,
      `Industry: ${c.industry || 'N/A'} | Segment: ${c.segment || 'N/A'} | Type: ${c.type || 'N/A'}`,
      `Exit ARR: $${(c.exit_arr || 0).toLocaleString()} | Employees: ${c.employee_count || 'N/A'}`,
      `AI Risk Score: ${ctx.supplementary?.ai_risk_score || 0} (${ctx.supplementary?.risk_label || 'N/A'})`,
      "",
      "CONTACTS:",
    ];

    for (const contact of ctx.contacts.slice(0, 5)) {
      const primary = contact.is_primary ? "(Primary)" : "";
      lines.push(`  - ${contact.first_name || ''} ${contact.last_name || ''} — ${contact.job_title || 'N/A'} ${primary}`);
    }

    lines.push("");
    lines.push(`OPEN DEALS (${ctx.open_deals.length}):`);
    for (const deal of ctx.open_deals.slice(0, 5)) {
      lines.push(`  - ${deal.name || 'N/A'} | Stage: ${deal.stage || 'N/A'} | $${(deal.amount || 0).toLocaleString()} | Close: ${deal.close_date || 'N/A'}`);
    }

    lines.push("");
    const periodLabel = ctx.period_days > 0 ? `Last ${ctx.period_days} days` : "All time";
    lines.push(`ACTIVITIES (${ctx.activities.length} in ${periodLabel}):`);
    for (const act of ctx.activities.slice(0, 15)) {
      const ts = (act.timestamp || '').substring(0, 10);
      const actType = act.type || "";
      const direction = act.direction || "";
      const body = (act.body || act.subject || "").substring(0, 200);
      let detail = "";
      if (actType === "CALL") {
        const repPct = act.rep_talk_pct;
        const clientPct = act.client_talk_pct;
        const outcome = act.call_outcome || "";
        if (repPct) {
          detail = ` | Rep ${repPct}% / Client ${clientPct}% | Outcome: ${outcome}`;
        }
      }
      lines.push(`  [${ts}] ${actType} (${direction})${detail}: ${body}`);
    }

    const managerNote = ctx.supplementary?.manager_note || "";
    if (managerNote) {
      lines.push("");
      lines.push(`MANAGER NOTE: ${managerNote}`);
    }

    return lines.join("\n");
  }

  extractCitations(reply: string, activities: any[]): any[] {
    const citations = [];
    const seenDates = new Set<string>();
    for (const act of activities.slice(0, 30)) {
      const ts = (act.timestamp || '').substring(0, 10);
      if (!ts || seenDates.has(ts)) continue;
      const subject = act.subject || act.title || "";
      if (reply.includes(ts) || (subject && reply.includes(subject))) {
        seenDates.add(ts);
        citations.push({
          type: act.type || "",
          date: ts,
          summary: (act.body || subject || "").substring(0, 120),
        });
      }
      if (citations.length >= 5) break;
    }
    return citations;
  }

  async callGroq(messages: any[], responseFormat?: any): Promise<string> {
    if (!this.groqApiKey) {
      return "AI service not configured. Please set GROQ_API_KEY in .env.local.";
    }

    try {
      const bodyPayload: any = {
        model: this.groqModel,
        messages,
        max_tokens: 1024,
        temperature: 0.3,
      };
      if (responseFormat) {
        bodyPayload.response_format = responseFormat;
      }

      const response = await fetch(this.groqBaseUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.groqApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bodyPayload),
      });

      if (!response.ok) {
        throw new Error(`Groq API error: ${response.statusText}`);
      }

      const data = await response.json();
      return data.choices[0].message.content;
    } catch (e) {
      console.error(e);
      return "Error communicating with Groq API.";
    }
  }

  async getCachedBrief(companyHubspotId: string, scope: string, periodDays: number): Promise<any | null> {
    try {
      const { data } = await this.db
        .from('ai_briefs_cache')
        .select('brief_json, generated_at')
        .eq('company_hubspot_id', companyHubspotId)
        .eq('scope', scope)
        .eq('period_days', periodDays)
        .single();
      
      if (data) {
        const generatedAt = new Date(data.generated_at);
        if (Date.now() - generatedAt.getTime() < 24 * 60 * 60 * 1000) {
          return data.brief_json;
        }
      }
    } catch (e) {
      // ignore
    }
    return null;
  }

  async saveBriefCache(companyHubspotId: string, scope: string, periodDays: number, brief: any) {
    try {
      await this.db
        .from('ai_briefs_cache')
        .upsert({
          company_hubspot_id: companyHubspotId,
          scope,
          period_days: periodDays,
          brief_json: brief,
          generated_at: new Date().toISOString(),
        }, { onConflict: 'company_hubspot_id,scope,period_days' });
    } catch (e) {
      console.error(`Cache save error: ${e}`);
    }
  }

  async generateSummary(req: SummaryRequest) {
    const scope = req.scope || 'entire_account';
    const periodDays = req.period_days ?? 90;
    const briefType = req.brief_type || 'full';
    const cacheScope = `${scope}:${briefType}`;

    if (!req.force_refresh) {
      const cached = await this.getCachedBrief(req.company_hubspot_id, cacheScope, periodDays);
      if (cached) {
        return {
          brief: cached,
          generated_at: new Date().toISOString(),
          cached: true,
          insufficient_data: cached.insufficient_data || false,
        };
      }
    }

    const ctx = await this.buildContext(req.company_hubspot_id, scope, periodDays);
    const contextText = this.formatContextForPrompt(ctx);
    const typeInstruction = BRIEF_TYPE_INSTRUCTIONS[briefType] || BRIEF_TYPE_INSTRUCTIONS['full'];
    const dynamicSystemPrompt = `${SUMMARY_SYSTEM_PROMPT}\n\nBRIEF TYPE: ${typeInstruction}`;

    const messages = [
      { role: 'system', content: dynamicSystemPrompt },
      { role: 'user', content: `Generate a revenue intelligence brief for this account:\n\n${contextText}` }
    ];

    const raw = await this.callGroq(messages, { type: 'json_object' });

    let brief;
    try {
      const cleaned = raw.trim().replace(/^\s*```json\s*/i, '').replace(/\s*```\s*$/i, '').trim();
      brief = JSON.parse(cleaned);
    } catch (e) {
      brief = {
        status: "Needs Attention",
        key_risks: ["Unable to parse AI response"],
        recommended_steps: ["Review account manually"],
        citations: [],
        insufficient_data: ctx.activities.length < 3,
      };
    }

    await this.saveBriefCache(req.company_hubspot_id, cacheScope, periodDays, brief);

    return {
      brief,
      generated_at: new Date().toISOString(),
      cached: false,
      insufficient_data: brief.insufficient_data || false,
    };
  }

  async chat(req: ChatRequest) {
    const ctx = await this.buildContext(req.company_hubspot_id, "entire_account", 0);
    const contextText = this.formatContextForPrompt(ctx);

    const messages = [
      { role: 'system', content: `${CHAT_SYSTEM_PROMPT}\n\nACCOUNT CONTEXT:\n${contextText}` }
    ];

    for (const turn of (req.conversation_history || []).slice(-6)) {
      messages.push(turn);
    }

    messages.push({ role: 'user', content: req.message });

    const reply = await this.callGroq(messages);
    const insufficientData = ctx.activities.length < 3;
    const citations = this.extractCitations(reply, ctx.activities);

    return {
      reply,
      citations,
      insufficient_data: insufficientData,
    };
  }
}
