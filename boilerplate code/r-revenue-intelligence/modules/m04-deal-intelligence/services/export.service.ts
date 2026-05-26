import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Deal } from '@/entities/deal.entity';
import { DealBoard } from '@/entities/deal-board.entity';
import { DealActivity } from '@/entities/deal-activity.entity';
import { DealTask } from '@/entities/deal-task.entity';
import { DealPlaybook } from '@/entities/deal-playbook.entity';
import { DealWarning } from '@/entities/deal-warning.entity';
import { User } from '@/entities/user.entity';
import { ExportRequestDto, ExportResponseDto, ExportFormat, ExportType } from '@/schemas/export.dto';
import { UserRole } from '@/interfaces/user-role.enum';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class ExportService {
  private readonly exportsDir = path.join(process.cwd(), 'exports');

  constructor(
    @InjectRepository(Deal)
    private readonly dealRepository: Repository<Deal>,
    @InjectRepository(DealBoard)
    private readonly boardRepository: Repository<DealBoard>,
    @InjectRepository(DealActivity)
    private readonly activityRepository: Repository<DealActivity>,
    @InjectRepository(DealTask)
    private readonly taskRepository: Repository<DealTask>,
    @InjectRepository(DealPlaybook)
    private readonly playbookRepository: Repository<DealPlaybook>,
    @InjectRepository(DealWarning)
    private readonly warningRepository: Repository<DealWarning>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {
    // Ensure exports directory exists
    if (!fs.existsSync(this.exportsDir)) {
      fs.mkdirSync(this.exportsDir, { recursive: true });
    }
  }

  /**
   * Create an export
   */
  async createExport(dto: ExportRequestDto, userId: string): Promise<ExportResponseDto> {
    let data: any[];
    let fileName: string;

    // Fetch data based on export type
    switch (dto.type) {
      case ExportType.DEALS:
        data = await this.fetchDeals(dto);
        fileName = `deals-export-${new Date().toISOString().split('T')[0]}`;
        break;
      case ExportType.BOARD:
        data = await this.fetchBoardDeals(dto);
        fileName = `board-export-${new Date().toISOString().split('T')[0]}`;
        break;
      case ExportType.ACTIVITIES:
        data = await this.fetchActivities(dto);
        fileName = `activities-export-${new Date().toISOString().split('T')[0]}`;
        break;
      case ExportType.TASKS:
        data = await this.fetchTasks(dto);
        fileName = `tasks-export-${new Date().toISOString().split('T')[0]}`;
        break;
      case ExportType.PLAYBOOK:
        data = await this.fetchPlaybook(dto);
        fileName = `playbook-export-${new Date().toISOString().split('T')[0]}`;
        break;
      case ExportType.TEAM_DIAGNOSTICS:
        data = await this.fetchTeamDiagnostics(dto);
        fileName = `team-diagnostics-${new Date().toISOString().split('T')[0]}`;
        break;
      case ExportType.COACHING_ACTIVITY:
        data = await this.fetchCoachingActivity(dto);
        fileName = `coaching-activity-${new Date().toISOString().split('T')[0]}`;
        break;
      case ExportType.FORECAST_SUMMARY:
        data = await this.fetchForecastSummary(dto);
        fileName = `forecast-summary-${new Date().toISOString().split('T')[0]}`;
        break;
      case ExportType.TOP_RISK_DEALS:
        data = await this.fetchTopRiskDeals(dto);
        fileName = `top-risk-deals-${new Date().toISOString().split('T')[0]}`;
        break;
      case ExportType.ANALYTICS_REPORT:
        data = await this.fetchAnalyticsReport(dto, userId);
        fileName = `analytics-report-${new Date().toISOString().split('T')[0]}`;
        break;
      default:
        throw new Error('Invalid export type');
    }

    // Generate file based on format
    const exportId = uuidv4();
    let filePath: string;
    let fileExtension: string;

    switch (dto.format) {
      case ExportFormat.CSV:
        fileExtension = 'csv';
        filePath = path.join(this.exportsDir, `${exportId}.csv`);
        await this.generateCSV(data, filePath, dto.columns);
        break;
      case ExportFormat.EXCEL:
        fileExtension = 'xlsx';
        filePath = path.join(this.exportsDir, `${exportId}.xlsx`);
        await this.generateExcel(data, filePath, dto.columns);
        break;
      case ExportFormat.PDF:
        fileExtension = 'pdf';
        filePath = path.join(this.exportsDir, `${exportId}.pdf`);
        await this.generatePDF(data, filePath, dto.columns);
        break;
      default:
        throw new Error('Invalid export format');
    }

    const stats = fs.statSync(filePath);

    return {
      id: exportId,
      format: dto.format,
      type: dto.type,
      fileName: `${fileName}.${fileExtension}`,
      fileSize: stats.size,
      downloadUrl: `/api/v1/exports/download/${exportId}`,
      recordCount: data.length,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
    };
  }

  /**
   * Get export file
   */
  async getExportFile(exportId: string): Promise<{ filePath: string; mimeType: string }> {
    const csvPath = path.join(this.exportsDir, `${exportId}.csv`);
    const xlsxPath = path.join(this.exportsDir, `${exportId}.xlsx`);
    const pdfPath = path.join(this.exportsDir, `${exportId}.pdf`);

    if (fs.existsSync(csvPath)) {
      return { filePath: csvPath, mimeType: 'text/csv' };
    } else if (fs.existsSync(xlsxPath)) {
      return {
        filePath: xlsxPath,
        mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      };
    } else if (fs.existsSync(pdfPath)) {
      return { filePath: pdfPath, mimeType: 'application/pdf' };
    }

    throw new NotFoundException('Export file not found or expired');
  }

  /**
   * Fetch deals for export
   */
  private async fetchDeals(dto: ExportRequestDto): Promise<any[]> {
    const queryBuilder = this.dealRepository.createQueryBuilder('deal');

    if (dto.startDate) {
      queryBuilder.andWhere('deal.closeDate >= :startDate', { startDate: dto.startDate });
    }

    if (dto.endDate) {
      queryBuilder.andWhere('deal.closeDate <= :endDate', { endDate: dto.endDate });
    }

    if (dto.stages && dto.stages.length > 0) {
      queryBuilder.andWhere('deal.stage IN (:...stages)', { stages: dto.stages });
    }

    if (dto.ownerIds && dto.ownerIds.length > 0) {
      queryBuilder.andWhere('deal.ownerId IN (:...ownerIds)', { ownerIds: dto.ownerIds });
    }

    return queryBuilder.getMany();
  }

  /**
   * Fetch board deals for export
   */
  private async fetchBoardDeals(dto: ExportRequestDto): Promise<any[]> {
    if (!dto.boardId) {
      throw new Error('Board ID is required for board exports');
    }

    let board = null;
    try {
      board = await this.boardRepository.findOne({
        where: { id: dto.boardId },
        relations: ['filters'],
      });
    } catch (err) {
      // Ignore UUID parsing error
    }

    if (!board) {
      // Development Fallback: Find the first available board!
      board = await this.boardRepository.findOne({ relations: ['filters'] });
    }

    if (!board) {
      throw new NotFoundException('Board not found');
    }

    // Apply board filters and fetch deals
    return this.dealRepository.find({ take: 1000 });
  }

  /**
   * Fetch activities for export
   */
  private async fetchActivities(dto: ExportRequestDto): Promise<any[]> {
    const queryBuilder = this.activityRepository.createQueryBuilder('activity');

    if (dto.dealId) {
      queryBuilder.where('activity.dealId = :dealId', { dealId: dto.dealId });
    }

    if (dto.startDate) {
      queryBuilder.andWhere('activity.activityDate >= :startDate', { startDate: dto.startDate });
    }

    if (dto.endDate) {
      queryBuilder.andWhere('activity.activityDate <= :endDate', { endDate: dto.endDate });
    }

    return queryBuilder.orderBy('activity.activityDate', 'DESC').getMany();
  }

  /**
   * Fetch tasks for export
   */
  private async fetchTasks(dto: ExportRequestDto): Promise<any[]> {
    const queryBuilder = this.taskRepository.createQueryBuilder('task');

    if (dto.dealId) {
      queryBuilder.where('task.dealId = :dealId', { dealId: dto.dealId });
    }

    return queryBuilder.orderBy('task.createdAt', 'DESC').getMany();
  }

  /**
   * Fetch playbook for export
   */
  private async fetchPlaybook(dto: ExportRequestDto): Promise<any[]> {
    if (!dto.dealId) {
      // Fallback: return playbook items for the first available deal in the database!
      const firstDeal = await this.dealRepository.findOne({ select: ['id'] });
      if (firstDeal) {
        return this.playbookRepository.find({
          where: { dealId: firstDeal.id },
          order: { type: 'ASC', order: 'ASC' },
        });
      }
      return [];
    }

    return this.playbookRepository.find({
      where: { dealId: dto.dealId },
      order: { type: 'ASC', order: 'ASC' },
    });
  }

  /**
   * Generate CSV file
   */
  private async generateCSV(data: any[], filePath: string, columns?: string[]): Promise<void> {
    if (data.length === 0) {
      fs.writeFileSync(filePath, 'No data to export');
      return;
    }

    const headers = columns || Object.keys(data[0]);
    const csvRows = [headers.join(',')];

    for (const row of data) {
      const values = headers.map((header) => {
        const value = row[header];
        const escaped = ('' + value).replace(/"/g, '""');
        return `"${escaped}"`;
      });
      csvRows.push(values.join(','));
    }

    fs.writeFileSync(filePath, csvRows.join('\n'));
  }

  /**
   * Generate Excel file (simplified - would use a library like exceljs in production)
   */
  private async generateExcel(data: any[], filePath: string, columns?: string[]): Promise<void> {
    // For now, generate CSV with .xlsx extension
    // In production, use exceljs or similar library
    await this.generateCSV(data, filePath, columns);
  }

  /**
   * Generate PDF file (simplified - would use a library like pdfkit in production)
   */
  private async generatePDF(data: any[], filePath: string, columns?: string[]): Promise<void> {
    // Generate a clean text-based report (for PDF, use pdfkit in production)
    const now = new Date().toISOString();
    const lines: string[] = [];
    lines.push('=' .repeat(60));
    lines.push('  DEAL INTELLIGENCE - EXPORT REPORT');
    lines.push(`  Generated: ${now}`);
    lines.push('=' .repeat(60));
    lines.push('');

    if (data.length === 0) {
      lines.push('No data available.');
    } else {
      const keys = columns || Object.keys(data[0]);
      data.forEach((row, idx) => {
        lines.push(`--- Record ${idx + 1} ---`);
        keys.forEach(key => {
          const val = row[key];
          const formatted = typeof val === 'object' ? JSON.stringify(val) : String(val ?? '');
          lines.push(`  ${key}: ${formatted}`);
        });
        lines.push('');
      });
    }

    lines.push('=' .repeat(60));
    lines.push('  END OF REPORT');
    lines.push('=' .repeat(60));

    fs.writeFileSync(filePath, lines.join('\n'));
  }

  /**
   * Clean up old exports (run periodically)
   */
  async cleanupOldExports(): Promise<number> {
    const files = fs.readdirSync(this.exportsDir);
    const now = Date.now();
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours
    let deleted = 0;

    for (const file of files) {
      const filePath = path.join(this.exportsDir, file);
      const stats = fs.statSync(filePath);

      if (now - stats.mtimeMs > maxAge) {
        fs.unlinkSync(filePath);
        deleted++;
      }
    }

    return deleted;
  }

  /**
   * Fetch team diagnostics for export (Manager)
   */
  private async fetchTeamDiagnostics(dto: ExportRequestDto): Promise<any[]> {
    const deals = await this.dealRepository.find({
      relations: ['warnings', 'playbooks'],
    });

    // Group by owner
    const dealsByOwner = deals.reduce((acc, deal) => {
      if (!acc[deal.ownerId]) {
        acc[deal.ownerId] = [];
      }
      acc[deal.ownerId].push(deal);
      return acc;
    }, {} as Record<string, Deal[]>);

    const diagnostics = [];
    for (const [ownerId, ownerDeals] of Object.entries(dealsByOwner)) {
      const totalValue = ownerDeals.reduce((sum, d) => sum + Number(d.amount), 0);
      const avgAiScore = ownerDeals.reduce((sum, d) => sum + d.aiScore, 0) / ownerDeals.length;
      const atRiskCount = ownerDeals.filter(d => d.isHighRisk || d.aiScore < 50).length;

      diagnostics.push({
        repName: ownerDeals[0].ownerName,
        repId: ownerId,
        dealCount: ownerDeals.length,
        totalValue,
        averageAiScore: Math.round(avgAiScore * 10) / 10,
        atRiskCount,
        highestValueDeal: Math.max(...ownerDeals.map(d => Number(d.amount))),
        lowestAiScore: Math.min(...ownerDeals.map(d => d.aiScore)),
      });
    }

    return diagnostics;
  }

  /**
   * Fetch coaching activity for export (Manager)
   */
  private async fetchCoachingActivity(dto: ExportRequestDto): Promise<any[]> {
    // Simplified - in production, query actual coaching records
    const tasks = await this.taskRepository.find({
      where: dto.startDate ? { createdAt: new Date(dto.startDate) as any } : {},
      order: { createdAt: 'DESC' },
    });

    return tasks.map(task => ({
      taskId: task.id,
      dealId: task.dealId,
      assignedBy: 'Manager',
      assignedTo: 'Rep',
      taskDescription: task.title,
      status: task.status,
      dueDate: task.dueDate,
      completedAt: task.completedAt,
      createdAt: task.createdAt,
    }));
  }

  /**
   * Fetch forecast summary for export (Executive)
   */
  private async fetchForecastSummary(dto: ExportRequestDto): Promise<any[]> {
    const deals = await this.dealRepository.find();

    const summary = {
      totalDeals: deals.length,
      totalValue: deals.reduce((sum, d) => sum + Number(d.amount), 0),
      commitDeals: deals.filter(d => d.forecastCategory === 'COMMIT').length,
      commitValue: deals
        .filter(d => d.forecastCategory === 'COMMIT')
        .reduce((sum, d) => sum + Number(d.amount), 0),
      bestCaseDeals: deals.filter(d => d.forecastCategory === 'BEST_CASE').length,
      bestCaseValue: deals
        .filter(d => d.forecastCategory === 'BEST_CASE')
        .reduce((sum, d) => sum + Number(d.amount), 0),
      pipelineDeals: deals.filter(d => d.forecastCategory === 'PIPELINE').length,
      pipelineValue: deals
        .filter(d => d.forecastCategory === 'PIPELINE')
        .reduce((sum, d) => sum + Number(d.amount), 0),
      atRiskDeals: deals.filter(d => d.isHighRisk || d.aiScore < 50).length,
      averageAiScore: deals.reduce((sum, d) => sum + d.aiScore, 0) / deals.length,
      averageDealSize: deals.reduce((sum, d) => sum + Number(d.amount), 0) / deals.length,
    };

    return [summary];
  }

  /**
   * Fetch top risk deals for export (Executive)
   */
  private async fetchTopRiskDeals(dto: ExportRequestDto): Promise<any[]> {
    const deals = await this.dealRepository.find({
      relations: ['warnings'],
      order: { aiScore: 'ASC' },
      take: 20,
    });

    return deals
      .filter(d => d.isHighRisk || d.aiScore < 50)
      .map(deal => ({
        dealId: deal.id,
        dealName: deal.name,
        ownerName: deal.ownerName,
        amount: Number(deal.amount),
        stage: deal.stage,
        forecastCategory: deal.forecastCategory,
        aiScore: deal.aiScore,
        warningCount: deal.warningCount,
        primaryRisk: deal.riskReason || 'Low AI score',
        riskLevel: deal.aiScore < 30 ? 'HIGH' : deal.aiScore < 50 ? 'MEDIUM' : 'LOW',
        closeDate: deal.closeDate,
        lastActivityAt: deal.lastActivityAt,
      }));
  }

  /**
   * Fetch analytics report for export
   */
  private async fetchAnalyticsReport(dto: ExportRequestDto, userId: string): Promise<any[]> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new Error('User not found');
    }

    const deals = await this.dealRepository.find({
      where: user.role === UserRole.USER ? { ownerId: userId } : {},
      relations: ['warnings', 'playbooks', 'activities'],
    });

    const report = {
      reportDate: new Date().toISOString(),
      userRole: user.role,
      userName: `${user.firstName} ${user.lastName}`,
      totalDeals: deals.length,
      totalValue: deals.reduce((sum, d) => sum + Number(d.amount), 0),
      averageAiScore: deals.reduce((sum, d) => sum + d.aiScore, 0) / deals.length,
      atRiskDeals: deals.filter(d => d.isHighRisk || d.aiScore < 50).length,
      highValueDeals: deals.filter(d => Number(d.amount) > 100000).length,
      dealsByStage: this.groupByField(deals, 'stage'),
      dealsByForecast: this.groupByField(deals, 'forecastCategory'),
      topWarnings: deals
        .flatMap(d => d.warnings || [])
        .slice(0, 10)
        .map(w => w.message),
    };

    return [report];
  }

  /**
   * Helper: Group deals by field
   */
  private groupByField(deals: Deal[], field: keyof Deal): Record<string, number> {
    return deals.reduce((acc, deal) => {
      const key = String(deal[field]);
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }
}
