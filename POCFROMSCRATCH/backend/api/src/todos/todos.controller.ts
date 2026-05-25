import { Controller, Get, Post, Patch, Delete, Param, Body } from '@nestjs/common';
import { TodosService } from './todos.service';

@Controller('todos')
export class TodosController {
  constructor(private readonly todosService: TodosService) {}

  @Get(':companyHubspotId')
  async getTodos(@Param('companyHubspotId') companyHubspotId: string) {
    const todos = await this.todosService.getTodos(companyHubspotId);
    return { todos };
  }

  @Post(':companyHubspotId')
  async createTodo(
    @Param('companyHubspotId') companyHubspotId: string,
    @Body() body: { type: string; content: string; role: string },
  ) {
    const todo = await this.todosService.createTodo(
      companyHubspotId,
      body.type,
      body.content,
      body.role,
    );
    return { todo };
  }

  @Patch(':todoId')
  async updateTodo(
    @Param('todoId') todoId: string,
    @Body() body: { content?: string; completed?: boolean },
  ) {
    const todo = await this.todosService.updateTodo(todoId, body);
    return { todo };
  }

  @Delete(':todoId')
  async deleteTodo(@Param('todoId') todoId: string) {
    return this.todosService.deleteTodo(todoId);
  }
}
