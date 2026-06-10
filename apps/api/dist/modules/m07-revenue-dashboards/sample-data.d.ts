export declare const SAMPLE_OBJECT_FIELDS: {
    readonly deals: readonly ["dealName", "amount", "stage", "ownerName", "accountName", "quarter"];
    readonly accounts: readonly ["accountName", "ownerName", "industry", "segment"];
    readonly calls: readonly ["ownerName", "durationSec", "occurredAt", "accountName"];
    readonly transcriptions: readonly ["transcriptText", "occurredAt", "accountName", "sentiment"];
};
export declare const SAMPLE_RELATIONSHIPS: readonly [{
    readonly sourceObject: "deals";
    readonly sourceField: "accountName";
    readonly targetObject: "accounts";
    readonly targetField: "accountName";
    readonly status: "AUTO_DETECTED";
    readonly validationMessage: "Detected shared accountName join between deals and accounts.";
}, {
    readonly sourceObject: "calls";
    readonly sourceField: "accountName";
    readonly targetObject: "accounts";
    readonly targetField: "accountName";
    readonly status: "AUTO_DETECTED";
    readonly validationMessage: "Detected shared accountName join between calls and accounts.";
}, {
    readonly sourceObject: "transcriptions";
    readonly sourceField: "accountName";
    readonly targetObject: "accounts";
    readonly targetField: "accountName";
    readonly status: "AUTO_DETECTED";
    readonly validationMessage: "Detected shared accountName join between transcriptions and accounts.";
}];
export declare const SAMPLE_DATA: {
    readonly deals: readonly [{
        readonly dealName: "Northwind Renewal";
        readonly amount: 58000;
        readonly stage: "Closed Won";
        readonly ownerName: "Aisha Khan";
        readonly accountName: "Northwind";
        readonly quarter: "Q2-2026";
        readonly teamName: "North Team";
    }, {
        readonly dealName: "Globex Expansion";
        readonly amount: 42000;
        readonly stage: "Negotiation";
        readonly ownerName: "Aisha Khan";
        readonly accountName: "Globex";
        readonly quarter: "Q2-2026";
        readonly teamName: "North Team";
    }, {
        readonly dealName: "Initech New Logo";
        readonly amount: 31000;
        readonly stage: "Closed Lost";
        readonly ownerName: "Aisha Khan";
        readonly accountName: "Initech";
        readonly quarter: "Q1-2026";
        readonly teamName: "North Team";
    }, {
        readonly dealName: "Umbrella Upsell";
        readonly amount: 76000;
        readonly stage: "Closed Won";
        readonly ownerName: "Marcus Lee";
        readonly accountName: "Umbrella";
        readonly quarter: "Q1-2026";
        readonly teamName: "Strategic Team";
    }];
    readonly accounts: readonly [{
        readonly accountName: "Northwind";
        readonly ownerName: "Aisha Khan";
        readonly industry: "SaaS";
        readonly segment: "Mid-Market";
    }, {
        readonly accountName: "Globex";
        readonly ownerName: "Aisha Khan";
        readonly industry: "Manufacturing";
        readonly segment: "Enterprise";
    }, {
        readonly accountName: "Initech";
        readonly ownerName: "Aisha Khan";
        readonly industry: "Fintech";
        readonly segment: "SMB";
    }, {
        readonly accountName: "Umbrella";
        readonly ownerName: "Marcus Lee";
        readonly industry: "Healthcare";
        readonly segment: "Enterprise";
    }];
    readonly calls: readonly [{
        readonly ownerName: "Aisha Khan";
        readonly durationSec: 1820;
        readonly occurredAt: "2026-05-12T09:00:00.000Z";
        readonly accountName: "Northwind";
    }, {
        readonly ownerName: "Aisha Khan";
        readonly durationSec: 1260;
        readonly occurredAt: "2026-05-13T11:00:00.000Z";
        readonly accountName: "Globex";
    }, {
        readonly ownerName: "Marcus Lee";
        readonly durationSec: 2040;
        readonly occurredAt: "2026-02-18T16:00:00.000Z";
        readonly accountName: "Umbrella";
    }];
    readonly transcriptions: readonly [{
        readonly transcriptText: "Customer aligned on budget and next-step timeline.";
        readonly occurredAt: "2026-05-12T09:00:00.000Z";
        readonly accountName: "Northwind";
        readonly sentiment: "positive";
    }, {
        readonly transcriptText: "Pricing objection remains open with procurement.";
        readonly occurredAt: "2026-05-13T11:00:00.000Z";
        readonly accountName: "Globex";
        readonly sentiment: "mixed";
    }, {
        readonly transcriptText: "Champion requested legal review before signature.";
        readonly occurredAt: "2026-02-18T16:00:00.000Z";
        readonly accountName: "Umbrella";
        readonly sentiment: "positive";
    }];
};
