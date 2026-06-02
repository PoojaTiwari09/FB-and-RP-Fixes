type TaskLike = {
  title?: string | null;
  contactName: string;
  companyName: string;
  channel: string;
  dueDateTime?: string | null;
  dueDate?: string | null;
  dueTime?: string | null;
  sequenceName?: string | null;
  sequenceStep?: string | null;
  workflowName?: string | null;
  workflowStep?: string | null;
};

export function parseDueDateTime(dueDate: string, dueTime?: string | null): string {
  const time = (dueTime || '12:00 PM').trim();
  const match = time.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
  if (!match) {
    return `${dueDate}T12:00:00-07:00`;
  }

  let hour = parseInt(match[1], 10);
  const minute = match[2];
  const meridiem = (match[3] || '').toUpperCase();
  if (meridiem === 'PM' && hour < 12) hour += 12;
  if (meridiem === 'AM' && hour === 12) hour = 0;

  return `${dueDate}T${String(hour).padStart(2, '0')}:${minute}:00-07:00`;
}

export function resolveDueDateTime(task: TaskLike): string {
  const raw = task.dueDateTime?.trim() || '';
  if (raw && /^\d{4}-\d{2}-\d{2}T/.test(raw) && !Number.isNaN(Date.parse(raw))) {
    return raw;
  }
  if (task.dueDate?.trim()) {
    return parseDueDateTime(task.dueDate.trim(), task.dueTime);
  }
  return raw;
}

export function buildTaskTitle(task: TaskLike): string {
  if (task.title?.trim()) return task.title.trim();

  const workflowName = task.workflowName || task.sequenceName;
  const workflowStep = task.workflowStep || task.sequenceStep;
  if (workflowName) {
    return workflowStep ? `${workflowName} — ${workflowStep}` : workflowName;
  }

  const channel = task.channel.toUpperCase();
  if (channel === 'CALL') return `Call with ${task.contactName}`;
  if (channel === 'EMAIL') return `Email follow-up — ${task.contactName}`;
  if (channel === 'LINKEDIN') return `LinkedIn outreach — ${task.contactName}`;
  return `${task.contactName} — ${task.companyName}`;
}

export function resolveSequenceName(task: TaskLike): string {
  return task.sequenceName?.trim() || task.workflowName?.trim() || '';
}

export function resolveSequenceStep(task: TaskLike): string {
  if (task.sequenceStep?.trim()) return task.sequenceStep.trim();
  if (task.workflowStep?.trim()) return `Step ${task.workflowStep.trim()}`;
  return '';
}
