import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class BoardsService {
  constructor(private readonly prisma: PrismaService) {}

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
    const boards = await this.prisma.m05BoardConfig.findMany({
      orderBy: { created_at: 'asc' },
    });

    const tabs = await this.prisma.m05BoardTab.findMany({
      orderBy: { order: 'asc' },
    });

    const columns = await this.prisma.m05BoardColumn.findMany({
      orderBy: { order: 'asc' },
    });

    return boards.map((board) => ({
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
      tabs: tabs
        .filter((t) => t.board_id === board.board_id)
        .map((t) => ({
          id: t.tab_id.replace(board.board_id + '_', ''), // Strip prefix
          label: t.label,
          order: t.order,
          is_default: t.is_default,
          filter_logic: t.filter_logic,
        })),
      columns: columns
        .filter((c) => c.board_id === board.board_id)
        .map((c) => ({
          id: c.col_id.replace(board.board_id + '_', ''),
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
    const data = await this.prisma.m05PermissionProfile.findUnique({
      where: { role },
    });
    if (!data) throw new Error('Permissions not found');
    return data;
  }

  async getTeam() {
    return [
      { id: 'rep_01', name: 'Sarah Mitchell', role: 'rep', title: 'Account Executive' },
      { id: 'rep_02', name: 'James Torres', role: 'rep', title: 'Senior Account Executive' },
      { id: 'rep_03', name: 'Priya Nair', role: 'rep', title: 'Account Executive' },
      { id: 'manager_01', name: 'Alan Clayborn', role: 'manager', title: 'Sales Manager' },
    ];
  }

  async updateBoard(slug: string, data: any) {
    const VALID_SORT_FIELDS = ['name', 'exit_arr', 'last_activity_date', 'employee_count'];

    if (data.default_sort_field && !VALID_SORT_FIELDS.includes(data.default_sort_field)) {
      throw new BadRequestException(`default_sort_field must be one of: ${VALID_SORT_FIELDS.join(', ')}`);
    }

    const existing = await this.prisma.m05BoardConfig.findUnique({
      where: { slug },
      select: { board_id: true }
    });
    if (!existing) throw new NotFoundException(`Board '${slug}' not found`);

    const patch: any = { updated_at: new Date() };
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

    await this.prisma.m05BoardConfig.update({
      where: { slug },
      data: patch,
    });

    if (data.tabs) {
      for (const tab of data.tabs) {
        await this.prisma.m05BoardTab.upsert({
          where: { tab_id: `${tab.board_id}_${tab.id}` },
          create: {
            tab_id: `${tab.board_id}_${tab.id}`,
            board_id: tab.board_id,
            label: tab.label,
            order: tab.order,
            filter_logic: tab.filter_logic,
            is_default: tab.is_default,
          },
          update: {
            label: tab.label,
            order: tab.order,
            filter_logic: tab.filter_logic,
            is_default: tab.is_default,
          }
        });
      }
    }

    if (data.columns) {
      for (const col of data.columns) {
        await this.prisma.m05BoardColumn.upsert({
          where: { col_id: `${col.board_id}_${col.id}` },
          create: {
            col_id: `${col.board_id}_${col.id}`,
            board_id: col.board_id,
            field_key: col.field_key,
            label: col.label,
            order: col.order,
            width: col.width,
            sortable: col.sortable,
            editable: col.editable,
            visible_to_roles: col.visible_to_roles,
          },
          update: {
            field_key: col.field_key,
            label: col.label,
            order: col.order,
            width: col.width,
            sortable: col.sortable,
            editable: col.editable,
            visible_to_roles: col.visible_to_roles,
          }
        });
      }
    }

    return this.getBoardBySlug(slug);
  }

  async duplicateBoard(slug: string) {
    try {
      const original = await this.prisma.m05BoardConfig.findUnique({ where: { slug } });
      if (!original) throw new NotFoundException(`Board '${slug}' not found`);

      const origTabs = await this.prisma.m05BoardTab.findMany({
        where: { board_id: original.board_id },
        orderBy: { order: 'asc' }
      });

      const origCols = await this.prisma.m05BoardColumn.findMany({
        where: { board_id: original.board_id },
        orderBy: { order: 'asc' }
      });

      const newBoardId = `board_${Date.now()}`;
      const baseSlug = `${original.slug}-copy`;
      
      const slugCheck = await this.prisma.m05BoardConfig.findMany({ select: { slug: true } });
      const existingSlugs = slugCheck.map(r => r.slug).filter(s => s.startsWith(baseSlug));
      let newSlug = baseSlug;
      let counter = 2;
      while (existingSlugs.includes(newSlug)) {
        newSlug = `${baseSlug}-${counter++}`;
      }

      const now = new Date();

      await this.prisma.m05BoardConfig.create({
        data: {
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
          parent_board_slug: original.slug,
          created_at: now,
          updated_at: now,
        }
      });

      if (origTabs.length > 0) {
        await this.prisma.m05BoardTab.createMany({
          data: origTabs.map(t => ({
            tab_id: `${newBoardId}_tab_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
            board_id: newBoardId,
            label: t.label,
            order: t.order,
            is_default: t.is_default,
            filter_logic: t.filter_logic || {},
          }))
        });
      }

      if (origCols.length > 0) {
        await this.prisma.m05BoardColumn.createMany({
          data: origCols.map(c => ({
            col_id: `${newBoardId}_col_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
            board_id: newBoardId,
            field_key: c.field_key,
            label: c.label,
            order: c.order,
            width: c.width,
            sortable: c.sortable,
            editable: c.editable,
            visible_to_roles: c.visible_to_roles,
          }))
        });
      }

      return this.getBoardBySlug(newSlug);
    } catch (e: any) {
      throw new BadRequestException(`Duplicate Error: ${e.message}`);
    }
  }

  async deleteBoard(slug: string) {
    const board = await this.prisma.m05BoardConfig.findUnique({ where: { slug }, select: { board_id: true } });
    if (!board) throw new NotFoundException(`Board '${slug}' not found`);

    const boardId = board.board_id;

    // Prisma Cascade handles deletion of tabs and columns
    await this.prisma.m05BoardConfig.delete({ where: { board_id: boardId } });

    return { success: true, deleted_slug: slug };
  }

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
      'renewal_date', 'employee_count', 'custom_score'
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
    this.validateStep1(data);
    this.validateStep2(data);
    this.validateStep3(data);

    const baseSlug = data.name.trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    const slugCheck = await this.prisma.m05BoardConfig.findMany({ select: { slug: true } });
    const existingSlugs = slugCheck.map(r => r.slug).filter(s => s.startsWith(baseSlug));
    let newSlug = baseSlug;
    let counter = 2;
    while (existingSlugs.includes(newSlug)) {
      newSlug = `${baseSlug}-${counter++}`;
    }

    const newBoardId = `board_${Date.now()}`;
    const now = new Date();

    await this.prisma.m05BoardConfig.create({
      data: {
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
      }
    });

    if (data.tabs && data.tabs.length > 0) {
      await this.prisma.m05BoardTab.createMany({
        data: data.tabs.map((tab: any, i: number) => ({
          tab_id: `${newBoardId}_tab_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
          board_id: newBoardId,
          label: tab.label.trim(),
          order: i,
          is_default: i === 0,
          filter_logic: tab.filter_logic || {},
        }))
      });
    }

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

      await this.prisma.m05BoardColumn.createMany({
        data: data.columns.map((col: any, i: number) => {
          const defaults = SYSTEM_FIELDS[col.field_key] || {};
          return {
            col_id: `${newBoardId}_col_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
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
        })
      });
    }

    return this.getBoardBySlug(newSlug);
  }

  async addColumn(slug: string, col: any) {
    const MAX_COLUMNS = 15;

    const board = await this.prisma.m05BoardConfig.findUnique({ where: { slug }, select: { board_id: true } });
    if (!board) throw new NotFoundException(`Board '${slug}' not found`);

    const count = await this.prisma.m05BoardColumn.count({ where: { board_id: board.board_id } });
    if (count >= MAX_COLUMNS) {
      throw new BadRequestException(`Maximum ${MAX_COLUMNS} columns per board allowed`);
    }

    const AVAILABLE_FIELDS = [
      'name', 'exit_arr', 'contacts_count', 'activity_timeline',
      'last_activity_date', 'manager_note', 'open_deals_summary',
      'renewal_date', 'employee_count', 'custom_score'
    ];
    if (!col.field_key || !AVAILABLE_FIELDS.includes(col.field_key)) {
      throw new BadRequestException(`field_key must be one of: ${AVAILABLE_FIELDS.join(', ')}`);
    }

    // Prevent duplicate columns
    const alreadyExists = await this.prisma.m05BoardColumn.findFirst({
      where: { board_id: board.board_id, field_key: col.field_key }
    });
    if (alreadyExists) {
      return alreadyExists;
    }

    const existing = await this.prisma.m05BoardColumn.findFirst({
      where: { board_id: board.board_id },
      orderBy: { order: 'desc' }
    });
    const nextOrder = existing ? existing.order + 1 : 0;

    const inferredType = col.column_type || this.COLUMN_TYPES[col.field_key] || 'crm';
    if (inferredType === 'system') {
      throw new BadRequestException(
        `"${col.field_key}" is a system column and is always present — it cannot be added manually`
      );
    }

    const newColId = `${board.board_id}_col_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const newCol = await this.prisma.m05BoardColumn.create({
      data: {
        col_id: newColId,
        board_id: board.board_id,
        field_key: col.field_key,
        label: col.label || col.field_key,
        order: nextOrder,
        width: col.width || 120,
        sortable: col.sortable ?? false,
        editable: col.editable ?? false,
        visible_to_roles: col.visible_to_roles || ['rep', 'manager', 'admin'],
        column_type: inferredType,
      }
    });

    return { ...newCol, col_id: newCol.col_id.replace(board.board_id + '_', '') };
  }

  async updateColumn(slug: string, colId: string, updates: any) {
    const board = await this.prisma.m05BoardConfig.findUnique({ where: { slug }, select: { board_id: true } });
    if (!board) throw new NotFoundException(`Board '${slug}' not found`);

    const realColId = colId.startsWith(board.board_id + '_') ? colId : `${board.board_id}_${colId}`;

    const col = await this.prisma.m05BoardColumn.findUnique({ where: { col_id: realColId } });
    if (!col || col.board_id !== board.board_id) throw new NotFoundException(`Column '${colId}' not found on board '${slug}'`);

    const patch: any = {};
    if (updates.label !== undefined) patch.label = updates.label;
    if (updates.display_order !== undefined) patch.order = updates.display_order;
    if (updates.visible_to_roles !== undefined) patch.visible_to_roles = updates.visible_to_roles;
    if (updates.width !== undefined) patch.width = updates.width;

    await this.prisma.m05BoardColumn.update({
      where: { col_id: realColId },
      data: patch,
    });

    return { col_id: colId, ...patch };
  }

  async deleteColumn(slug: string, colId: string) {
    const PROTECTED_FIELDS = ['name', 'exit_arr'];

    const board = await this.prisma.m05BoardConfig.findUnique({ where: { slug }, select: { board_id: true } });
    if (!board) throw new NotFoundException(`Board '${slug}' not found`);

    const realColId = colId.startsWith(board.board_id + '_') ? colId : `${board.board_id}_${colId}`;
    const col = await this.prisma.m05BoardColumn.findUnique({ where: { col_id: realColId } });
    if (!col || col.board_id !== board.board_id) throw new NotFoundException(`Column '${colId}' not found on board '${slug}'`);

    if (PROTECTED_FIELDS.includes(col.field_key)) {
      throw new BadRequestException(`Cannot remove the "${col.field_key}" column — it is required on all boards`);
    }

    await this.prisma.m05BoardColumn.delete({ where: { col_id: realColId } });

    return { success: true, deleted_col_id: colId };
  }

  async updateBriefConfig(slug: string, config: {
    ai_briefs_enabled?: boolean;
    brief_type?: string;
    brief_period_days?: number;
  }) {
    const VALID_BRIEF_TYPES = ['full', 'summary', 'risk_only'];
    const VALID_PERIODS = [7, 30, 60, 90];

    const board = await this.prisma.m05BoardConfig.findUnique({ where: { slug }, select: { board_id: true } });
    if (!board) throw new NotFoundException(`Board '${slug}' not found`);

    const patch: any = { updated_at: new Date() };

    if (config.ai_briefs_enabled !== undefined) patch.ai_briefs_enabled = config.ai_briefs_enabled;
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

    await this.prisma.m05BoardConfig.update({ where: { slug }, data: patch });

    return this.getBoardBySlug(slug);
  }
}
