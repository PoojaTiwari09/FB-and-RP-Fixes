export interface HubSpotDeal {
    id: string;
    properties: {
        dealname?: string;
        amount?: string;
        dealstage?: string;
        pipeline?: string;
        closedate?: string;
        createdate?: string;
        hs_lastmodifieddate?: string;
        hubspot_owner_id?: string;
        forecast_category?: string;
        probability?: string;
        dealtype?: string;
        [key: string]: any;
    };
    associations?: any;
    createdAt: string;
    updatedAt: string;
    archived: boolean;
}
export interface HubSpotContact {
    id: string;
    properties: {
        firstname?: string;
        lastname?: string;
        email?: string;
        phone?: string;
        [key: string]: any;
    };
}
export interface HubSpotOwner {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
}
export interface HubSpotDealsResponse {
    results: HubSpotDeal[];
    paging?: {
        next?: {
            after: string;
            link: string;
        };
    };
}
export interface TransformedDeal {
    id: string;
    dealId: string;
    dealName: string;
    name: string;
    amount: number;
    amountDisplay: string;
    amountNum: number;
    stage: string;
    category: string;
    pipeline: string;
    closeDate: string;
    createDate: string;
    ownerId: string;
    ownerName: string;
    assignedRep: string;
    ownerEmail: string;
    owner: {
        name: string;
        email: string;
        initials: string;
        color: string;
    };
    forecastCategory: string;
    probability: number;
    dealType: string;
    contacts: number;
    aiScore: number;
    aiScorePercent: number;
    aiWarningCount: number;
    warnings: number;
    meddpiccScore: number;
    meddpiccPercent: number;
    playbookScore: number;
    playbookColor: string;
    aiSuggestedNextStep: string;
    lastActivity: string;
    nextStep?: string;
    activityData?: number[];
}
export interface DealBoard {
    boardId: string;
    name: string;
    description: string;
    owner: string;
    ownerId: string;
    lastModified: string;
    dealCount: number;
    totalAmount: number;
    canEdit: boolean;
    pipeline: string;
}
