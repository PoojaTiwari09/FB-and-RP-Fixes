"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var _a, _b, _c, _d, _e, _f, _g;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExportService = void 0;
const common_1 = require("@nestjs/common");
const inject_repository_1 = require("@m04/database/inject-repository");
const m04_prisma_repository_1 = require("@m04/database/m04-prisma.repository");
const deal_entity_1 = require("@m04/entities/deal.entity");
const deal_board_entity_1 = require("@m04/entities/deal-board.entity");
const deal_activity_entity_1 = require("@m04/entities/deal-activity.entity");
const deal_task_entity_1 = require("@m04/entities/deal-task.entity");
const deal_playbook_entity_1 = require("@m04/entities/deal-playbook.entity");
const deal_warning_entity_1 = require("@m04/entities/deal-warning.entity");
const user_entity_1 = require("@m04/entities/user.entity");
const export_dto_1 = require("@m04/schemas/export.dto");
const user_role_enum_1 = require("@m04/interfaces/user-role.enum");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const uuid_1 = require("uuid");
let ExportService = class ExportService {
    dealRepository;
    boardRepository;
    activityRepository;
    taskRepository;
    playbookRepository;
    warningRepository;
    userRepository;
    exportsDir = path.join(process.cwd(), 'exports');
    constructor(dealRepository, boardRepository, activityRepository, taskRepository, playbookRepository, warningRepository, userRepository) {
        this.dealRepository = dealRepository;
        this.boardRepository = boardRepository;
        this.activityRepository = activityRepository;
        this.taskRepository = taskRepository;
        this.playbookRepository = playbookRepository;
        this.warningRepository = warningRepository;
        this.userRepository = userRepository;
        if (!fs.existsSync(this.exportsDir)) {
            fs.mkdirSync(this.exportsDir, { recursive: true });
        }
    }
    async createExport(dto, userId) {
        let data;
        let fileName;
        switch (dto.type) {
            case export_dto_1.ExportType.DEALS:
                data = await this.fetchDeals(dto);
                fileName = `deals-export-${new Date().toISOString().split('T')[0]}`;
                break;
            case export_dto_1.ExportType.BOARD:
                data = await this.fetchBoardDeals(dto);
                fileName = `board-export-${new Date().toISOString().split('T')[0]}`;
                break;
            case export_dto_1.ExportType.ACTIVITIES:
                data = await this.fetchActivities(dto);
                fileName = `activities-export-${new Date().toISOString().split('T')[0]}`;
                break;
            case export_dto_1.ExportType.TASKS:
                data = await this.fetchTasks(dto);
                fileName = `tasks-export-${new Date().toISOString().split('T')[0]}`;
                break;
            case export_dto_1.ExportType.PLAYBOOK:
                data = await this.fetchPlaybook(dto);
                fileName = `playbook-export-${new Date().toISOString().split('T')[0]}`;
                break;
            case export_dto_1.ExportType.TEAM_DIAGNOSTICS:
                data = await this.fetchTeamDiagnostics(dto);
                fileName = `team-diagnostics-${new Date().toISOString().split('T')[0]}`;
                break;
            case export_dto_1.ExportType.COACHING_ACTIVITY:
                data = await this.fetchCoachingActivity(dto);
                fileName = `coaching-activity-${new Date().toISOString().split('T')[0]}`;
                break;
            case export_dto_1.ExportType.FORECAST_SUMMARY:
                data = await this.fetchForecastSummary(dto);
                fileName = `forecast-summary-${new Date().toISOString().split('T')[0]}`;
                break;
            case export_dto_1.ExportType.TOP_RISK_DEALS:
                data = await this.fetchTopRiskDeals(dto);
                fileName = `top-risk-deals-${new Date().toISOString().split('T')[0]}`;
                break;
            case export_dto_1.ExportType.ANALYTICS_REPORT:
                data = await this.fetchAnalyticsReport(dto, userId);
                fileName = `analytics-report-${new Date().toISOString().split('T')[0]}`;
                break;
            default:
                throw new Error('Invalid export type');
        }
        const exportId = (0, uuid_1.v4)();
        let filePath;
        let fileExtension;
        switch (dto.format) {
            case export_dto_1.ExportFormat.CSV:
                fileExtension = 'csv';
                filePath = path.join(this.exportsDir, `${exportId}.csv`);
                await this.generateCSV(data, filePath, dto.columns);
                break;
            case export_dto_1.ExportFormat.EXCEL:
                fileExtension = 'xlsx';
                filePath = path.join(this.exportsDir, `${exportId}.xlsx`);
                await this.generateExcel(data, filePath, dto.columns);
                break;
            case export_dto_1.ExportFormat.PDF:
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
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        };
    }
    async getExportFile(exportId) {
        const csvPath = path.join(this.exportsDir, `${exportId}.csv`);
        const xlsxPath = path.join(this.exportsDir, `${exportId}.xlsx`);
        const pdfPath = path.join(this.exportsDir, `${exportId}.pdf`);
        if (fs.existsSync(csvPath)) {
            return { filePath: csvPath, mimeType: 'text/csv' };
        }
        else if (fs.existsSync(xlsxPath)) {
            return {
                filePath: xlsxPath,
                mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            };
        }
        else if (fs.existsSync(pdfPath)) {
            return { filePath: pdfPath, mimeType: 'application/pdf' };
        }
        throw new common_1.NotFoundException('Export file not found or expired');
    }
    async fetchDeals(dto) {
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
    async fetchBoardDeals(dto) {
        if (!dto.boardId) {
            throw new Error('Board ID is required for board exports');
        }
        let board = null;
        try {
            board = await this.boardRepository.findOne({
                where: { id: dto.boardId },
                relations: ['filters'],
            });
        }
        catch (err) {
        }
        if (!board) {
            board = await this.boardRepository.findOne({ relations: ['filters'] });
        }
        if (!board) {
            throw new common_1.NotFoundException('Board not found');
        }
        return this.dealRepository.find({ take: 1000 });
    }
    async fetchActivities(dto) {
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
    async fetchTasks(dto) {
        const queryBuilder = this.taskRepository.createQueryBuilder('task');
        if (dto.dealId) {
            queryBuilder.where('task.dealId = :dealId', { dealId: dto.dealId });
        }
        return queryBuilder.orderBy('task.createdAt', 'DESC').getMany();
    }
    async fetchPlaybook(dto) {
        if (!dto.dealId) {
            const deals = await this.dealRepository.find({ take: 1 });
            const firstDeal = deals[0];
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
    async generateCSV(data, filePath, columns) {
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
    async generateExcel(data, filePath, columns) {
        await this.generateCSV(data, filePath, columns);
    }
    async generatePDF(data, filePath, columns) {
        const now = new Date().toISOString();
        const lines = [];
        lines.push('='.repeat(60));
        lines.push('  DEAL INTELLIGENCE - EXPORT REPORT');
        lines.push(`  Generated: ${now}`);
        lines.push('='.repeat(60));
        lines.push('');
        if (data.length === 0) {
            lines.push('No data available.');
        }
        else {
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
        lines.push('='.repeat(60));
        lines.push('  END OF REPORT');
        lines.push('='.repeat(60));
        fs.writeFileSync(filePath, lines.join('\n'));
    }
    async cleanupOldExports() {
        const files = fs.readdirSync(this.exportsDir);
        const now = Date.now();
        const maxAge = 24 * 60 * 60 * 1000;
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
    async fetchTeamDiagnostics(dto) {
        const deals = await this.dealRepository.find({
            relations: ['warnings', 'playbooks'],
        });
        const dealsByOwner = deals.reduce((acc, deal) => {
            if (!acc[deal.ownerId]) {
                acc[deal.ownerId] = [];
            }
            acc[deal.ownerId].push(deal);
            return acc;
        }, {});
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
    async fetchCoachingActivity(dto) {
        const tasks = await this.taskRepository.find({
            where: dto.startDate ? { createdAt: new Date(dto.startDate) } : {},
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
    async fetchForecastSummary(dto) {
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
    async fetchTopRiskDeals(dto) {
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
    async fetchAnalyticsReport(dto, userId) {
        const user = await this.userRepository.findOne({ where: { id: userId } });
        if (!user) {
            throw new Error('User not found');
        }
        const deals = await this.dealRepository.find({
            where: user.role === user_role_enum_1.UserRole.USER ? { ownerId: userId } : {},
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
    groupByField(deals, field) {
        return deals.reduce((acc, deal) => {
            const key = String(deal[field]);
            acc[key] = (acc[key] || 0) + 1;
            return acc;
        }, {});
    }
};
exports.ExportService = ExportService;
exports.ExportService = ExportService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, inject_repository_1.InjectRepository)(deal_entity_1.Deal)),
    __param(1, (0, inject_repository_1.InjectRepository)(deal_board_entity_1.DealBoard)),
    __param(2, (0, inject_repository_1.InjectRepository)(deal_activity_entity_1.DealActivity)),
    __param(3, (0, inject_repository_1.InjectRepository)(deal_task_entity_1.DealTask)),
    __param(4, (0, inject_repository_1.InjectRepository)(deal_playbook_entity_1.DealPlaybook)),
    __param(5, (0, inject_repository_1.InjectRepository)(deal_warning_entity_1.DealWarning)),
    __param(6, (0, inject_repository_1.InjectRepository)(user_entity_1.User)),
    __metadata("design:paramtypes", [typeof (_a = typeof m04_prisma_repository_1.M04EntityRepository !== "undefined" && m04_prisma_repository_1.M04EntityRepository) === "function" ? _a : Object, typeof (_b = typeof m04_prisma_repository_1.M04EntityRepository !== "undefined" && m04_prisma_repository_1.M04EntityRepository) === "function" ? _b : Object, typeof (_c = typeof m04_prisma_repository_1.M04EntityRepository !== "undefined" && m04_prisma_repository_1.M04EntityRepository) === "function" ? _c : Object, typeof (_d = typeof m04_prisma_repository_1.M04EntityRepository !== "undefined" && m04_prisma_repository_1.M04EntityRepository) === "function" ? _d : Object, typeof (_e = typeof m04_prisma_repository_1.M04EntityRepository !== "undefined" && m04_prisma_repository_1.M04EntityRepository) === "function" ? _e : Object, typeof (_f = typeof m04_prisma_repository_1.M04EntityRepository !== "undefined" && m04_prisma_repository_1.M04EntityRepository) === "function" ? _f : Object, typeof (_g = typeof m04_prisma_repository_1.M04EntityRepository !== "undefined" && m04_prisma_repository_1.M04EntityRepository) === "function" ? _g : Object])
], ExportService);
//# sourceMappingURL=export.service.js.map