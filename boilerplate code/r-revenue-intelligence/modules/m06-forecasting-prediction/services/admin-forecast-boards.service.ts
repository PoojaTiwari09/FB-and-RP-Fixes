import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import {
  CreateBoardDto,
  CreateColumnsFromCrmDto,
  UpdateColumnsDto,
  UpdateColumnDto,
  UpdateColumnVisibilityDto,
  UpdateCrmMappingDto,
  UpdateReminderConfigDto,
  UpdateQuotasDto,
  UpdateBoardDto,
  UpdateStageMappingDto,
  ReorderColumnsDto,
} from '../schemas/admin-forecast-boards.schema';

@Injectable()
export class AdminForecastBoardsService {
  constructor(private readonly prisma: PrismaService) {}

  async getBoards(tenantId: string) {
    return this.prisma.forecastBoard.findMany({
      where: { tenantId },
      orderBy: { updatedAt: 'desc' },
      include: {
        columns: true,
      },
    });
  }

  async getBoard(tenantId: string, boardId: string) {
    const board = await this.prisma.forecastBoard.findUnique({
      where: { id: boardId, tenantId },
      include: {
        columns: { where: { isDeleted: false }, orderBy: { sortOrder: 'asc' } },
        crmMapping: true,
        reminderConfig: true,
        exclusions: true,
      },
    });
    if (!board) throw new NotFoundException('Board not found');
    return board;
  }

  async createBoard(tenantId: string, data: CreateBoardDto) {
    let startDate: any = data.startDate || data.periodStartDate;
    let endDate: any = data.endDate || data.periodEndDate;
    const periodId = data.periodId || data.activePeriod;
    if (periodId && (!startDate || !endDate)) {
      const period = await this.prisma.forecastPeriod.findUnique({
        where: { id: periodId }
      });
      if (period) {
        if (!startDate) startDate = period.startDate;
        if (!endDate) endDate = period.endDate;
      }
    }
    return this.prisma.forecastBoard.create({
      data: {
        tenantId,
        name: data.name,
        scope: data.teamId || data.scope || 'Global Sales Org',
        periodType: data.periodType.toLowerCase() === 'monthly' ? 'Monthly' : 'Quarterly',
        activePeriod: periodId || '',
        periodStartDate: startDate ? new Date(startDate) : null,
        periodEndDate: endDate ? new Date(endDate) : null,
        description: data.description,
        status: 'draft',
      },
    });
  }

  async updateBoard(tenantId: string, boardId: string, data: UpdateBoardDto) {
    const board = await this.getBoard(tenantId, boardId);
    if (data.periodType && board.status !== 'draft') {
      throw new BadRequestException('periodType cannot be changed after activation');
    }
    let startDate: any = data.startDate || data.periodStartDate;
    let endDate: any = data.endDate || data.periodEndDate;
    const periodId = data.periodId || data.activePeriod;
    if (periodId && (!startDate || !endDate)) {
      const period = await this.prisma.forecastPeriod.findUnique({
        where: { id: periodId }
      });
      if (period) {
        if (!startDate) startDate = period.startDate;
        if (!endDate) endDate = period.endDate;
      }
    }
    return this.prisma.forecastBoard.update({
      where: { id: boardId },
      data: {
        name: data.name,
        scope: data.teamId || data.scope,
        periodType: data.periodType ? (data.periodType.toLowerCase() === 'monthly' ? 'Monthly' : 'Quarterly') : undefined,
        activePeriod: periodId,
        periodStartDate: startDate ? new Date(startDate) : undefined,
        periodEndDate: endDate ? new Date(endDate) : undefined,
        description: data.description,
        status: data.status,
      },
    });
  }

  async deleteColumn(tenantId: string, boardId: string, columnId: string) {
    await this.getBoard(tenantId, boardId);
    return this.prisma.boardColumn.update({
      where: { id: columnId },
      data: { isDeleted: true },
    });
  }

  async reorderColumns(tenantId: string, boardId: string, data: ReorderColumnsDto) {
    await this.getBoard(tenantId, boardId);
    return this.prisma.$transaction(
      data.columnIds.map((colId, index) =>
        this.prisma.boardColumn.update({
          where: { id: colId },
          data: { sortOrder: index },
        })
      )
    );
  }

  async updateBoardColumns(tenantId: string, boardId: string, data: UpdateColumnsDto) {
    const board = await this.getBoard(tenantId, boardId);

    return this.prisma.$transaction(async (tx) => {
      await tx.boardColumn.updateMany({
        where: { boardId, tenantId, isDeleted: false },
        data: { isDeleted: true },
      });

      const newColumns = data.columns.map((col) => ({
        boardId,
        tenantId,
        label: col.label,
        type: col.columnType || col.type || 'Metric',
        submissionMode: col.submissionMode,
        isVisible: col.isVisible,
        sortOrder: col.sortOrder,
      }));

      await tx.boardColumn.createMany({
        data: newColumns,
      });

      return tx.forecastBoard.findUnique({
        where: { id: boardId },
        include: { columns: { where: { isDeleted: false }, orderBy: { sortOrder: 'asc' } }, crmMapping: true, reminderConfig: true, exclusions: true },
      });
    });
  }

  async createColumnsFromCrm(tenantId: string, boardId: string, data: CreateColumnsFromCrmDto) {
    const board = await this.getBoard(tenantId, boardId);
    const existingColumns = await this.prisma.boardColumn.findMany({
      where: { boardId, tenantId, isDeleted: false },
      orderBy: { sortOrder: 'asc' },
    });
    const baseSort = existingColumns.length > 0 ? Math.max(...existingColumns.map((col) => col.sortOrder)) : 0;

    const createdColumns = await Promise.all(
      data.fields.map((field, idx) =>
        this.prisma.boardColumn.create({
          data: {
            boardId,
            tenantId,
            label: field.label,
            type: field.columnType,
            submissionMode: field.submissionMode,
            isVisible: true,
            sortOrder: baseSort + idx + 1,
          },
        }),
      ),
    );

    return { columns: createdColumns };
  }

  async updateColumn(tenantId: string, boardId: string, columnId: string, data: UpdateColumnDto) {
    await this.getBoard(tenantId, boardId);
    return this.prisma.boardColumn.update({
      where: { id: columnId },
      data: {
        label: data.label,
        type: data.columnType || data.type,
        submissionMode: data.submissionMode,
        isVisible: data.isVisible,
      },
    });
  }

  async updateColumnVisibility(tenantId: string, boardId: string, columnId: string, data: UpdateColumnVisibilityDto) {
    await this.getBoard(tenantId, boardId);
    return this.prisma.boardColumn.update({
      where: { id: columnId },
      data: {
        isVisible: data.isVisible,
      },
    });
  }

  async updateCrmMapping(tenantId: string, boardId: string, data: UpdateCrmMappingDto) {
    await this.getBoard(tenantId, boardId);

    return this.prisma.boardCrmMapping.upsert({
      where: { boardId },
      create: {
        boardId,
        tenantId,
        crmConnection: data.crmConnection,
        forecastCategoryField: data.forecastCategoryField,
        pipelineSource: data.pipelineSource,
        closedSource: data.closedSource,
        closeDateField: data.closeDateField,
        amountField: data.amountField,
        columnMappings: data.columnMappings || {},
        stageMappings: data.stageMappings || {},
      },
      update: {
        crmConnection: data.crmConnection,
        forecastCategoryField: data.forecastCategoryField,
        pipelineSource: data.pipelineSource,
        closedSource: data.closedSource,
        closeDateField: data.closeDateField,
        amountField: data.amountField,
        columnMappings: data.columnMappings || {},
        stageMappings: data.stageMappings || {},
      },
    });
  }

  async updateReminderConfig(tenantId: string, boardId: string, data: UpdateReminderConfigDto) {
    await this.getBoard(tenantId, boardId);

    return this.prisma.boardReminderConfig.upsert({
      where: { boardId },
      create: {
        boardId,
        tenantId,
        frequency: data.frequency,
        sendDay: data.sendDay,
        sendTime: data.sendTime,
        timezoneBehavior: data.timezoneBehavior,
        inAppEnabled: data.inAppEnabled,
        slackEnabled: data.slackEnabled,
        autoDismiss: data.autoDismiss,
        messageTemplate: data.messageTemplate,
      },
      update: {
        frequency: data.frequency,
        sendDay: data.sendDay,
        sendTime: data.sendTime,
        timezoneBehavior: data.timezoneBehavior,
        inAppEnabled: data.inAppEnabled,
        slackEnabled: data.slackEnabled,
        autoDismiss: data.autoDismiss,
        messageTemplate: data.messageTemplate,
      },
    });
  }

  async updateQuotas(tenantId: string, boardId: string, data: UpdateQuotasDto) {
    // Upsert quotas for the given period
    return this.prisma.$transaction(async (tx) => {
      for (const q of data.quotas) {
        await tx.quota.upsert({
          where: {
            tenantId_periodId_repUserId: {
              tenantId,
              periodId: data.periodId,
              repUserId: q.repUserId,
            }
          },
          create: {
            tenantId,
            periodId: data.periodId,
            repUserId: q.repUserId,
            amount: q.amount,
            aprTarget: q.aprTarget,
            mayTarget: q.mayTarget,
            junTarget: q.junTarget,
          },
          update: {
            amount: q.amount,
            aprTarget: q.aprTarget,
            mayTarget: q.mayTarget,
            junTarget: q.junTarget,
          }
        });
      }
      return { success: true };
    });
  }

  async publishBoard(tenantId: string, boardId: string) {
    const board = await this.getBoard(tenantId, boardId);
    if (board.status === 'active') {
      throw new BadRequestException('Board is already active');
    }

    const hasCommitColumn = board.columns.some(
      (column) => column.type === 'Submission' && column.label.toLowerCase() === 'commit',
    );
    if (!hasCommitColumn) {
      throw new BadRequestException('Publish checklist failed: a Commit submission column is required');
    }
    if (!board.crmMapping || !board.crmMapping.crmConnection) {
      throw new BadRequestException('Publish checklist failed: CRM connection is required');
    }
    if (!board.periodStartDate || !board.periodEndDate) {
      throw new BadRequestException('Publish checklist failed: period start and end dates must be set');
    }
    
    return this.prisma.forecastBoard.update({
      where: { id: boardId },
      data: {
        status: 'active',
        isPublished: true,
        publishedAt: new Date(),
      },
    });
  }

  async saveDraft(tenantId: string, boardId: string) {
    await this.getBoard(tenantId, boardId);
    const board = await this.prisma.forecastBoard.update({
      where: { id: boardId },
      data: { status: 'draft', isPublished: false },
    });
    return { board: { id: board.id, status: board.status, updatedAt: board.updatedAt } };
  }

  async archiveBoard(tenantId: string, boardId: string) {
    await this.getBoard(tenantId, boardId);
    const board = await this.prisma.forecastBoard.update({
      where: { id: boardId },
      data: { status: 'archived' },
    });
    return { board: { id: board.id, status: board.status } };
  }

  async getCrmFields(tenantId: string, objectType?: string, boardId?: string) {
    // Mock implementation returning available CRM fields
    return {
      object: objectType || 'Opportunity',
      fields: [
        { fieldName: 'Amount', displayLabel: 'Amount', dataType: 'currency' },
        { fieldName: 'CloseDate', displayLabel: 'Close Date', dataType: 'date' },
        { fieldName: 'StageName', displayLabel: 'Stage', dataType: 'picklist' },
        { fieldName: 'IsClosed', displayLabel: 'Closed', dataType: 'boolean' },
        { fieldName: 'IsWon', displayLabel: 'Won', dataType: 'boolean' },
      ],
    };
  }

  async getCrmMapping(tenantId: string, boardId: string) {
    const board = await this.getBoard(tenantId, boardId);
    if (!board.crmMapping) {
      throw new NotFoundException('CRM mapping not found');
    }
    return board.crmMapping;
  }

  async updateStageMapping(tenantId: string, boardId: string, data: UpdateStageMappingDto) {
    await this.getBoard(tenantId, boardId);
    return this.prisma.boardCrmMapping.upsert({
      where: { boardId },
      create: {
        boardId,
        tenantId,
        crmConnection: 'salesforce',
        forecastCategoryField: null,
        pipelineSource: null,
        closedSource: null,
        closeDateField: null,
        amountField: null,
        columnMappings: {},
        stageMappings: data.stageMappings || {},
      },
      update: {
        stageMappings: data.stageMappings || {},
      },
    });
  }

  async importQuotas(tenantId: string, boardId: string, csvContent: string) {
    const board = await this.getBoard(tenantId, boardId);
    const periodId = board.activePeriod;
    if (!periodId) {
      throw new BadRequestException('Board active period is required for quota import');
    }

    const rows = csvContent.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
    if (rows.length < 2) {
      return { imported: 0, skipped: 0, errors: [{ row: 0, reason: 'CSV must include header and at least one row' }] };
    }

    const header = rows[0].split(',').map((h) => h.trim().toLowerCase());
    const requiredColumns = ['repid', 'quarterlytarget'];
    for (const req of requiredColumns) {
      if (!header.includes(req)) {
        return { imported: 0, skipped: 0, errors: [{ row: 0, reason: `Missing required column ${req}` }] };
      }
    }

    const parsedRows = rows.slice(1).map((line, index) => {
      const cols = line.split(',').map((value) => value.trim());
      return { row: index + 2, cols };
    });

    const quotaUpdates: Array<{ row: number; repUserId: string; amount: number; aprTarget?: number | null; mayTarget?: number | null; junTarget?: number | null }> = [];
    const errors: Array<{ row: number; reason: string }> = [];

    const columnIndex: Record<string, number> = {};
    header.forEach((key, index) => {
      columnIndex[key] = index;
    });

    for (const row of parsedRows) {
      const repUserId = row.cols[columnIndex['repid']];
      const amountText = row.cols[columnIndex['quarterlytarget']];
      if (!repUserId) {
        errors.push({ row: row.row, reason: 'repId is required' });
        continue;
      }
      const amount = Number(amountText);
      if (!amountText || Number.isNaN(amount) || amount < 0) {
        errors.push({ row: row.row, reason: 'quarterlyTarget must be a non-negative number' });
        continue;
      }
      const aprTarget = columnIndex['aprtarget'] !== undefined ? Number(row.cols[columnIndex['aprtarget']]) : null;
      const mayTarget = columnIndex['maytarget'] !== undefined ? Number(row.cols[columnIndex['maytarget']]) : null;
      const junTarget = columnIndex['juntarget'] !== undefined ? Number(row.cols[columnIndex['juntarget']]) : null;
      quotaUpdates.push({
        row: row.row,
        repUserId,
        amount,
        aprTarget: Number.isNaN(aprTarget) ? null : aprTarget,
        mayTarget: Number.isNaN(mayTarget) ? null : mayTarget,
        junTarget: Number.isNaN(junTarget) ? null : junTarget,
      });
    }

    const allRepIds = quotaUpdates.map((entry) => entry.repUserId);
    const validReps = await this.prisma.forecastUser.findMany({ where: { tenantId, id: { in: allRepIds } }, select: { id: true } });
    const validRepSet = new Set(validReps.map((rep) => rep.id));

    let imported = 0;
    let skipped = 0;
    const importErrors: Array<{ row: number; reason: string }> = [...errors];

    await this.prisma.$transaction(async (tx) => {
      for (const entry of quotaUpdates) {
        if (!validRepSet.has(entry.repUserId)) {
          skipped += 1;
          importErrors.push({ row: entry.row, reason: `Unknown repId ${entry.repUserId}` });
          continue;
        }
        await tx.quota.upsert({
          where: {
            tenantId_periodId_repUserId: {
              tenantId,
              periodId,
              repUserId: entry.repUserId,
            },
          },
          create: {
            tenantId,
            periodId,
            repUserId: entry.repUserId,
            amount: entry.amount,
            aprTarget: entry.aprTarget,
            mayTarget: entry.mayTarget,
            junTarget: entry.junTarget,
          },
          update: {
            amount: entry.amount,
            aprTarget: entry.aprTarget,
            mayTarget: entry.mayTarget,
            junTarget: entry.junTarget,
          },
        });
        imported += 1;
      }
    });

    return { imported, skipped, errors: importErrors };
  }

  async getPermissions(tenantId: string, boardId: string) {
    const board = await this.getBoard(tenantId, boardId);
    const users = await this.prisma.forecastUser.findMany({ where: { tenantId } });
    const exclusions = new Set(board.exclusions.filter((exclusion) => exclusion.isActive).map((exclusion) => exclusion.repUserId));

    return users.map((u) => ({
      userId: u.id,
      userName: u.name,
      role: u.role,
      accessLevel: u.role === 'admin' ? 'admin' : u.role === 'manager' ? 'manage' : 'view_own',
      isExcluded: exclusions.has(u.id),
    }));
  }

  async autoSubmitPreview(tenantId: string, boardId: string, columnId: string) {
    await this.getBoard(tenantId, boardId);
    
    // Mock implementation
    return {
      columnId,
      computedValues: [
        { repUserId: 'rep-1', repName: 'John Doe', computedValue: 45000 },
        { repUserId: 'rep-2', repName: 'Jane Smith', computedValue: 60000 },
      ],
      warnings: [],
    };
  }
}
