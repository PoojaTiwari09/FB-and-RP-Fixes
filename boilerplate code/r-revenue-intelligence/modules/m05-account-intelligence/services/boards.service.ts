import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { getSupabase } from '../config/supabase';

@Injectable()
export class BoardsService {
  private supabase = getSupabase();

  private readonly COLUMN_TYPES: Record<string, string> = {
    name: 'system',
    exit_arr: 'system',
    contacts_count: 'crm',
    activity_timeline: 'ai',
    last_activity_date: 'crm',
    manager_note: 'crm',
    open_deals_summary: 'crm',
    renewal_date: 'crm',
    employee_count: 'crm',
  };

  async getAllBoards() {
    // Fetch board configs
    const { data: boards, error: boardError } = await this.supabase
      .from('board_config')
      .select('*')
      .order('created_at', { ascending: true });

    if (boardError) throw new Error(boardError.message);

    // Fetch all tabs
    const { data: tabs, error: tabError } = await this.supabase
      .from('board_tabs')
      .select('*')
      .order('order', { ascending: true });

    if (tabError) throw new Error(tabError.message);

    // Fetch all columns
    const { data: columns, error: colError } = await this.supabase
      .from('board_columns')
      .select('*')
      .order('order', { ascending: true });

    if (colError) throw new Error(colError.message);

    // Assemble response
    return (boards || []).map((board) => ({
      id: board.board_id,
      name: board.name,
      slug: board.slug,
      description: board.description,
      default_sort_field: board.default_sort_field,
      default_sort_dir: board.default_sort_dir,
      date_filter_enabled: board.date_filter_enabled,
      ai_briefs_enabled: board.ai_briefs_enabled,
      brief_type: board.brief_type || 'full',
      brief_period_days: board.brief_period_days ?? 30,
      aggregation_method: board.aggregation_method || 'count',
      created_by_user_id: board.created_by_user_id || null,
      date_filter_field: board.date_filter_field || 'activity_date',
      tabs: (tabs || [])
        .filter((t) => t.board_id === board.board_id)
        .map((t) => ({
          id: t.tab_id,
          label: t.label,
          order: t.order,
          is_default: t.is_default,
          filter_logic: t.filter_logic,
        })),
      columns: (columns || [])
        .filter((c) => c.board_id === board.board_id)
        .map((c) => ({
          id: c.col_id ?? c.column_id,
          field_key: c.field_key,
          label: c.label,
          order: c.order,
          width: c.width,
          sortable: c.sortable ?? true,
          editable: c.editable ?? false,
          visible_to_roles: c.visible_to_roles ?? ['rep', 'manager', 'admin'],
          column_type: c.column_type || this.COLUMN_TYPES[c.field_key] || 'crm',
        })),
    }));
  }

  async getBoardBySlug(slug: string) {
    const boards = await this.getAllBoards();
    return boards.find((b) => b.slug === slug) || null;
  }

  async getPermissions(role: string) {
    const { data, error } = await this.supabase
      .from('permission_profiles')
      .select('*')
      .eq('role', role)
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  async getTeam() {
    // Read from seed data — team is not stored in Supabase
    // In production this would come from a users table
    return [
      { id: 'rep_01', name: 'Sarah Mitchell', role: 'rep', title: 'Account Executive' },
      { id: 'rep_02', name: 'James Torres', role: 'rep', title: 'Senior Account Executive' },
      { id: 'rep_03', name: 'Priya Nair', role: 'rep', title: 'Account Executive' },
      { id: 'manager_01', name: 'Alan Clayborn', role: 'manager', title: 'Sales Manager' },
    ];
  }

  async updateBoard(slug: string, data: any) {
    const VALID_SORT_FIELDS = ['name', 'exit_arr', 'last_activity_date', 'employee_count'];

    // Validate sort field if provided
    if (data.default_sort_field && !VALID_SORT_FIELDS.includes(data.default_sort_field)) {
      throw new BadRequestException(
        `default_sort_field must be one of: ${VALID_SORT_FIELDS.join(', ')}`,
      );
    }

    // Verify board exists
    const { data: existing, error: findErr } = await this.supabase
      .from('board_config')
      .select('board_id')
      .eq('slug', slug)
      .single();
    if (findErr || !existing) throw new NotFoundException(`Board '${slug}' not found`);

    // Build update payload — only set defined fields
    const patch: Record<string, any> = { updated_at: new Date().toISOString() };
    if (data.name !== undefined) patch.name = data.name;
    if (data.description !== undefined) patch.description = data.description;
    if (data.date_filter_enabled !== undefined) patch.date_filter_enabled = data.date_filter_enabled;
    if (data.ai_briefs_enabled !== undefined) patch.ai_briefs_enabled = data.ai_briefs_enabled;
    if (data.default_sort_field !== undefined) patch.default_sort_field = data.default_sort_field;
    if (data.default_sort_dir !== undefined) patch.default_sort_dir = data.default_sort_dir;

    const VALID_AGG = ['count', 'arr_sum'];
    if (data.aggregation_method !== undefined) {
      if (!VALID_AGG.includes(data.aggregation_method))
        throw new BadRequestException(`aggregation_method must be one of: ${VALID_AGG.join(', ')}`);
      patch.aggregation_method = data.aggregation_method;
    }
    if (data.created_by_user_id !== undefined) patch.created_by_user_id = data.created_by_user_id;

    const VALID_DATE_FIELDS = ['activity_date', 'renewal_date', 'close_date', 'created_at'];
    if (data.date_filter_field !== undefined) {
      if (!VALID_DATE_FIELDS.includes(data.date_filter_field))
        throw new BadRequestException(`date_filter_field must be one of: ${VALID_DATE_FIELDS.join(', ')}`);
      patch.date_filter_field = data.date_filter_field;
    }

    const { error: configError } = await this.supabase
      .from('board_config')
      .update(patch)
      .eq('slug', slug);
    if (configError) throw new Error(configError.message);

    // If tabs provided, upsert them
    if (data.tabs) {
      for (const tab of data.tabs) {
        await this.supabase.from('board_tabs').upsert({
          tab_id: tab.id,
          board_id: tab.board_id,
          label: tab.label,
          order: tab.order,
          filter_logic: tab.filter_logic,
          is_default: tab.is_default,
        }, { onConflict: 'tab_id' });
      }
    }

    // If columns provided, upsert them
    if (data.columns) {
      for (const col of data.columns) {
        await this.supabase.from('board_columns').upsert({
          col_id: col.id,
          board_id: col.board_id,
          field_key: col.field_key,
          label: col.label,
          order: col.order,
          width: col.width,
          sortable: col.sortable,
          editable: col.editable,
          visible_to_roles: col.visible_to_roles,
        }, { onConflict: 'col_id' });
      }
    }

    return this.getBoardBySlug(slug);
  }

  async duplicateBoard(slug: string) {
    // Fetch original board
    const { data: original, error: fetchErr } = await this.supabase
      .from('board_config')
      .select('*')
      .eq('slug', slug)
      .single();
    if (fetchErr || !original) throw new NotFoundException(`Board '${slug}' not found`);

    // Fetch original tabs & columns
    const { data: origTabs } = await this.supabase
      .from('board_tabs')
      .select('*')
      .eq('board_id', original.board_id)
      .order('order', { ascending: true });

    const { data: origCols } = await this.supabase
      .from('board_columns')
      .select('*')
      .eq('board_id', original.board_id)
      .order('order', { ascending: true });

    // Generate new IDs
    const newBoardId = `board_${Date.now()}`;
    const baseSlug = `${original.slug}-copy`;
    // Ensure unique slug
    const { data: slugCheck } = await this.supabase
      .from('board_config')
      .select('slug')
      .like('slug', `${baseSlug}%`);
    const existingSlugs = (slugCheck || []).map((r: any) => r.slug);
    let newSlug = baseSlug;
    let counter = 2;
    while (existingSlugs.includes(newSlug)) {
      newSlug = `${baseSlug}-${counter++}`;
    }

    const now = new Date().toISOString();

    // Insert new board_config
    const { error: insertErr } = await this.supabase.from('board_config').insert({
      board_id: newBoardId,
      name: `${original.name} (Copy)`,
      slug: newSlug,
      description: original.description,
      default_sort_field: original.default_sort_field,
      default_sort_dir: original.default_sort_dir,
      date_filter_enabled: original.date_filter_enabled,
      ai_briefs_enabled: original.ai_briefs_enabled,
      brief_type: original.brief_type || 'full',
      brief_period_days: original.brief_period_days ?? 30,
      aggregation_method: original.aggregation_method || 'count',
      created_by_user_id: original.created_by_user_id || null,
      parent_board_slug: original.slug,   // ← resolves company pool from source board
      created_at: now,
      updated_at: now,
    });
    if (insertErr) throw new Error(insertErr.message);

    // Copy tabs
    if (origTabs && origTabs.length > 0) {
      const newTabs = origTabs.map((t: any) => ({
        tab_id: `tab_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        board_id: newBoardId,
        label: t.label,
        order: t.order,
        is_default: t.is_default,
        filter_logic: t.filter_logic,
      }));
      const { error: tabErr } = await this.supabase.from('board_tabs').insert(newTabs);
      if (tabErr) throw new Error(tabErr.message);
    }

    // Copy columns
    if (origCols && origCols.length > 0) {
      const newCols = origCols.map((c: any) => ({
        col_id: `col_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        board_id: newBoardId,
        field_key: c.field_key,
        label: c.label,
        order: c.order,
        width: c.width,
        sortable: c.sortable,
        editable: c.editable,
        visible_to_roles: c.visible_to_roles,
      }));
      const { error: colErr } = await this.supabase.from('board_columns').insert(newCols);
      if (colErr) throw new Error(colErr.message);
    }

    return this.getBoardBySlug(newSlug);
  }

  async deleteBoard(slug: string) {
    // Fetch the board to get board_id
    const { data: board, error: fetchErr } = await this.supabase
      .from('board_config')
      .select('board_id')
      .eq('slug', slug)
      .single();
    if (fetchErr || !board) throw new NotFoundException(`Board '${slug}' not found`);

    const boardId = board.board_id;

    // Cascade: delete columns → tabs → config
    const { error: colErr } = await this.supabase
      .from('board_columns')
      .delete()
      .eq('board_id', boardId);
    if (colErr) throw new Error(colErr.message);

    const { error: tabErr } = await this.supabase
      .from('board_tabs')
      .delete()
      .eq('board_id', boardId);
    if (tabErr) throw new Error(tabErr.message);

    const { error: cfgErr } = await this.supabase
      .from('board_config')
      .delete()
      .eq('board_id', boardId);
    if (cfgErr) throw new Error(cfgErr.message);

    return { success: true, deleted_slug: slug };
  }

  // ── 3A. Board Creation Wizard ────────────────────────────────────────
  /**
   * Multi-step board creation.
   * Steps 1–3: validate only, return errors.
   * Step 4: validate + atomically write board_config, board_tabs, board_columns.
   */
  async createBoard(step: number, data: any) {
    switch (step) {
      case 1: return this.validateStep1(data);
      case 2: return this.validateStep2(data);
      case 3: return this.validateStep3(data);
      case 4: return this.finalizeBoard(data);
      default:
        throw new BadRequestException('step must be 1, 2, 3, or 4');
    }
  }

  private validateStep1(data: any) {
    const errors: string[] = [];
    if (!data.name || !data.name.trim()) errors.push('name is required');
    if (data.name && data.name.trim().length > 80) errors.push('name must be ≤ 80 characters');
    const validAgg = ['count', 'arr_sum'];
    if (!data.aggregation_method || !validAgg.includes(data.aggregation_method)) {
      errors.push(`aggregation_method must be one of: ${validAgg.join(', ')}`);
    }
    if (errors.length) throw new BadRequestException({ step: 1, errors });
    return { step: 1, valid: true };
  }

  private validateStep2(data: any) {
    const errors: string[] = [];
    if (!data.tabs || !Array.isArray(data.tabs) || data.tabs.length === 0) {
      errors.push('at least 1 tab is required');
    } else {
      if (data.tabs.length > 8) errors.push('maximum 8 tabs allowed');
      data.tabs.forEach((tab: any, i: number) => {
        if (!tab.label || !tab.label.trim()) errors.push(`tab[${i}].label is required`);
      });
    }
    if (errors.length) throw new BadRequestException({ step: 2, errors });
    return { step: 2, valid: true };
  }

  private validateStep3(data: any) {
    const errors: string[] = [];
    const AVAILABLE_FIELDS = [
      'name', 'exit_arr', 'contacts_count', 'activity_timeline',
      'last_activity_date', 'manager_note', 'open_deals_summary',
      'renewal_date', 'employee_count',
    ];
    if (!data.columns || !Array.isArray(data.columns) || data.columns.length === 0) {
      errors.push('at least 1 column is required');
    } else {
      if (data.columns.length > 15) errors.push('maximum 15 columns allowed');
      const hasName = data.columns.some((c: any) => c.field_key === 'name');
      const hasArr = data.columns.some((c: any) => c.field_key === 'exit_arr');
      if (!hasName) errors.push('"name" column is required');
      if (!hasArr) errors.push('"exit_arr" column is required');
      data.columns.forEach((col: any, i: number) => {
        if (!col.field_key) errors.push(`columns[${i}].field_key is required`);
        else if (!AVAILABLE_FIELDS.includes(col.field_key)) {
          errors.push(`columns[${i}].field_key "${col.field_key}" is not a valid field`);
        }
      });
    }
    if (errors.length) throw new BadRequestException({ step: 3, errors });
    return { step: 3, valid: true };
  }

  private async finalizeBoard(data: any) {
    // Validate all steps
    this.validateStep1(data);
    this.validateStep2(data);
    this.validateStep3(data);

    // Generate slug from name (lowercase, replace spaces/special chars with hyphens)
    const baseSlug = data.name.trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    // Ensure unique slug
    const { data: slugCheck } = await this.supabase
      .from('board_config')
      .select('slug')
      .like('slug', `${baseSlug}%`);
    const existingSlugs = (slugCheck || []).map((r: any) => r.slug);
    let newSlug = baseSlug;
    let counter = 2;
    while (existingSlugs.includes(newSlug)) {
      newSlug = `${baseSlug}-${counter++}`;
    }

    const newBoardId = `board_${Date.now()}`;
    const now = new Date().toISOString();

    // Insert board_config
    const { error: cfgErr } = await this.supabase.from('board_config').insert({
      board_id: newBoardId,
      name: data.name.trim(),
      slug: newSlug,
      description: data.description?.trim() || '',
      default_sort_field: 'exit_arr',
      default_sort_dir: 'desc',
      date_filter_enabled: true,
      ai_briefs_enabled: data.ai_briefs_enabled ?? true,
      aggregation_method: data.aggregation_method,
      created_by_user_id: data.created_by_user_id || null,
      date_filter_field: data.date_filter_field || 'activity_date',
      parent_board_slug: data.parent_board_slug || null,
      created_at: now,
      updated_at: now,
    });
    if (cfgErr) throw new Error(cfgErr.message);

    // Insert tabs
    if (data.tabs && data.tabs.length > 0) {
      const tabRows = data.tabs.map((tab: any, i: number) => ({
        tab_id: `tab_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        board_id: newBoardId,
        label: tab.label.trim(),
        order: i,
        is_default: i === 0,
        filter_logic: tab.filter_logic || { operator: 'AND', conditions: [] },
      }));
      const { error: tabErr } = await this.supabase.from('board_tabs').insert(tabRows);
      if (tabErr) throw new Error(tabErr.message);
    }

    // Insert columns
    if (data.columns && data.columns.length > 0) {
      const SYSTEM_FIELDS: Record<string, Partial<any>> = {
        name: { label: 'Account', width: 220, sortable: true, editable: false },
        exit_arr: { label: 'ARR', width: 110, sortable: true, editable: false },
        contacts_count: { label: 'Contacts', width: 90, sortable: false, editable: false },
        activity_timeline: { label: 'Activity', width: 160, sortable: false, editable: false },
        last_activity_date: { label: 'Last Activity', width: 130, sortable: true, editable: false },
        manager_note: { label: 'Note', width: 180, sortable: false, editable: true },
        open_deals_summary: { label: 'Open Deals', width: 120, sortable: false, editable: false },
        renewal_date: { label: 'Renewal', width: 110, sortable: true, editable: false },
        employee_count: { label: 'Employees', width: 100, sortable: true, editable: false },
      };

      const colRows = data.columns.map((col: any, i: number) => {
        const defaults = SYSTEM_FIELDS[col.field_key] || {};
        return {
          col_id: `col_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
          board_id: newBoardId,
          field_key: col.field_key,
          label: col.label || defaults.label || col.field_key,
          order: i,
          width: col.width || defaults.width || 120,
          sortable: col.sortable ?? defaults.sortable ?? false,
          editable: col.editable ?? defaults.editable ?? false,
          visible_to_roles: col.visible_to_roles || ['rep', 'manager', 'admin'],
          column_type: col.column_type || this.COLUMN_TYPES[col.field_key] || 'crm',
        };
      });
      const { error: colErr } = await this.supabase.from('board_columns').insert(colRows);
      if (colErr) throw new Error(colErr.message);
    }

    return this.getBoardBySlug(newSlug);
  }

  // ── 3B. Column Configuration API ────────────────────────────────────

  async addColumn(slug: string, col: any) {
    const MAX_COLUMNS = 15;

    // Get board
    const { data: board, error: boardErr } = await this.supabase
      .from('board_config')
      .select('board_id')
      .eq('slug', slug)
      .single();
    if (boardErr || !board) throw new NotFoundException(`Board '${slug}' not found`);

    // Count existing columns
    const { count } = await this.supabase
      .from('board_columns')
      .select('col_id', { count: 'exact', head: true })
      .eq('board_id', board.board_id);

    if ((count || 0) >= MAX_COLUMNS) {
      throw new BadRequestException(`Maximum ${MAX_COLUMNS} columns per board allowed`);
    }

    // Validate field_key
    const AVAILABLE_FIELDS = [
      'name', 'exit_arr', 'contacts_count', 'activity_timeline',
      'last_activity_date', 'manager_note', 'open_deals_summary',
      'renewal_date', 'employee_count',
    ];
    if (!col.field_key || !AVAILABLE_FIELDS.includes(col.field_key)) {
      throw new BadRequestException(`field_key must be one of: ${AVAILABLE_FIELDS.join(', ')}`);
    }

    // Get next order
    const { data: existing } = await this.supabase
      .from('board_columns')
      .select('order')
      .eq('board_id', board.board_id)
      .order('order', { ascending: false })
      .limit(1);
    const nextOrder = existing && existing.length > 0 ? existing[0].order + 1 : 0;

    const inferredType = col.column_type || this.COLUMN_TYPES[col.field_key] || 'crm';
    if (inferredType === 'system') {
      throw new BadRequestException(
        `"${col.field_key}" is a system column and is always present — it cannot be added manually`
      );
    }

    const newCol = {
      col_id: `col_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      board_id: board.board_id,
      field_key: col.field_key,
      label: col.label || col.field_key,
      order: nextOrder,
      width: col.width || 120,
      sortable: col.sortable ?? false,
      editable: col.editable ?? false,
      visible_to_roles: col.visible_to_roles || ['rep', 'manager', 'admin'],
      column_type: inferredType,
    };

    const { error } = await this.supabase.from('board_columns').insert(newCol);
    if (error) throw new Error(error.message);

    return newCol;
  }

  async updateColumn(slug: string, colId: string, updates: any) {
    // Validate board exists
    const { data: board } = await this.supabase
      .from('board_config')
      .select('board_id')
      .eq('slug', slug)
      .single();
    if (!board) throw new NotFoundException(`Board '${slug}' not found`);

    // Validate column belongs to board
    const { data: col } = await this.supabase
      .from('board_columns')
      .select('col_id, field_key')
      .eq('col_id', colId)
      .eq('board_id', board.board_id)
      .single();
    if (!col) throw new NotFoundException(`Column '${colId}' not found on board '${slug}'`);

    // Only allow updating safe fields
    const patch: Record<string, any> = {};
    if (updates.label !== undefined) patch.label = updates.label;
    if (updates.display_order !== undefined) patch.order = updates.display_order;
    if (updates.visible_to_roles !== undefined) patch.visible_to_roles = updates.visible_to_roles;
    if (updates.width !== undefined) patch.width = updates.width;

    const { error } = await this.supabase
      .from('board_columns')
      .update(patch)
      .eq('col_id', colId);
    if (error) throw new Error(error.message);

    return { col_id: colId, ...patch };
  }

  async deleteColumn(slug: string, colId: string) {
    const PROTECTED_FIELDS = ['name', 'exit_arr'];

    const { data: board } = await this.supabase
      .from('board_config')
      .select('board_id')
      .eq('slug', slug)
      .single();
    if (!board) throw new NotFoundException(`Board '${slug}' not found`);

    const { data: col } = await this.supabase
      .from('board_columns')
      .select('col_id, field_key')
      .eq('col_id', colId)
      .eq('board_id', board.board_id)
      .single();
    if (!col) throw new NotFoundException(`Column '${colId}' not found on board '${slug}'`);

    if (PROTECTED_FIELDS.includes(col.field_key)) {
      throw new BadRequestException(`Cannot remove the "${col.field_key}" column — it is required on all boards`);
    }

    const { error } = await this.supabase
      .from('board_columns')
      .delete()
      .eq('col_id', colId);
    if (error) throw new Error(error.message);

    return { success: true, deleted_col_id: colId };
  }

  // ── 4A. Brief Config (BF-04) ─────────────────────────────────────────
  async updateBriefConfig(slug: string, config: {
    ai_briefs_enabled?: boolean;
    brief_type?: string;
    brief_period_days?: number;
  }) {
    const VALID_BRIEF_TYPES = ['full', 'summary', 'risk_only'];
    const VALID_PERIODS = [7, 30, 60, 90];

    const { data: board } = await this.supabase
      .from('board_config')
      .select('board_id')
      .eq('slug', slug)
      .single();
    if (!board) throw new NotFoundException(`Board '${slug}' not found`);

    const patch: Record<string, any> = { updated_at: new Date().toISOString() };

    if (config.ai_briefs_enabled !== undefined) {
      patch.ai_briefs_enabled = config.ai_briefs_enabled;
    }
    if (config.brief_type !== undefined) {
      if (!VALID_BRIEF_TYPES.includes(config.brief_type)) {
        throw new BadRequestException(`brief_type must be one of: ${VALID_BRIEF_TYPES.join(', ')}`);
      }
      patch.brief_type = config.brief_type;
    }
    if (config.brief_period_days !== undefined) {
      if (!VALID_PERIODS.includes(config.brief_period_days)) {
        throw new BadRequestException(`brief_period_days must be one of: ${VALID_PERIODS.join(', ')}`);
      }
      patch.brief_period_days = config.brief_period_days;
    }

    const { error } = await this.supabase
      .from('board_config')
      .update(patch)
      .eq('slug', slug);
    if (error) throw new Error(error.message);

    return this.getBoardBySlug(slug);
  }
}
