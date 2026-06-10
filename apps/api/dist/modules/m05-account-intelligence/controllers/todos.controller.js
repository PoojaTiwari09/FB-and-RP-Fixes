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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TodosController = void 0;
const common_1 = require("@nestjs/common");
const todos_service_1 = require("../services/todos.service");
let TodosController = class TodosController {
    todosService;
    constructor(todosService) {
        this.todosService = todosService;
    }
    async getTodos(companyHubspotId) {
        const todos = await this.todosService.getTodos(companyHubspotId);
        return { todos };
    }
    async createTodo(companyHubspotId, body) {
        const todo = await this.todosService.createTodo(companyHubspotId, body.type, body.content, body.role);
        return { todo };
    }
    async updateTodo(todoId, body) {
        const todo = await this.todosService.updateTodo(todoId, body);
        return { todo };
    }
    async deleteTodo(todoId) {
        return this.todosService.deleteTodo(todoId);
    }
};
exports.TodosController = TodosController;
__decorate([
    (0, common_1.Get)(':companyHubspotId'),
    __param(0, (0, common_1.Param)('companyHubspotId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], TodosController.prototype, "getTodos", null);
__decorate([
    (0, common_1.Post)(':companyHubspotId'),
    __param(0, (0, common_1.Param)('companyHubspotId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], TodosController.prototype, "createTodo", null);
__decorate([
    (0, common_1.Patch)(':todoId'),
    __param(0, (0, common_1.Param)('todoId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], TodosController.prototype, "updateTodo", null);
__decorate([
    (0, common_1.Delete)(':todoId'),
    __param(0, (0, common_1.Param)('todoId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], TodosController.prototype, "deleteTodo", null);
exports.TodosController = TodosController = __decorate([
    (0, common_1.Controller)('api/v1/account-intelligence/todos'),
    __metadata("design:paramtypes", [todos_service_1.TodosService])
], TodosController);
//# sourceMappingURL=todos.controller.js.map