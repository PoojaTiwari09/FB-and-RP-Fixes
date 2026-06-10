export declare const ENGAGE_TEAM_MEMBERS: readonly [{
    readonly id: "me";
    readonly name: "Alex Morgan";
    readonly role: "Account Executive";
}, {
    readonly id: "sarah";
    readonly name: "Sarah Chen";
    readonly role: "Senior AE";
}, {
    readonly id: "michael";
    readonly name: "Michael Rodriguez";
    readonly role: "Account Executive";
}, {
    readonly id: "jennifer";
    readonly name: "Jennifer Kim";
    readonly role: "Team Lead";
}, {
    readonly id: "david";
    readonly name: "David Park";
    readonly role: "Account Executive";
}, {
    readonly id: "emily";
    readonly name: "Emily Thompson";
    readonly role: "Senior AE";
}, {
    readonly id: "james";
    readonly name: "James Wilson";
    readonly role: "Account Executive";
}];
export type TeamMember = (typeof ENGAGE_TEAM_MEMBERS)[number];
export declare function resolveTeamMember(input: string | null | undefined): TeamMember;
export declare function suggestAssigneeForContact(contactName: string): string | null;
export declare function mapTaskAssignee(task: {
    assigneeId?: string | null;
    assigneeName?: string | null;
    assigneeRole?: string | null;
}): {
    assigneeId: "me" | "sarah" | "michael" | "jennifer" | "david" | "emily" | "james";
    assigneeName: "Alex Morgan" | "Sarah Chen" | "Michael Rodriguez" | "Jennifer Kim" | "Emily Thompson" | "David Park" | "James Wilson";
    assigneeRole: "Team Lead" | "Account Executive" | "Senior AE";
};
