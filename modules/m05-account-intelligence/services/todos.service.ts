import { Injectable, NotFoundException } from '@nestjs/common';
import { getSupabase } from '../config/supabase';

@Injectable()
export class TodosService {
  private supabase = getSupabase();

  async getTodos(companyHubspotId: string) {
    const { data, error } = await this.supabase
      .from('todos_notes')
      .select('*')
      .eq('company_hubspot_id', companyHubspotId)
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    return data || [];
  }

  async createTodo(companyHubspotId: string, type: string, content: string, role: string) {
    const { data, error } = await this.supabase
      .from('todos_notes')
      .insert({
        company_hubspot_id: companyHubspotId,
        created_by_role: role,
        type,
        content,
        completed: false,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  async updateTodo(todoId: string, updates: { content?: string; completed?: boolean }) {
    const updateData: any = { updated_at: new Date().toISOString() };

    if (updates.content !== undefined) updateData.content = updates.content;
    if (updates.completed !== undefined) {
      updateData.completed = updates.completed;
      updateData.completed_at = updates.completed ? new Date().toISOString() : null;
    }

    const { data, error } = await this.supabase
      .from('todos_notes')
      .update(updateData)
      .eq('id', todoId)
      .select()
      .single();

    if (error) throw new NotFoundException('Todo not found');
    return data;
  }

  async deleteTodo(todoId: string) {
    const { error } = await this.supabase
      .from('todos_notes')
      .delete()
      .eq('id', todoId);

    if (error) throw new NotFoundException('Todo not found');
    return { success: true };
  }
}
