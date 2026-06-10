import { Controller, Get, Post, Patch, Param, Query, Req, Body } from '@nestjs/common';
import {
  MOCK_TASKS,
  MOCK_TASK_SUMMARY,
  MOCK_RECENT_ACTIVITY,
  MOCK_TASK_DETAILS,
  MOCK_CONTACT_DETAILS,
  MOCK_EMAIL_DRAFTS,
  MOCK_LINKEDIN_DRAFTS,
  MOCK_FILTER_OPTIONS,
  MOCK_EMAIL_TEMPLATES
} from './m08-rep-bridge.mock';

@Controller('api/v1/sales-engagement')
export class M08RepBridgeController {
  
  @Get('tasks')
  getTasks(@Req() req: any) {
    return MOCK_TASKS;
  }

  @Get('tasks/summary')
  getSummary(@Req() req: any) {
    return MOCK_TASK_SUMMARY;
  }

  @Get('activity/recent')
  getRecentActivity(@Req() req: any, @Query('limit') limit?: string) {
    const n = parseInt(limit || '10', 10);
    return MOCK_RECENT_ACTIVITY.slice(0, Number.isFinite(n) ? n : 10);
  }

  @Get('tasks/:taskId/detail')
  getTaskDetail(@Param('taskId') taskId: string) {
    return MOCK_TASK_DETAILS[taskId] || null;
  }

  @Get('contacts/:contactId/details')
  getContactDetails(@Param('contactId') contactId: string) {
    return MOCK_CONTACT_DETAILS[contactId] || null;
  }

  @Get('tasks/:taskId/email-draft')
  getEmailDraft(@Param('taskId') taskId: string) {
    return MOCK_EMAIL_DRAFTS[taskId] || null;
  }

  @Get('tasks/:taskId/notes')
  getNotes(@Param('taskId') taskId: string) {
    const detail = MOCK_TASK_DETAILS[taskId];
    return detail ? [{ id: 'note-001', noteText: detail.existingNotes || '' }] : [];
  }

  @Get('tasks/:taskId/linkedin-draft')
  getLinkedInDraft(@Param('taskId') taskId: string) {
    return MOCK_LINKEDIN_DRAFTS[taskId] || null;
  }

  @Get('filters/options')
  getFilterOptions() {
    return MOCK_FILTER_OPTIONS;
  }

  @Get('email-templates')
  getEmailTemplates() {
    return MOCK_EMAIL_TEMPLATES;
  }

  // --- Write Endpoints ---

  @Post('tasks')
  createTask(@Body() body: any) {
    const newTask = {
      taskId: `task-${Date.now()}`,
      contactId: body.contactId || '',
      contactName: body.contactName || 'New Contact',
      company: body.company || 'New Company',
      channelType: body.channelType || 'EMAIL',
      sequenceName: '',
      sequenceStep: '',
      scheduledTime: '',
      dueDateTime: new Date().toISOString(),
      interactionCount: 0,
      priority: body.priority || 'NORMAL',
      status: 'PENDING',
      isOverdue: false,
      isAtRisk: false,
    };
    MOCK_TASKS.push(newTask);
    return newTask;
  }

  @Post('tasks/:taskId/notes')
  saveNotes(@Param('taskId') taskId: string, @Body() body: { notes: string }) {
    if (MOCK_TASK_DETAILS[taskId]) {
      MOCK_TASK_DETAILS[taskId].existingNotes = body.notes;
    }
    return { success: true };
  }

  @Post('tasks/:taskId/send-email')
  sendEmail(@Param('taskId') taskId: string, @Body() body: any) {
    return { success: true };
  }

  @Post('tasks/:taskId/save-draft')
  saveDraft(@Param('taskId') taskId: string, @Body() body: any) {
    return { success: true };
  }

  @Post('tasks/:taskId/ai-rephrase')
  rephraseEmail(@Param('taskId') taskId: string, @Body() body: any) {
    return {
      rephrasedBody: (body.body || '').replace(/Hi/g, 'Hello') + '\n\n[AI Rephrased for ' + (body.tone || 'professional') + ' tone]'
    };
  }

  @Post('tasks/:taskId/mark-complete')
  markComplete(@Param('taskId') taskId: string) {
    const t = MOCK_TASKS.find(x => x.taskId === taskId);
    if (t) {
      t.status = 'COMPLETED';
      MOCK_TASK_SUMMARY.completedCount++;
    }
    return { success: true };
  }

  @Post('tasks/:taskId/skip')
  skipTask(@Param('taskId') taskId: string) {
    const t = MOCK_TASKS.find(x => x.taskId === taskId);
    if (t) t.status = 'SKIPPED';
    return { success: true };
  }

  @Post('tasks/:taskId/dismiss')
  dismissTask(@Param('taskId') taskId: string) {
    const t = MOCK_TASKS.find(x => x.taskId === taskId);
    if (t) t.status = 'DISMISSED';
    return { success: true };
  }

  @Patch('tasks/:taskId/reassign')
  reassignTask(@Param('taskId') taskId: string, @Body() body: { newAssigneeId: string }) {
    return { success: true };
  }

  @Patch('tasks/:taskId')
  updateTask(@Param('taskId') taskId: string, @Body() body: any) {
    const t = MOCK_TASKS.find(x => x.taskId === taskId);
    if (t) {
      Object.assign(t, body);
    }
    return { success: true };
  }
}
