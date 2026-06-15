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
var ComplianceService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ComplianceService = void 0;
const common_1 = require("@nestjs/common");
const compliance_repository_1 = require("../repositories/compliance.repository");
const COMPLIANCE_ENABLED = process.env.M10_COMPLIANCE_ENABLED !== "false";
const POLICY_WRITE_ENABLED = process.env.M10_COMPLIANCE_POLICY_WRITE_ENABLED !== "false";
let ComplianceService = ComplianceService_1 = class ComplianceService {
    repo;
    logger = new common_1.Logger(ComplianceService_1.name);
    constructor(repo) {
        this.repo = repo;
    }
    async createPolicy(tenantId, dto, createdBy) {
        if (!COMPLIANCE_ENABLED) {
            throw new common_1.ForbiddenException("M10 Compliance is disabled — set M10_COMPLIANCE_ENABLED=true");
        }
        if (!POLICY_WRITE_ENABLED) {
            throw new common_1.ForbiddenException("Policy writes are disabled — set M10_COMPLIANCE_POLICY_WRITE_ENABLED=true");
        }
        this.logger.log(`Creating compliance policy for tenant=${tenantId} channel=${dto.channel} region=${dto.regionFamily}`);
        const policy = await this.repo.createPolicy(tenantId, dto);
        this.logger.log(`Policy created id=${policy.id} version=${policy.version}`);
        return this.formatPolicy(policy);
    }
    async getPolicies(tenantId, activeOnly = false) {
        const policies = await this.repo.findAllPolicies(tenantId, activeOnly);
        return policies.map((p) => this.formatPolicy(p));
    }
    async getPolicyById(tenantId, id) {
        const policy = await this.repo.findPolicyById(tenantId, id);
        if (!policy)
            throw new common_1.NotFoundException(`Compliance policy ${id} not found`);
        return this.formatPolicy(policy);
    }
    async updatePolicy(tenantId, id, dto) {
        if (!POLICY_WRITE_ENABLED) {
            throw new common_1.ForbiddenException("Policy writes are disabled — set M10_COMPLIANCE_POLICY_WRITE_ENABLED=true");
        }
        const existing = await this.repo.findPolicyById(tenantId, id);
        if (!existing)
            throw new common_1.NotFoundException(`Compliance policy ${id} not found`);
        this.logger.log(`Updating compliance policy id=${id} tenant=${tenantId} (prev version=${existing.version})`);
        const updated = await this.repo.updatePolicy(tenantId, id, dto);
        return this.formatPolicy(updated);
    }
    async deactivatePolicy(tenantId, id) {
        if (!POLICY_WRITE_ENABLED) {
            throw new common_1.ForbiddenException("Policy writes are disabled");
        }
        const existing = await this.repo.findPolicyById(tenantId, id);
        if (!existing)
            throw new common_1.NotFoundException(`Compliance policy ${id} not found`);
        const updated = await this.repo.deactivatePolicy(tenantId, id);
        this.logger.log(`Deactivated compliance policy id=${id} tenant=${tenantId}`);
        return this.formatPolicy(updated);
    }
    async upsertOptOut(tenantId, dto) {
        return this.repo.upsertOptOut(tenantId, dto);
    }
    async getOptOutsForContact(tenantId, contactEmail) {
        return this.repo.findAllOptOuts(tenantId, contactEmail);
    }
    async createConsentLog(tenantId, dto) {
        return this.repo.createConsentLog(tenantId, dto);
    }
    async getConsentLogsForContact(tenantId, contactEmail) {
        return this.repo.findAllConsentLogs(tenantId, contactEmail);
    }
    async getAuditLog(tenantId, opts) {
        return this.repo.findAuditEntries(tenantId, opts);
    }
    formatPolicy(p) {
        return {
            id: p.id,
            policyId: p.id,
            name: p.name,
            description: p.description ?? null,
            channel: p.channel,
            regionFamily: p.regionFamily,
            ruleDefinition: p.ruleDefinition,
            isActive: p.isActive,
            version: p.version,
            createdBy: p.createdBy ?? null,
            createdAt: p.createdAt,
            updatedAt: p.updatedAt,
        };
    }
};
exports.ComplianceService = ComplianceService;
exports.ComplianceService = ComplianceService = ComplianceService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [compliance_repository_1.ComplianceRepository])
], ComplianceService);
//# sourceMappingURL=compliance.service.js.map