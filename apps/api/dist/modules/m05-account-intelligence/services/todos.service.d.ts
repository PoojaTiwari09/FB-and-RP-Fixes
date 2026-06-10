export declare class TodosService {
    private supabase;
    getTodos(companyHubspotId: string): Promise<any>;
    createTodo(companyHubspotId: string, type: string, content: string, role: string): Promise<any>;
    updateTodo(todoId: string, updates: {
        content?: string;
        completed?: boolean;
    }): Promise<any>;
    deleteTodo(todoId: string): Promise<{
        success: boolean;
    }>;
}
