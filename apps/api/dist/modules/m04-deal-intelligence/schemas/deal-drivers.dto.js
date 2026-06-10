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
exports.UpdateWarningDefinitionDto = exports.CreateWarningDefinitionDto = exports.BulkWarningEventDto = exports.CreateDealReassignmentDto = exports.CloseDealLifecycleDto = exports.OpenDealLifecycleDto = exports.CreateWarningEventDto = exports.WarningEventStatus = exports.CoachingQueryDto = exports.BoardComparisonQueryDto = exports.DrillDownQueryDto = exports.MatrixQueryDto = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const deal_drivers_entities_1 = require("../entities/deal-drivers.entities");
class MatrixQueryDto {
    managerId;
    boardId;
    period = deal_drivers_entities_1.Period.NOW;
    token;
}
exports.MatrixQueryDto = MatrixQueryDto;
__decorate([
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], MatrixQueryDto.prototype, "managerId", void 0);
__decorate([
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], MatrixQueryDto.prototype, "boardId", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(deal_drivers_entities_1.Period),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], MatrixQueryDto.prototype, "period", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], MatrixQueryDto.prototype, "token", void 0);
class DrillDownQueryDto {
    repId;
    warningId;
    boardId;
    period = deal_drivers_entities_1.Period.NOW;
}
exports.DrillDownQueryDto = DrillDownQueryDto;
__decorate([
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], DrillDownQueryDto.prototype, "repId", void 0);
__decorate([
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], DrillDownQueryDto.prototype, "warningId", void 0);
__decorate([
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], DrillDownQueryDto.prototype, "boardId", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(deal_drivers_entities_1.Period),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], DrillDownQueryDto.prototype, "period", void 0);
class BoardComparisonQueryDto {
    baselineBoardId;
    comparisonBoardId;
    managerId;
    period = deal_drivers_entities_1.Period.NOW;
}
exports.BoardComparisonQueryDto = BoardComparisonQueryDto;
__decorate([
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], BoardComparisonQueryDto.prototype, "baselineBoardId", void 0);
__decorate([
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], BoardComparisonQueryDto.prototype, "comparisonBoardId", void 0);
__decorate([
    (0, class_validator_1.IsUUID)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], BoardComparisonQueryDto.prototype, "managerId", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(deal_drivers_entities_1.Period),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], BoardComparisonQueryDto.prototype, "period", void 0);
class CoachingQueryDto {
    repId;
    boardId;
}
exports.CoachingQueryDto = CoachingQueryDto;
__decorate([
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CoachingQueryDto.prototype, "repId", void 0);
__decorate([
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CoachingQueryDto.prototype, "boardId", void 0);
var WarningEventStatus;
(function (WarningEventStatus) {
    WarningEventStatus["ACTIVE"] = "ACTIVE";
    WarningEventStatus["RESOLVED"] = "RESOLVED";
})(WarningEventStatus || (exports.WarningEventStatus = WarningEventStatus = {}));
class CreateWarningEventDto {
    dealId;
    warningId;
    status;
    triggeredAt;
}
exports.CreateWarningEventDto = CreateWarningEventDto;
__decorate([
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateWarningEventDto.prototype, "dealId", void 0);
__decorate([
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateWarningEventDto.prototype, "warningId", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(WarningEventStatus),
    __metadata("design:type", String)
], CreateWarningEventDto.prototype, "status", void 0);
__decorate([
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], CreateWarningEventDto.prototype, "triggeredAt", void 0);
class OpenDealLifecycleDto {
    dealId;
    repId;
    boardId;
    openedAt;
}
exports.OpenDealLifecycleDto = OpenDealLifecycleDto;
__decorate([
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], OpenDealLifecycleDto.prototype, "dealId", void 0);
__decorate([
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], OpenDealLifecycleDto.prototype, "repId", void 0);
__decorate([
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], OpenDealLifecycleDto.prototype, "boardId", void 0);
__decorate([
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], OpenDealLifecycleDto.prototype, "openedAt", void 0);
class CloseDealLifecycleDto {
    closedAt;
}
exports.CloseDealLifecycleDto = CloseDealLifecycleDto;
__decorate([
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], CloseDealLifecycleDto.prototype, "closedAt", void 0);
class CreateDealReassignmentDto {
    dealId;
    fromRepId;
    toRepId;
    reassignedAt;
}
exports.CreateDealReassignmentDto = CreateDealReassignmentDto;
__decorate([
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateDealReassignmentDto.prototype, "dealId", void 0);
__decorate([
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateDealReassignmentDto.prototype, "fromRepId", void 0);
__decorate([
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateDealReassignmentDto.prototype, "toRepId", void 0);
__decorate([
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], CreateDealReassignmentDto.prototype, "reassignedAt", void 0);
class BulkWarningEventDto {
    events;
}
exports.BulkWarningEventDto = BulkWarningEventDto;
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ArrayMaxSize)(500),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => CreateWarningEventDto),
    __metadata("design:type", Array)
], BulkWarningEventDto.prototype, "events", void 0);
class CreateWarningDefinitionDto {
    key;
    label;
    description;
}
exports.CreateWarningDefinitionDto = CreateWarningDefinitionDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(64),
    (0, class_validator_1.Matches)(/^[a-z][a-z0-9_]{0,63}$/, {
        message: 'key must be snake_case, start with a lowercase letter, max 64 chars',
    }),
    __metadata("design:type", String)
], CreateWarningDefinitionDto.prototype, "key", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(255),
    __metadata("design:type", String)
], CreateWarningDefinitionDto.prototype, "label", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateWarningDefinitionDto.prototype, "description", void 0);
class UpdateWarningDefinitionDto {
    label;
    description;
    isActive;
}
exports.UpdateWarningDefinitionDto = UpdateWarningDefinitionDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(255),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateWarningDefinitionDto.prototype, "label", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateWarningDefinitionDto.prototype, "description", void 0);
__decorate([
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], UpdateWarningDefinitionDto.prototype, "isActive", void 0);
//# sourceMappingURL=deal-drivers.dto.js.map