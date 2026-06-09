/** Demo team roster — ids must match engage seed assignee_id values. */
export const ENGAGE_TEAM_MEMBERS = [
  { id: 'me', name: 'Alex Morgan', role: 'Account Executive' },
  { id: 'sarah', name: 'Sarah Chen', role: 'Senior AE' },
  { id: 'michael', name: 'Michael Rodriguez', role: 'Account Executive' },
  { id: 'jennifer', name: 'Jennifer Kim', role: 'Team Lead' },
  { id: 'david', name: 'David Park', role: 'Account Executive' },
  { id: 'emily', name: 'Emily Thompson', role: 'Senior AE' },
  { id: 'james', name: 'James Wilson', role: 'Account Executive' },
] as const;

export type TeamMember = (typeof ENGAGE_TEAM_MEMBERS)[number];

/** Resolve a team member by id, display name, or partial name match. */
export function resolveTeamMember(input: string | null | undefined): TeamMember {
  const raw = String(input ?? '').trim();
  if (!raw) return { ...ENGAGE_TEAM_MEMBERS[0] };

  const byId = ENGAGE_TEAM_MEMBERS.find((m) => m.id === raw);
  if (byId) return { ...byId };

  const lower = raw.toLowerCase();
  const byExactName = ENGAGE_TEAM_MEMBERS.find((m) => m.name.toLowerCase() === lower);
  if (byExactName) return { ...byExactName };

  const byPartialName = ENGAGE_TEAM_MEMBERS.find(
    (m) =>
      m.name.toLowerCase().includes(lower) ||
      lower.includes(m.name.toLowerCase()),
  );
  if (byPartialName) return { ...byPartialName };

  const label = raw
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ');

  return {
    id: raw,
    name: label || raw,
    role: 'Account Executive',
  };
}

/** Suggest rep id when task contact name matches a team member (e.g. Jennifer Kim → jennifer). */
export function suggestAssigneeForContact(contactName: string): string | null {
  const lower = contactName.trim().toLowerCase();
  if (!lower) return null;

  const exact = ENGAGE_TEAM_MEMBERS.find((m) => m.name.toLowerCase() === lower);
  if (exact) return exact.id;

  const partial = ENGAGE_TEAM_MEMBERS.find((m) => {
    const repLower = m.name.toLowerCase();
    return repLower.includes(lower) || lower.includes(repLower.split(' ')[0] ?? '');
  });
  return partial?.id ?? null;
}

export function mapTaskAssignee(task: {
  assigneeId?: string | null;
  assigneeName?: string | null;
  assigneeRole?: string | null;
}) {
  const member = resolveTeamMember(task.assigneeId || 'me');
  return {
    assigneeId: member.id,
    assigneeName: member.name,
    assigneeRole: member.role,
  };
}
