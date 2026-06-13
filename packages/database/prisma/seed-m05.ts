import { PrismaClient } from '@prisma/client';
import { M05DataStore } from '../../../modules/m05-account-intelligence/database/m05-data.store';

export async function seedM05(prisma: PrismaClient) {
  console.log('Seeding M05 Account Intelligence data...');

  const store = new M05DataStore();

  // 1. Clear existing data
  await prisma.m05TodoNote.deleteMany({});
  await prisma.m05AiBriefCache.deleteMany({});
  await prisma.m05Activity.deleteMany({});
  await prisma.m05Deal.deleteMany({});
  await prisma.m05Contact.deleteMany({});
  await prisma.m05SupplementaryAccount.deleteMany({});
  await prisma.m05Company.deleteMany({});
  await prisma.m05BoardColumn.deleteMany({});
  await prisma.m05BoardTab.deleteMany({});
  await prisma.m05BoardConfig.deleteMany({});
  await prisma.m05UserBoardPreference.deleteMany({});
  await prisma.m05PermissionProfile.deleteMany({});

  // 2. Board Configs
  const boards = store.table('board_config');
  for (const b of boards) {
    await prisma.m05BoardConfig.create({
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

  // 3. Board Tabs & Columns
  const tabs = store.table('board_tabs');
  for (const t of tabs) {
    await prisma.m05BoardTab.create({
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

  const columns = store.table('board_columns');
  for (const c of columns) {
    await prisma.m05BoardColumn.create({
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

  // 4. Companies
  const companies = store.table('crm_companies');
  for (const c of companies) {
    await prisma.m05Company.create({
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

  // 5. Supplementary Accounts
  const supps = store.table('supplementary_accounts');
  for (const s of supps) {
    await prisma.m05SupplementaryAccount.create({
      data: {
        company_hubspot_id: s.company_hubspot_id,
        ai_risk_score: s.ai_risk_score,
        ai_risk_label: s.ai_risk_label,
        notes: s.notes,
        manager_note: s.manager_note,
      },
    });
  }

  // 6. Activities, Deals, Contacts
  const activities = store.table('crm_activities');
  for (const a of activities) {
    await prisma.m05Activity.create({
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

  const deals = store.table('crm_deals');
  for (const d of deals) {
    await prisma.m05Deal.create({
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

  const contacts = store.table('crm_contacts');
  for (const c of contacts) {
    await prisma.m05Contact.create({
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

  // 7. Todos, Briefs, Preferences, Permissions
  const todos = store.table('todos_notes');
  for (const t of todos) {
    await prisma.m05TodoNote.create({
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

  const briefs = store.table('ai_briefs_cache');
  for (const b of briefs) {
    await prisma.m05AiBriefCache.create({
      data: {
        id: b.id,
        company_hubspot_id: b.company_hubspot_id,
        board_slug: b.board_slug,
        brief_json: b.brief_json,
        generated_at: new Date(b.generated_at || Date.now()),
      },
    });
  }

  const prefs = store.table('user_board_preferences');
  for (const p of prefs) {
    await prisma.m05UserBoardPreference.create({
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

  const profiles = store.table('permission_profiles');
  for (const p of profiles) {
    await prisma.m05PermissionProfile.create({
      data: {
        id: p.id,
        role: p.role,
        name: p.name,
        can_edit_board_config: p.can_edit_board_config,
        can_edit_cells: p.can_edit_cells,
      },
    });
  }

  console.log('M05 seeder completed successfully.');
}
