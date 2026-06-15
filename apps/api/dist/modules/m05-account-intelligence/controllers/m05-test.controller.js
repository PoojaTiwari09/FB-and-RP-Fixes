"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.M05TestController = void 0;
const common_1 = require("@nestjs/common");
const public_decorator_1 = require("../../platform-core/decorators/public.decorator");
const m05_data_store_1 = require("../database/m05-data.store");
const m05_verification_matrix_1 = require("../database/m05-verification.matrix");
const prisma_service_1 = require("../database/prisma.service");
let M05TestController = class M05TestController {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    health() {
        return {
            success: true,
            module: 'm05-account-intelligence',
            timestamp: new Date().toISOString(),
        };
    }
    smoke() {
        return {
            success: true,
            module: 'm05-account-intelligence',
            checks: ['health', 'accounts_route', 'webhook_env'],
            webhookSecretConfigured: Boolean(process.env.M05_HUBSPOT_WEBHOOK_SECRET || process.env.HUBSPOT_WEBHOOK_SECRET),
            hubspotTokenConfigured: Boolean(process.env.HUBSPOT_ACCESS_TOKEN),
            hubspotPortalId: process.env.HUBSPOT_PORTAL_ID || null,
        };
    }
    verification() {
        return {
            success: true,
            module: 'm05-account-intelligence',
            count: m05_verification_matrix_1.M05_VERIFICATION_MATRIX.length,
            matrix: m05_verification_matrix_1.M05_VERIFICATION_MATRIX,
            manifest: (0, m05_data_store_1.m05SeedManifest)(),
            stats: m05_data_store_1.m05DataStore.stats(),
            reload_seed: 'POST /api/v1/account-intelligence/test/seed',
        };
    }
    async seed() {
        m05_data_store_1.m05DataStore.reset();
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
        const boards = m05_data_store_1.m05DataStore.table('board_config');
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
        const tabs = m05_data_store_1.m05DataStore.table('board_tabs');
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
        const columns = m05_data_store_1.m05DataStore.table('board_columns');
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
        const companies = m05_data_store_1.m05DataStore.table('crm_companies');
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
        const supps = m05_data_store_1.m05DataStore.table('supplementary_accounts');
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
        const activities = m05_data_store_1.m05DataStore.table('crm_activities');
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
        const deals = m05_data_store_1.m05DataStore.table('crm_deals');
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
        const contacts = m05_data_store_1.m05DataStore.table('crm_contacts');
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
        const todos = m05_data_store_1.m05DataStore.table('todos_notes');
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
        const briefs = m05_data_store_1.m05DataStore.table('ai_briefs_cache');
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
        const prefs = m05_data_store_1.m05DataStore.table('user_board_preferences');
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
        const profiles = m05_data_store_1.m05DataStore.table('permission_profiles');
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
            stats: m05_data_store_1.m05DataStore.stats(),
            manifest: (0, m05_data_store_1.m05SeedManifest)(),
            verification: 'GET /api/v1/account-intelligence/test/verification',
            urls: {
                demo: 'http://localhost:5179/board/demo',
                commercial: 'http://localhost:5179/board/commercial',
            },
        };
    }
};
exports.M05TestController = M05TestController;
__decorate([
    (0, common_1.Get)('health'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], M05TestController.prototype, "health", null);
__decorate([
    (0, common_1.Post)('smoke'),
    (0, common_1.HttpCode)(200),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], M05TestController.prototype, "smoke", null);
__decorate([
    (0, common_1.Get)('verification'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], M05TestController.prototype, "verification", null);
__decorate([
    (0, common_1.Post)('seed'),
    (0, common_1.HttpCode)(200),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], M05TestController.prototype, "seed", null);
exports.M05TestController = M05TestController = __decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Controller)('api/v1/account-intelligence/test'),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], M05TestController);
//# sourceMappingURL=m05-test.controller.js.map