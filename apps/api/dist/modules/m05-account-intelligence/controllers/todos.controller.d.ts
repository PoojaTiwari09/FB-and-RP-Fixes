import { TodosService } from '../services/todos.service';
export declare class TodosController {
    private readonly todosService;
    constructor(todosService: TodosService);
    getTodos(companyHubspotId: string): Promise<{
        todos: any;
    }>;
    createTodo(companyHubspotId: string, body: {
        type: string;
        content: string;
        role: string;
    }): Promise<{
        todo: any;
    }>;
    updateTodo(todoId: string, body: {
        content?: string;
        completed?: boolean;
    }): Promise<{
        todo: any;
    }>;
    deleteTodo(todoId: string): Promise<{
        success: boolean;
    }>;
}
