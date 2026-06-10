"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TodosService = void 0;
const common_1 = require("@nestjs/common");
const supabase_1 = require("../config/supabase");
let TodosService = class TodosService {
    supabase = (0, supabase_1.getSupabase)();
    async getTodos(companyHubspotId) {
        const { data, error } = await this.supabase
            .from('todos_notes')
            .select('*')
            .eq('company_hubspot_id', companyHubspotId)
            .order('created_at', { ascending: false });
        if (error)
            throw new Error(error.message);
        return data || [];
    }
    async createTodo(companyHubspotId, type, content, role) {
        const { data, error } = await this.supabase
            .from('todos_notes')
            .insert({
            company_hubspot_id: companyHubspotId,
            created_by_role: role,
            type,
            content,
            completed: false,
        })
            .select('*')
            .single();
        if (error)
            throw new Error(error.message);
        return data;
    }
    async updateTodo(todoId, updates) {
        const updateData = { updated_at: new Date().toISOString() };
        if (updates.content !== undefined)
            updateData.content = updates.content;
        if (updates.completed !== undefined) {
            updateData.completed = updates.completed;
            updateData.completed_at = updates.completed ? new Date().toISOString() : null;
        }
        const { data, error } = await this.supabase
            .from('todos_notes')
            .update(updateData)
            .eq('id', todoId)
            .select('*')
            .single();
        if (error)
            throw new common_1.NotFoundException('Todo not found');
        return data;
    }
    async deleteTodo(todoId) {
        const { error } = await this.supabase
            .from('todos_notes')
            .delete()
            .eq('id', todoId);
        if (error)
            throw new common_1.NotFoundException('Todo not found');
        return { success: true };
    }
};
exports.TodosService = TodosService;
exports.TodosService = TodosService = __decorate([
    (0, common_1.Injectable)()
], TodosService);
//# sourceMappingURL=todos.service.js.map