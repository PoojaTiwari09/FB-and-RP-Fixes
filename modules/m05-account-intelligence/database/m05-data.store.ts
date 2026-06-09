/**
 * In-memory M05 CRM/board store (replaces Supabase for local Postgres/Prisma cutover).
 * Call m05DataStore.reset() to reload demo seed (API restart or POST /test/seed).
 * See M05-VERIFICATION.md and GET /test/verification for feature ↔ seed mapping.
 */
import { randomUUID } from 'crypto';

function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

function daysAhead(n: number) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString();
}

/** Tab filter objects (accounts.service applyTabFilter). */
export const M05_TAB_FILTERS = {
  all: { operator: 'AND' as const, conditions: [] as { field: string; op: string; value: unknown }[] },
  highArr: {
    operator: 'AND' as const,
    conditions: [{ field: 'exit_arr', op: 'gte', value: 200000 }],
  },
  atRisk: {
    operator: 'AND' as const,
    conditions: [{ field: 'ai_risk_score', op: 'gte', value: 50 }],
  },
};

const BOARDS = [
  {
    board_id: 'board-demo-001',
    slug: 'demo',
    name: 'Demo Account Board',
    parent_board_slug: null,
    default_sort_field: 'exit_arr',
    default_sort_dir: 'desc',
    date_filter_enabled: true,
    ai_briefs_enabled: true,
    brief_type: 'full',
    brief_period_days: 30,
  },
  {
    board_id: 'board-commercial-001',
    slug: 'commercial',
    name: 'Commercial — Enterprise',
    parent_board_slug: null,
    default_sort_field: 'exit_arr',
    default_sort_dir: 'desc',
    date_filter_enabled: true,
    ai_briefs_enabled: true,
    brief_type: 'full',
    brief_period_days: 30,
  },
];

const COMPANIES = [
  {
    hubspot_id: 'hs-demo-acme',
    name: 'Acme Corp',
    board: 'demo',
    exit_arr: 285000,
    assigned_rep_id: 'rep_01',
    hubspot_owner_id: 'owner-1',
    industry: 'Software',
    domain: 'acme.com',
    employee_count: 1200,
    updated_at: daysAgo(1),
  },
  {
    hubspot_id: 'hs-demo-globex',
    name: 'Globex Corporation',
    board: 'demo',
    exit_arr: 150000,
    assigned_rep_id: 'rep_02',
    hubspot_owner_id: 'owner-2',
    industry: 'Manufacturing',
    domain: 'globex.com',
    employee_count: 800,
    updated_at: daysAgo(2),
  },
  {
    hubspot_id: 'hs-demo-initech',
    name: 'Initech Systems',
    board: 'demo',
    exit_arr: 65000,
    assigned_rep_id: 'rep_03',
    hubspot_owner_id: 'owner-3',
    industry: 'Finance',
    domain: 'initech.com',
    employee_count: 450,
    updated_at: daysAgo(5),
  },
  /** Low engagement: only activity outside 21-day window (engagement-gap seed). */
  {
    hubspot_id: 'hs-demo-umbrella',
    name: 'Umbrella Corp',
    board: 'demo',
    exit_arr: 95000,
    assigned_rep_id: 'rep_01',
    hubspot_owner_id: 'owner-1',
    industry: 'Healthcare',
    domain: 'umbrella.com',
    employee_count: 320,
    updated_at: daysAgo(25),
  },
  {
    hubspot_id: 'hs-demo-stark',
    name: 'Stark Industries',
    board: 'commercial',
    exit_arr: 420000,
    assigned_rep_id: 'rep_01',
    hubspot_owner_id: 'owner-1',
    industry: 'Defense',
    domain: 'stark.com',
    employee_count: 5000,
    updated_at: daysAgo(0),
  },
];

function buildColumns(boardId: string) {
  return [
    {
      col_id: 1,
      board_id: boardId,
      field_key: 'name',
      label: 'Account',
      column_type: 'text',
      order: 0,
      width: 220,
      sortable: true,
      editable: false,
      visible_to_roles: ['rep', 'manager', 'admin'],
    },
    {
      col_id: 2,
      board_id: boardId,
      field_key: 'exit_arr',
      label: 'Exit ARR',
      column_type: 'system',
      order: 1,
      width: 120,
      sortable: true,
      editable: true,
      visible_to_roles: ['rep', 'manager', 'admin'],
    },
    {
      col_id: 3,
      board_id: boardId,
      field_key: 'last_activity_date',
      label: 'Last Activity',
      column_type: 'crm',
      order: 2,
      width: 140,
      sortable: true,
      editable: false,
      visible_to_roles: ['rep', 'manager', 'admin'],
    },
    {
      col_id: 4,
      board_id: boardId,
      field_key: 'contacts_count',
      label: 'Contacts',
      column_type: 'crm',
      order: 3,
      width: 90,
      sortable: true,
      editable: false,
      visible_to_roles: ['rep', 'manager', 'admin'],
    },
    {
      col_id: 5,
      board_id: boardId,
      field_key: 'open_deals_summary',
      label: 'Open Deals',
      column_type: 'crm',
      order: 4,
      width: 160,
      sortable: false,
      editable: false,
      visible_to_roles: ['rep', 'manager', 'admin'],
    },
    {
      col_id: 6,
      board_id: boardId,
      field_key: 'manager_note',
      label: 'Manager Note',
      column_type: 'supplementary',
      order: 5,
      width: 180,
      sortable: false,
      editable: true,
      visible_to_roles: ['manager', 'admin'],
    },
  ];
}

function buildTabs(boardId: string) {
  return [
    {
      tab_id: 1,
      board_id: boardId,
      label: 'All Accounts',
      is_default: true,
      filter_logic: M05_TAB_FILTERS.all,
      order: 0,
    },
    {
      tab_id: 2,
      board_id: boardId,
      label: 'High ARR',
      is_default: false,
      filter_logic: M05_TAB_FILTERS.highArr,
      order: 1,
    },
    {
      tab_id: 3,
      board_id: boardId,
      label: 'At Risk',
      is_default: false,
      filter_logic: M05_TAB_FILTERS.atRisk,
      order: 2,
    },
  ];
}

function buildActivities() {
  const acts: Record<string, unknown>[] = [
    {
      hubspot_id: 'act-umbrella-001',
      local_id: randomUUID(),
      company_hubspot_id: 'hs-demo-umbrella',
      type: 'EMAIL',
      direction: 'OUTBOUND',
      timestamp: daysAgo(25),
      body: 'Quarterly check-in — no response.',
      assigned_rep_id: 'rep_01',
    },
    {
      hubspot_id: 'act-initech-001',
      local_id: randomUUID(),
      company_hubspot_id: 'hs-demo-initech',
      type: 'MEETING',
      direction: 'OUTBOUND',
      timestamp: daysAgo(6),
      body: 'Pilot program proposal review.',
      assigned_rep_id: 'rep_03',
    },
    {
      hubspot_id: 'act-globex-001',
      local_id: randomUUID(),
      company_hubspot_id: 'hs-demo-globex',
      type: 'MEETING',
      direction: 'OUTBOUND',
      timestamp: daysAgo(3),
      body: 'Platform expansion workshop with CTO.',
      assigned_rep_id: 'rep_02',
    },
    {
      hubspot_id: 'act-globex-002',
      local_id: randomUUID(),
      company_hubspot_id: 'hs-demo-globex',
      type: 'CALL',
      direction: 'OUTBOUND',
      timestamp: daysAgo(8),
      body: 'Quarterly business review prep.',
      assigned_rep_id: 'rep_02',
      rep_talk_pct: 55,
      client_talk_pct: 45,
      call_outcome: 'Connected',
      duration_seconds: 1800,
    },
    {
      hubspot_id: 'act-stark-001',
      local_id: randomUUID(),
      company_hubspot_id: 'hs-demo-stark',
      type: 'CALL',
      direction: 'INBOUND',
      timestamp: daysAgo(1),
      body: 'Executive sponsor check-in — renewal on track.',
      assigned_rep_id: 'rep_01',
      rep_talk_pct: 40,
      client_talk_pct: 60,
      call_outcome: 'Connected',
      duration_seconds: 2400,
    },
  ];

  // Rich 21-day window for Acme (sparkline / timeline)
  const acmeDays = [0, 1, 2, 3, 5, 7, 10, 14];
  const acmeTypes = ['CALL', 'EMAIL', 'CALL', 'MEETING', 'EMAIL', 'CALL', 'EMAIL', 'CALL'] as const;
  acmeDays.forEach((d, i) => {
    const isCall = acmeTypes[i] === 'CALL';
    acts.push({
      hubspot_id: `act-acme-${String(i + 1).padStart(2, '0')}`,
      local_id: randomUUID(),
      company_hubspot_id: 'hs-demo-acme',
      type: acmeTypes[i],
      direction: i % 2 === 0 ? 'OUTBOUND' : 'INBOUND',
      timestamp: daysAgo(d),
      body: `Acme touchpoint ${i + 1} — demo seed.`,
      assigned_rep_id: 'rep_01',
      ...(isCall
        ? {
            rep_talk_pct: 48 + (i % 3) * 5,
            client_talk_pct: 52 - (i % 3) * 5,
            call_outcome: i === 0 ? 'Connected' : 'Left voicemail',
            duration_seconds: 900 + i * 120,
            subject: `Acme call ${i + 1}`,
          }
        : {}),
    });
  });

  return acts;
}

function buildDeals() {
  return [
    {
      hubspot_id: 'deal-acme-1',
      company_hubspot_id: 'hs-demo-acme',
      deal_name: 'Acme Enterprise Renewal Q2',
      stage: 'Negotiation',
      amount: 285000,
      deal_type: 'Renewal',
      assigned_rep_id: 'rep_01',
      close_date: daysAhead(30),
    },
    {
      hubspot_id: 'deal-acme-2',
      company_hubspot_id: 'hs-demo-acme',
      deal_name: 'Acme Add-on Modules',
      stage: 'Closed Won',
      amount: 42000,
      deal_type: 'Expansion',
      assigned_rep_id: 'rep_01',
      close_date: daysAgo(10),
    },
    {
      hubspot_id: 'deal-globex-1',
      company_hubspot_id: 'hs-demo-globex',
      deal_name: 'Globex Platform Expansion',
      stage: 'Proposal',
      amount: 150000,
      deal_type: 'New Business',
      assigned_rep_id: 'rep_02',
      close_date: daysAhead(45),
    },
    {
      hubspot_id: 'deal-initech-1',
      company_hubspot_id: 'hs-demo-initech',
      deal_name: 'Initech Pilot Program',
      stage: 'Qualified',
      amount: 65000,
      deal_type: 'New Business',
      assigned_rep_id: 'rep_03',
      close_date: daysAhead(60),
    },
    {
      hubspot_id: 'deal-umbrella-1',
      company_hubspot_id: 'hs-demo-umbrella',
      deal_name: 'Umbrella Compliance Module',
      stage: 'Prospecting',
      amount: 95000,
      deal_type: 'New Business',
      assigned_rep_id: 'rep_01',
      close_date: daysAhead(90),
    },
    {
      hubspot_id: 'deal-stark-1',
      company_hubspot_id: 'hs-demo-stark',
      deal_name: 'Stark Global Rollout',
      stage: 'Contract Negotiation',
      amount: 420000,
      deal_type: 'New Business',
      assigned_rep_id: 'rep_01',
      close_date: daysAhead(20),
    },
  ];
}

function buildContacts() {
  return [
    {
      hubspot_id: 'contact-acme-1',
      company_hubspot_id: 'hs-demo-acme',
      first_name: 'Jane',
      last_name: 'Buyer',
      email: 'jane.buyer@acme.com',
      title: 'VP Procurement',
    },
    {
      hubspot_id: 'contact-acme-2',
      company_hubspot_id: 'hs-demo-acme',
      first_name: 'John',
      last_name: 'Smith',
      email: 'john.smith@acme.com',
      title: 'Director IT',
    },
    {
      hubspot_id: 'contact-globex-1',
      company_hubspot_id: 'hs-demo-globex',
      first_name: 'Bob',
      last_name: 'Jones',
      email: 'bob.jones@globex.com',
      title: 'CTO',
    },
    {
      hubspot_id: 'contact-initech-1',
      company_hubspot_id: 'hs-demo-initech',
      first_name: 'Sara',
      last_name: 'Lee',
      email: 'sara.lee@initech.com',
      title: 'Head of Operations',
    },
    {
      hubspot_id: 'contact-umbrella-1',
      company_hubspot_id: 'hs-demo-umbrella',
      first_name: 'Alice',
      last_name: 'Wong',
      email: 'alice.wong@umbrella.com',
      title: 'CFO',
    },
    {
      hubspot_id: 'contact-stark-1',
      company_hubspot_id: 'hs-demo-stark',
      first_name: 'Tony',
      last_name: 'Stark',
      email: 'tony@stark.com',
      title: 'CEO',
    },
  ];
}

const SUPPLEMENTARY_BY_ID: Record<string, { ai_risk_score: number; ai_risk_label: string; notes: string; manager_note: string }> = {
  'hs-demo-acme': {
    ai_risk_score: 28,
    ai_risk_label: 'Low',
    notes: 'Strong engagement — renewal on track.',
    manager_note: 'Focus on renewal timeline',
  },
  'hs-demo-globex': {
    ai_risk_score: 41,
    ai_risk_label: 'Medium',
    notes: 'Expansion workshop completed; proposal pending.',
    manager_note: '',
  },
  'hs-demo-initech': {
    ai_risk_score: 62,
    ai_risk_label: 'High',
    notes: 'Pilot stalled — needs exec sponsor.',
    manager_note: 'Escalate to VP Sales',
  },
  'hs-demo-umbrella': {
    ai_risk_score: 78,
    ai_risk_label: 'High',
    notes: 'No engagement in 21+ days — churn risk.',
    manager_note: 'Schedule re-engagement call',
  },
  'hs-demo-stark': {
    ai_risk_score: 22,
    ai_risk_label: 'Low',
    notes: 'Enterprise rollout progressing.',
    manager_note: '',
  },
};

function buildSupplementary() {
  return COMPANIES.map((c) => {
    const s = SUPPLEMENTARY_BY_ID[c.hubspot_id];
    return {
      company_hubspot_id: c.hubspot_id,
      ai_risk_score: s.ai_risk_score,
      ai_risk_label: s.ai_risk_label,
      notes: s.notes,
      manager_note: s.manager_note,
    };
  });
}

function buildTodos() {
  return [
    {
      id: 'todo-acme-open',
      company_hubspot_id: 'hs-demo-acme',
      type: 'todo',
      content: 'Send revised MSA to legal',
      completed: false,
      created_by_role: 'rep',
      created_at: daysAgo(1),
    },
    {
      id: 'todo-acme-done',
      company_hubspot_id: 'hs-demo-acme',
      type: 'todo',
      content: 'Schedule exec sponsor call',
      completed: true,
      completed_at: daysAgo(2),
      created_by_role: 'rep',
      created_at: daysAgo(3),
    },
    {
      id: 'note-acme-1',
      company_hubspot_id: 'hs-demo-acme',
      type: 'note',
      content: 'Exec sponsor wants ROI deck before renewal.',
      completed: false,
      created_by_role: 'manager',
      created_at: daysAgo(4),
    },
    {
      id: 'todo-globex-1',
      company_hubspot_id: 'hs-demo-globex',
      type: 'todo',
      content: 'Share ROI calculator',
      completed: false,
      created_by_role: 'rep',
      created_at: daysAgo(2),
    },
    {
      id: 'todo-initech-1',
      company_hubspot_id: 'hs-demo-initech',
      type: 'todo',
      content: 'Confirm pilot success criteria',
      completed: false,
      created_by_role: 'rep',
      created_at: daysAgo(1),
    },
    {
      id: 'todo-umbrella-1',
      company_hubspot_id: 'hs-demo-umbrella',
      type: 'todo',
      content: 'Re-engage CFO — no reply 25 days',
      completed: false,
      created_by_role: 'manager',
      created_at: daysAgo(0),
    },
  ];
}

function buildAiBriefsCache() {
  return [
    {
      id: randomUUID(),
      company_hubspot_id: 'hs-demo-acme',
      board_slug: 'demo',
      brief_json: {
        headline: 'Renewal on track with active engagement',
        risk_level: 'low',
        key_points: ['8 touchpoints in 21 days', 'Open Renewal deal in Negotiation'],
      },
      generated_at: daysAgo(2),
    },
  ];
}

function buildPreferences() {
  return [
    {
      id: 'pref-rep-demo',
      session_role: 'rep',
      board_id: 'board-demo-001',
      active_tab_id: '1',
      sort_field: 'exit_arr',
      sort_dir: 'desc',
      page_size: 25,
      updated_at: daysAgo(0),
    },
    {
      id: 'pref-manager-demo',
      session_role: 'manager',
      board_id: 'board-demo-001',
      active_tab_id: '1',
      updated_at: daysAgo(1),
    },
    {
      id: 'pref-admin-commercial',
      session_role: 'admin',
      board_id: 'board-commercial-001',
      updated_at: daysAgo(3),
    },
  ];
}

/** Quick reference returned by POST /test/seed */
export function m05SeedManifest() {
  return {
    boards: [
      { slug: 'demo', url: 'http://localhost:5179/board/demo', accounts: 4, tabs: ['All Accounts', 'High ARR', 'At Risk'] },
      { slug: 'commercial', url: 'http://localhost:5179/board/commercial', accounts: 1 },
    ],
    accounts: COMPANIES.map((c) => ({
      hubspot_id: c.hubspot_id,
      name: c.name,
      board: c.board,
      exit_arr: c.exit_arr,
      rep: c.assigned_rep_id,
      ai_risk: SUPPLEMENTARY_BY_ID[c.hubspot_id]?.ai_risk_score,
    })),
    highlights: {
      high_arr_tab: 'hs-demo-acme (demo board)',
      at_risk_tab: 'hs-demo-initech, hs-demo-umbrella',
      engagement_gap: 'hs-demo-umbrella (no activity in 21d)',
      renewal_deal: 'deal-acme-1 (Renewal / Negotiation)',
      sparkline_rich: 'hs-demo-acme (8 activities)',
    },
  };
}

export class M05DataStore {
  private tables: Record<string, any[]> = {};

  constructor() {
    this.reset();
  }

  reset() {
    const boardTabs = BOARDS.flatMap((b) => buildTabs(b.board_id));
    const boardColumns = BOARDS.flatMap((b) => buildColumns(b.board_id));

    this.tables = {
      board_config: BOARDS.map((b) => ({ ...b, created_at: daysAgo(30) })),
      board_tabs: boardTabs,
      board_columns: boardColumns,
      crm_companies: COMPANIES.map((c) => ({ ...c })),
      crm_activities: buildActivities(),
      crm_deals: buildDeals(),
      crm_contacts: buildContacts(),
      supplementary_accounts: buildSupplementary(),
      user_board_preferences: buildPreferences(),
      todos_notes: buildTodos(),
      ai_briefs_cache: buildAiBriefsCache(),
      permission_profiles: [
        { id: 'pp-rep', role: 'rep', name: 'Rep', can_edit_board_config: false, can_edit_cells: true },
        { id: 'pp-manager', role: 'manager', name: 'Manager', can_edit_board_config: true, can_edit_cells: true },
        { id: 'pp-admin', role: 'admin', name: 'Admin', can_edit_board_config: true, can_edit_cells: true },
      ],
    };
  }

  table(name: string): any[] {
    if (!this.tables[name]) this.tables[name] = [];
    return this.tables[name];
  }

  clone<T>(row: T): T {
    return JSON.parse(JSON.stringify(row));
  }

  stats() {
    const demoCount = this.tables.crm_companies?.filter((c) => c.board === 'demo').length ?? 0;
    const commercialCount = this.tables.crm_companies?.filter((c) => c.board === 'commercial').length ?? 0;
    return {
      boards: this.tables.board_config?.length ?? 0,
      companies: this.tables.crm_companies?.length ?? 0,
      companies_demo: demoCount,
      companies_commercial: commercialCount,
      deals: this.tables.crm_deals?.length ?? 0,
      contacts: this.tables.crm_contacts?.length ?? 0,
      activities: this.tables.crm_activities?.length ?? 0,
      todos: this.tables.todos_notes?.length ?? 0,
      notes: this.tables.todos_notes?.filter((t) => t.type === 'note').length ?? 0,
      ai_briefs_cached: this.tables.ai_briefs_cache?.length ?? 0,
    };
  }
}

export const m05DataStore = new M05DataStore();
