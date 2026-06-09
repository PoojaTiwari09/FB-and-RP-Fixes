export const SAMPLE_OBJECT_FIELDS = {
  deals: ["dealName", "amount", "stage", "ownerName", "accountName", "quarter"],
  accounts: ["accountName", "ownerName", "industry", "segment"],
  calls: ["ownerName", "durationSec", "occurredAt", "accountName"],
  transcriptions: ["transcriptText", "occurredAt", "accountName", "sentiment"],
} as const;

export const SAMPLE_RELATIONSHIPS = [
  {
    sourceObject: "deals",
    sourceField: "accountName",
    targetObject: "accounts",
    targetField: "accountName",
    status: "AUTO_DETECTED",
    validationMessage: "Detected shared accountName join between deals and accounts.",
  },
  {
    sourceObject: "calls",
    sourceField: "accountName",
    targetObject: "accounts",
    targetField: "accountName",
    status: "AUTO_DETECTED",
    validationMessage: "Detected shared accountName join between calls and accounts.",
  },
  {
    sourceObject: "transcriptions",
    sourceField: "accountName",
    targetObject: "accounts",
    targetField: "accountName",
    status: "AUTO_DETECTED",
    validationMessage: "Detected shared accountName join between transcriptions and accounts.",
  },
] as const;

export const SAMPLE_DATA = {
  deals: [
    {
      dealName: "Northwind Renewal",
      amount: 58000,
      stage: "Closed Won",
      ownerName: "Aisha Khan",
      accountName: "Northwind",
      quarter: "Q2-2026",
      teamName: "North Team",
    },
    {
      dealName: "Globex Expansion",
      amount: 42000,
      stage: "Negotiation",
      ownerName: "Aisha Khan",
      accountName: "Globex",
      quarter: "Q2-2026",
      teamName: "North Team",
    },
    {
      dealName: "Initech New Logo",
      amount: 31000,
      stage: "Closed Lost",
      ownerName: "Aisha Khan",
      accountName: "Initech",
      quarter: "Q1-2026",
      teamName: "North Team",
    },
    {
      dealName: "Umbrella Upsell",
      amount: 76000,
      stage: "Closed Won",
      ownerName: "Marcus Lee",
      accountName: "Umbrella",
      quarter: "Q1-2026",
      teamName: "Strategic Team",
    },
  ],
  accounts: [
    { accountName: "Northwind", ownerName: "Aisha Khan", industry: "SaaS", segment: "Mid-Market" },
    { accountName: "Globex", ownerName: "Aisha Khan", industry: "Manufacturing", segment: "Enterprise" },
    { accountName: "Initech", ownerName: "Aisha Khan", industry: "Fintech", segment: "SMB" },
    { accountName: "Umbrella", ownerName: "Marcus Lee", industry: "Healthcare", segment: "Enterprise" },
  ],
  calls: [
    { ownerName: "Aisha Khan", durationSec: 1820, occurredAt: "2026-05-12T09:00:00.000Z", accountName: "Northwind" },
    { ownerName: "Aisha Khan", durationSec: 1260, occurredAt: "2026-05-13T11:00:00.000Z", accountName: "Globex" },
    { ownerName: "Marcus Lee", durationSec: 2040, occurredAt: "2026-02-18T16:00:00.000Z", accountName: "Umbrella" },
  ],
  transcriptions: [
    {
      transcriptText: "Customer aligned on budget and next-step timeline.",
      occurredAt: "2026-05-12T09:00:00.000Z",
      accountName: "Northwind",
      sentiment: "positive",
    },
    {
      transcriptText: "Pricing objection remains open with procurement.",
      occurredAt: "2026-05-13T11:00:00.000Z",
      accountName: "Globex",
      sentiment: "mixed",
    },
    {
      transcriptText: "Champion requested legal review before signature.",
      occurredAt: "2026-02-18T16:00:00.000Z",
      accountName: "Umbrella",
      sentiment: "positive",
    },
  ],
} as const;
