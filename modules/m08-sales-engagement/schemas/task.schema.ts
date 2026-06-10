import { z } from 'zod';

export const CreateTaskSchema = z.object({
  type: z.string().min(1, 'Task type is required'),
  description: z.string().min(1, 'Task description is required'),
  dueDate: z.string().datetime({ message: 'Invalid due date format' }),
  priority: z.number().int().min(1).max(3).default(2),
  source: z.string().default('manual'),
  sourceId: z.string().uuid().optional().nullable(),
});

export const UpdateTaskStatusSchema = z.object({
  status: z.enum(['pending', 'completed', 'snoozed']),
});

export const ReassignTaskSchema = z.object({
  userId: z.string().uuid('Invalid User ID format'),
});

export interface CreateTaskDto extends z.infer<typeof CreateTaskSchema> {}
export interface UpdateTaskStatusDto extends z.infer<typeof UpdateTaskStatusSchema> {}
export interface ReassignTaskDto extends z.infer<typeof ReassignTaskSchema> {}
