import { Controller, Get, Post, HttpCode } from '@nestjs/common';
import { Public } from '../../platform-core/decorators/public.decorator';
import { m05DataStore, m05SeedManifest } from '../database/m05-data.store';
import { M05_VERIFICATION_MATRIX } from '../database/m05-verification.matrix';
import { PrismaService } from '../database/prisma.service';

@Public()
@Controller('api/v1/account-intelligence/test')
export class M05TestController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('health')
  health() {
    return {
      success: true,
      module: 'm05-account-intelligence',
      timestamp: new Date().toISOString(),
    };
  }

  @Post('smoke')
  @HttpCode(200)
  smoke() {
    return {
      success: true,
      module: 'm05-account-intelligence',
      checks: ['health', 'accounts_route', 'webhook_env'],
      webhookSecretConfigured: Boolean(
        process.env.M05_HUBSPOT_WEBHOOK_SECRET || process.env.HUBSPOT_WEBHOOK_SECRET,
      ),
      hubspotTokenConfigured: Boolean(process.env.HUBSPOT_ACCESS_TOKEN),
      hubspotPortalId: process.env.HUBSPOT_PORTAL_ID || null,
    };
  }

  /** Feature ↔ seed verification matrix (see M05-VERIFICATION.md). */
  @Get('verification')
  verification() {
    return {
      success: true,
      module: 'm05-account-intelligence',
      count: M05_VERIFICATION_MATRIX.length,
      matrix: M05_VERIFICATION_MATRIX,
      manifest: m05SeedManifest(),
      stats: m05DataStore.stats(),
      reload_seed: 'POST /api/v1/account-intelligence/test/seed',
    };
  }

  /** Reload in-memory demo CRM + boards (demo + commercial slugs). */
  @Post('seed')
  @HttpCode(200)
  async seed() {
    m05DataStore.reset();

    // 1. Clear existing data in database
    await this.prisma.m05TodoNote.deleteMany({});
    await this.prisma.m05AiBriefCache.deleteMany({});
    await this.prisma.m05Activity.deleteMany({});
    await this.prisma.m05Deal.deleteMany({});
    await this.prisma.m05Contact.deleteMany({});
    await this.prisma.m05SupplementaryAccount.deleteMany({});
    await this.prisma.m05Company.deleteMany({});
    await this.prisma.m05BoardColumn.deleteMany({});
    await this.prisma.m05BoardTab.deleteMany({});
    await this.prisma.m05BoardConfig.deleteMany({});
    await this.prisma.m05UserBoardPreference.deleteMany({});
    await this.prisma.m05PermissionProfile.deleteMany({});

    // 2. Seed Board Configs
    const boards = m05DataStore.table('board_config');
    for (const b of boards) {
      await this.prisma.m05BoardConfig.create({
        data: {
          board_id: b.board_id,
          slug: b.slug,
          name: b.name,
          description: b.description,
          parent_board_slug: b.parent_board_slug,
          default_sort_field: b.default_sort_field,
          default_sort_dir: b.default_sort_dir,
          date_filter_enabled: b.date_filter_enabled,
          ai_briefs_enabled: b.ai_briefs_enabled,
          brief_type: b.brief_type,
          brief_period_days: b.brief_period_days,
          aggregation_method: b.aggregation_method,
          created_by_user_id: b.created_by_user_id,
          date_filter_field: b.date_filter_field,
          created_at: new Date(b.created_at || Date.now()),
        },
      });
    }

    // 3. Seed Board Tabs
    const tabs = m05DataStore.table('board_tabs');
    for (const t of tabs) {
      await this.prisma.m05BoardTab.create({
        data: {
          tab_id: `${t.board_id}_${t.tab_id}`,
          board_id: t.board_id,
          label: t.label,
          is_default: t.is_default,
          order: t.order,
          filter_logic: t.filter_logic,
        },
      });
    }

    // 4. Seed Board Columns
    const columns = m05DataStore.table('board_columns');
    for (const c of columns) {
      await this.prisma.m05BoardColumn.create({
        data: {
          col_id: `${c.board_id}_${c.col_id}`,
          board_id: c.board_id,
          field_key: c.field_key,
          label: c.label,
          column_type: c.column_type,
          order: c.order,
          width: c.width,
          sortable: c.sortable,
          editable: c.editable,
          visible_to_roles: c.visible_to_roles,
        },
      });
    }

    // 5. Seed Companies
    const companies = m05DataStore.table('crm_companies');
    for (const c of companies) {
      await this.prisma.m05Company.create({
        data: {
          hubspot_id: c.hubspot_id,
          name: c.name,
          board: c.board,
          exit_arr: c.exit_arr,
          assigned_rep_id: c.assigned_rep_id,
          hubspot_owner_id: c.hubspot_owner_id,
          industry: c.industry,
          domain: c.domain,
          employee_count: c.employee_count,
          updated_at: new Date(c.updated_at || Date.now()),
        },
      });
    }

    // 6. Seed Supplementary Accounts
    const supps = m05DataStore.table('supplementary_accounts');
    for (const s of supps) {
      await this.prisma.m05SupplementaryAccount.create({
        data: {
          company_hubspot_id: s.company_hubspot_id,
          ai_risk_score: s.ai_risk_score,
          ai_risk_label: s.ai_risk_label,
          notes: s.notes,
          manager_note: s.manager_note,
        },
      });
    }

    // 7. Seed Activities
    const activities = m05DataStore.table('crm_activities');
    for (const a of activities) {
      await this.prisma.m05Activity.create({
        data: {
          local_id: a.local_id,
          hubspot_id: a.hubspot_id,
          company_hubspot_id: a.company_hubspot_id,
          type: a.type,
          direction: a.direction,
          timestamp: new Date(a.timestamp),
          body: a.body,
          assigned_rep_id: a.assigned_rep_id,
          rep_talk_pct: a.rep_talk_pct,
          client_talk_pct: a.client_talk_pct,
          call_outcome: a.call_outcome,
          duration_seconds: a.duration_seconds,
          subject: a.subject,
        },
      });
    }

    // 8. Seed Deals
    const deals = m05DataStore.table('crm_deals');
    for (const d of deals) {
      await this.prisma.m05Deal.create({
        data: {
          hubspot_id: d.hubspot_id,
          company_hubspot_id: d.company_hubspot_id,
          deal_name: d.deal_name,
          stage: d.stage,
          amount: d.amount,
          deal_type: d.deal_type,
          assigned_rep_id: d.assigned_rep_id,
          close_date: d.close_date ? new Date(d.close_date) : null,
        },
      });
    }

    // 9. Seed Contacts
    const contacts = m05DataStore.table('crm_contacts');
    for (const c of contacts) {
      await this.prisma.m05Contact.create({
        data: {
          hubspot_id: c.hubspot_id,
          company_hubspot_id: c.company_hubspot_id,
          first_name: c.first_name,
          last_name: c.last_name,
          email: c.email,
          title: c.title,
        },
      });
    }

    // 10. Seed Todos & Notes
    const todos = m05DataStore.table('todos_notes');
    for (const t of todos) {
      await this.prisma.m05TodoNote.create({
        data: {
          id: t.id,
          company_hubspot_id: t.company_hubspot_id,
          type: t.type,
          content: t.content,
          completed: t.completed,
          completed_at: t.completed_at ? new Date(t.completed_at) : null,
          created_by_role: t.created_by_role,
          created_at: new Date(t.created_at || Date.now()),
        },
      });
    }

    // 11. Seed AI Brief Cache
    const briefs = m05DataStore.table('ai_briefs_cache');
    for (const b of briefs) {
      await this.prisma.m05AiBriefCache.create({
        data: {
          id: b.id,
          company_hubspot_id: b.company_hubspot_id,
          board_slug: b.board_slug,
          brief_json: b.brief_json,
          generated_at: new Date(b.generated_at || Date.now()),
        },
      });
    }

    // 12. Seed User Board Preferences
    const prefs = m05DataStore.table('user_board_preferences');
    for (const p of prefs) {
      await this.prisma.m05UserBoardPreference.create({
        data: {
          id: p.id,
          session_role: p.session_role,
          board_id: p.board_id,
          active_tab_id: p.active_tab_id,
          sort_field: p.sort_field,
          sort_dir: p.sort_dir,
          page_size: p.page_size,
          updated_at: new Date(p.updated_at || Date.now()),
        },
      });
    }

    // 13. Seed Permission Profiles
    const profiles = m05DataStore.table('permission_profiles');
    for (const p of profiles) {
      await this.prisma.m05PermissionProfile.create({
        data: {
          id: p.id,
          role: p.role,
          name: p.name,
          can_edit_board_config: p.can_edit_board_config,
          can_edit_cells: p.can_edit_cells,
        },
      });
    }

    return {
      success: true,
      module: 'm05-account-intelligence',
      message: 'Demo seed loaded (PostgreSQL & in-memory). Boards: demo (4 accounts), commercial (1).',
      stats: m05DataStore.stats(),
      manifest: m05SeedManifest(),
      verification: 'GET /api/v1/account-intelligence/test/verification',
      urls: {
        demo: 'http://localhost:5179/board/demo',
        commercial: 'http://localhost:5179/board/commercial',
      },
    };
  }
}
