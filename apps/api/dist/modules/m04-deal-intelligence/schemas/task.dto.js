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
exports.GenerateNextStepsDto = exports.TaskResponseDto = exports.UpdateTaskDto = exports.CreateTaskDto = exports.TaskSource = exports.TaskPriority = exports.TaskStatus = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
var TaskStatus;
(function (TaskStatus) {
    TaskStatus["PENDING"] = "PENDING";
    TaskStatus["IN_PROGRESS"] = "IN_PROGRESS";
    TaskStatus["COMPLETED"] = "COMPLETED";
    TaskStatus["CANCELLED"] = "CANCELLED";
})(TaskStatus || (exports.TaskStatus = TaskStatus = {}));
var TaskPriority;
(function (TaskPriority) {
    TaskPriority["LOW"] = "LOW";
    TaskPriority["MEDIUM"] = "MEDIUM";
    TaskPriority["HIGH"] = "HIGH";
    TaskPriority["URGENT"] = "URGENT";
})(TaskPriority || (exports.TaskPriority = TaskPriority = {}));
var TaskSource;
(function (TaskSource) {
    TaskSource["AI_SUGGESTED"] = "AI_SUGGESTED";
    TaskSource["MANAGER_ASSIGNED"] = "MANAGER_ASSIGNED";
    TaskSource["USER_CREATED"] = "USER_CREATED";
})(TaskSource || (exports.TaskSource = TaskSource = {}));
class CreateTaskDto {
    title;
    description;
    priority;
    assigneeId;
    assigneeName;
    dueDate;
    source;
}
exports.CreateTaskDto = CreateTaskDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Task title',
        example: 'Schedule follow-up call with decision maker',
        maxLength: 500,
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(500),
    __metadata("design:type", String)
], CreateTaskDto.prototype, "title", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Task description',
        example: 'Discuss budget approval timeline and next steps',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateTaskDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Task priority',
        enum: TaskPriority,
        example: TaskPriority.HIGH,
    }),
    (0, class_validator_1.IsEnum)(TaskPriority),
    __metadata("design:type", String)
], CreateTaskDto.prototype, "priority", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Assignee user ID',
        example: '123e4567-e89b-12d3-a456-426614174000',
    }),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateTaskDto.prototype, "assigneeId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Assignee name',
        example: 'John Doe',
    }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateTaskDto.prototype, "assigneeName", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Due date',
        example: '2024-01-20',
    }),
    (0, class_validator_1.IsDateString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateTaskDto.prototype, "dueDate", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Task source',
        enum: TaskSource,
        example: TaskSource.USER_CREATED,
    }),
    (0, class_validator_1.IsEnum)(TaskSource),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateTaskDto.prototype, "source", void 0);
class UpdateTaskDto {
    title;
    description;
    status;
    priority;
    dueDate;
}
exports.UpdateTaskDto = UpdateTaskDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Task title',
        example: 'Schedule follow-up call with decision maker',
        maxLength: 500,
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(500),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateTaskDto.prototype, "title", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Task description',
        example: 'Discuss budget approval timeline and next steps',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateTaskDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Task status',
        enum: TaskStatus,
        example: TaskStatus.COMPLETED,
    }),
    (0, class_validator_1.IsEnum)(TaskStatus),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateTaskDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Task priority',
        enum: TaskPriority,
        example: TaskPriority.HIGH,
    }),
    (0, class_validator_1.IsEnum)(TaskPriority),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateTaskDto.prototype, "priority", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Due date',
        example: '2024-01-20',
    }),
    (0, class_validator_1.IsDateString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateTaskDto.prototype, "dueDate", void 0);
class TaskResponseDto {
    id;
    dealId;
    title;
    description;
    status;
    priority;
    source;
    assigneeId;
    assigneeName;
    assignedBy;
    assignedByName;
    dueDate;
    completedAt;
    completedBy;
    createdAt;
    updatedAt;
}
exports.TaskResponseDto = TaskResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Task ID',
        example: '123e4567-e89b-12d3-a456-426614174000',
    }),
    __metadata("design:type", String)
], TaskResponseDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Deal ID',
        example: '123e4567-e89b-12d3-a456-426614174000',
    }),
    __metadata("design:type", String)
], TaskResponseDto.prototype, "dealId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Task title',
        example: 'Schedule follow-up call with decision maker',
    }),
    __metadata("design:type", String)
], TaskResponseDto.prototype, "title", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Task description',
        example: 'Discuss budget approval timeline and next steps',
    }),
    __metadata("design:type", String)
], TaskResponseDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Task status',
        enum: TaskStatus,
        example: TaskStatus.PENDING,
    }),
    __metadata("design:type", String)
], TaskResponseDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Task priority',
        enum: TaskPriority,
        example: TaskPriority.HIGH,
    }),
    __metadata("design:type", String)
], TaskResponseDto.prototype, "priority", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Task source',
        enum: TaskSource,
        example: TaskSource.USER_CREATED,
    }),
    __metadata("design:type", String)
], TaskResponseDto.prototype, "source", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Assignee user ID',
        example: '123e4567-e89b-12d3-a456-426614174000',
    }),
    __metadata("design:type", String)
], TaskResponseDto.prototype, "assigneeId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Assignee name',
        example: 'John Doe',
    }),
    __metadata("design:type", String)
], TaskResponseDto.prototype, "assigneeName", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Assigned by user ID',
        example: '123e4567-e89b-12d3-a456-426614174000',
    }),
    __metadata("design:type", String)
], TaskResponseDto.prototype, "assignedBy", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Assigned by name',
        example: 'Jane Manager',
    }),
    __metadata("design:type", String)
], TaskResponseDto.prototype, "assignedByName", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Due date',
        example: '2024-01-20',
    }),
    __metadata("design:type", Date)
], TaskResponseDto.prototype, "dueDate", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Completed at timestamp',
        example: '2024-01-15T10:30:00Z',
    }),
    __metadata("design:type", Date)
], TaskResponseDto.prototype, "completedAt", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Completed by user ID',
        example: '123e4567-e89b-12d3-a456-426614174000',
    }),
    __metadata("design:type", String)
], TaskResponseDto.prototype, "completedBy", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Created at timestamp',
        example: '2024-01-15T10:30:00Z',
    }),
    __metadata("design:type", Date)
], TaskResponseDto.prototype, "createdAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Updated at timestamp',
        example: '2024-01-15T10:30:00Z',
    }),
    __metadata("design:type", Date)
], TaskResponseDto.prototype, "updatedAt", void 0);
class GenerateNextStepsDto {
    count;
}
exports.GenerateNextStepsDto = GenerateNextStepsDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Number of next steps to generate',
        example: 3,
    }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], GenerateNextStepsDto.prototype, "count", void 0);
//# sourceMappingURL=task.dto.js.map