"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ENGAGE_TEAM_MEMBERS = void 0;
exports.resolveTeamMember = resolveTeamMember;
exports.suggestAssigneeForContact = suggestAssigneeForContact;
exports.mapTaskAssignee = mapTaskAssignee;
exports.ENGAGE_TEAM_MEMBERS = [
    { id: 'me', name: 'Alex Morgan', role: 'Account Executive' },
    { id: 'sarah', name: 'Sarah Chen', role: 'Senior AE' },
    { id: 'michael', name: 'Michael Rodriguez', role: 'Account Executive' },
    { id: 'jennifer', name: 'Jennifer Kim', role: 'Team Lead' },
    { id: 'david', name: 'David Park', role: 'Account Executive' },
    { id: 'emily', name: 'Emily Thompson', role: 'Senior AE' },
    { id: 'james', name: 'James Wilson', role: 'Account Executive' },
];
function resolveTeamMember(input) {
    const raw = String(input ?? '').trim();
    if (!raw)
        return { ...exports.ENGAGE_TEAM_MEMBERS[0] };
    const byId = exports.ENGAGE_TEAM_MEMBERS.find((m) => m.id === raw);
    if (byId)
        return { ...byId };
    const lower = raw.toLowerCase();
    const byExactName = exports.ENGAGE_TEAM_MEMBERS.find((m) => m.name.toLowerCase() === lower);
    if (byExactName)
        return { ...byExactName };
    const byPartialName = exports.ENGAGE_TEAM_MEMBERS.find((m) => m.name.toLowerCase().includes(lower) ||
        lower.includes(m.name.toLowerCase()));
    if (byPartialName)
        return { ...byPartialName };
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
function suggestAssigneeForContact(contactName) {
    const lower = contactName.trim().toLowerCase();
    if (!lower)
        return null;
    const exact = exports.ENGAGE_TEAM_MEMBERS.find((m) => m.name.toLowerCase() === lower);
    if (exact)
        return exact.id;
    const partial = exports.ENGAGE_TEAM_MEMBERS.find((m) => {
        const repLower = m.name.toLowerCase();
        return repLower.includes(lower) || lower.includes(repLower.split(' ')[0] ?? '');
    });
    return partial?.id ?? null;
}
function mapTaskAssignee(task) {
    const member = resolveTeamMember(task.assigneeId || 'me');
    return {
        assigneeId: member.id,
        assigneeName: member.name,
        assigneeRole: member.role,
    };
}
//# sourceMappingURL=m08-team-members.util.js.map