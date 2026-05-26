// ── Simplified SalesIQ CRM Data Layer ─────────────────────────────
// Contains ONLY the core tables: deals, accounts, contacts, calls, and ai_chat_history.

export const ACCOUNTS = [
  { id: "A001", name: "Acme Corp" },
  { id: "A002", name: "TechNova" },
  { id: "A003", name: "GlobalBank" },
  { id: "A004", name: "RetailPro" },
  { id: "A005", name: "HealthOS" }
];

export const DEALS = [
  { id: "D001", name: "Acme Corp — Enterprise License", stage: "Negotiation", account_id: "A001", accountId: "A001", owner_id: "sales_rep_a" },
  { id: "D002", name: "TechNova SaaS Bundle", stage: "Proposal", account_id: "A002", accountId: "A002", owner_id: "sales_rep_a" },
  { id: "D003", name: "GlobalBank Compliance Suite", stage: "Qualification", account_id: "A003", accountId: "A003", owner_id: "sales_rep_b" },
  { id: "D004", name: "RetailPro Inventory AI", stage: "Closed Won", account_id: "A004", accountId: "A004", owner_id: "sales_rep_a" },
  { id: "D005", name: "HealthOS Patient Analytics", stage: "Demo", account_id: "A005", accountId: "A005", owner_id: "sales_rep_a" }
];

export const CONTACTS = [
  { id: "C001", name: "John Harlow", email: "j.harlow@acmecorp.com", account_id: "A001", accountId: "A001" },
  { id: "C002", name: "Sara Kim", email: "sara@technova.io", account_id: "A002", accountId: "A002" },
  { id: "C003", name: "Michael Chen", email: "m.chen@globalbank.com", account_id: "A003", accountId: "A003" },
  { id: "C004", name: "Lisa Tran", email: "lisa@retailpro.co", account_id: "A004", accountId: "A004" },
  { id: "C005", name: "Dr. Patel", email: "patel@healthos.io", account_id: "A005", accountId: "A005" }
];

export const CALLS = [
  {
    id: "CL001",
    title: "Acme Price Negotiation Call",
    transcript: "Priya: Let's discuss pricing for Acme Enterprise License. John: Our budget is capped at $128K. Priya: If we do a 3-year commitment, we can offer a 15% discount. John: That works, but we need an IT security review first. Priya: Perfect, I will send the revised MSA today.",
    account_id: "A001",
    accountId: "A001",
    deal_id: "D001",
    dealId: "D001",
    created_at: "2024-06-26T10:00:00Z"
  },
  {
    id: "CL002",
    title: "TechNova Discovery Call",
    transcript: "Raj: What is your main pain point? Sara: We spend 8 hours a week on manual reporting. We want to automate this. Raj: Understood. Our platform automates CRM sync. Sara: Excellent. Please send the security docs and a proposal by Friday.",
    account_id: "A002",
    accountId: "A002",
    deal_id: "D002",
    dealId: "D002",
    created_at: "2024-06-24T14:30:00Z"
  },
  {
    id: "CL003",
    title: "HealthOS Patient Analytics Demo",
    transcript: "Amir: Here is the HIPAA compliance module audit trail. Dr. Patel: This looks exactly like what we need. Amir: Glad to hear it. Dr. Patel: The budget of $89K is greenlit internally. Let's move to contract.",
    account_id: "A005",
    accountId: "A005",
    deal_id: "D005",
    dealId: "D005",
    created_at: "2024-06-25T11:15:00Z"
  },
  {
    id: "CL004",
    title: "LogiChain Stalled Call",
    transcript: "Priya: Hi Tom, following up on the proposal. Tom: The price is too high. We need a 40% discount or we can't sign. Competitor offer is 20% cheaper. Priya: I cannot support 40% but I can check with my VP. Let's schedule a call.",
    account_id: "A001",
    accountId: "A001",
    deal_id: "D001",
    dealId: "D001",
    created_at: "2024-06-23T09:45:00Z"
  },
  {
    id: "CL005",
    title: "GlobalBank Compliance Discovery Call",
    transcript: "Amir: Hi Michael, let's review the compliance auditing requirements. Michael Chen: Our main concern is the new SEC ruling on transaction tracing. We need audit trails to retain logs for 7 years. Amir: Our suite supports real-time immutable tracing and automatically archives logs to cold storage. Michael Chen: That is exactly what our compliance officer asked for. What is the licensing pricing? Amir: Typically $145K annually for the enterprise bank cluster. Michael Chen: I will get the compliance team to review the technical brief next Tuesday.",
    account_id: "A003",
    accountId: "A003",
    deal_id: "D003",
    dealId: "D003",
    created_at: "2024-06-22T15:00:00Z"
  }
];

export const EMAILS = [
  {
    id: "EM001",
    subject: "Re: Acme Enterprise Proposal Confirmation",
    body: "Hi Priya, I am writing to confirm our agreement on the Acme proposal. We agree to the 15% discount terms in exchange for the 3-year commitment as discussed. Please consider this email as official confirmation, pending the security review of the MSA today. Thanks, John Harlow",
    account_id: "A001",
    accountId: "A001",
    deal_id: "D001",
    dealId: "D001",
    sender: "j.harlow@acmecorp.com",
    created_at: "2024-06-25T11:00:00Z"
  },
  {
    id: "EM002",
    subject: "TechNova Automation Requirements Check",
    body: "Hi Raj, as a follow-up, here is the list of reporting issues Sara mentioned. We currently lose 8 hours a week to manual reporting. If your CRM sync can automate this flow fully, we are ready to move to contract review. Best, Sara Kim",
    account_id: "A002",
    accountId: "A002",
    deal_id: "D002",
    dealId: "D002",
    sender: "sara@technova.io",
    created_at: "2024-06-23T15:00:00Z"
  },
  {
    id: "EM003",
    subject: "SEC Compliance Log Tracing Audit Inquiry",
    body: "Amir, we need to verify if your compliance suite can handle the 7-year log retention SEC requirement before the team reviews the technical brief on Tuesday. Please confirm. Sincerely, Michael Chen",
    account_id: "A003",
    accountId: "A003",
    deal_id: "D003",
    dealId: "D003",
    sender: "m.chen@globalbank.com",
    created_at: "2024-06-21T10:00:00Z"
  }
];
