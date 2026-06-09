export interface HubSpotDeal {
  id: string;
  properties: {
    dealname: string;
    dealstage: string;
    amount: string;
    closedate: string;
    pipeline: string;
    hs_forecast_category: string;
    hs_forecast_probability: string;
    hubspot_owner_id: string;
    hs_lastmodifieddate: string;
    createdate: string;
    [key: string]: any;
  };
  createdAt: string;
  updatedAt: string;
  archived: boolean;
}

export interface HubSpotContact {
  id: string;
  properties: {
    firstname: string;
    lastname: string;
    email: string;
    jobtitle: string;
    phone: string;
    company: string;
    hs_object_id: string;
    [key: string]: any;
  };
  createdAt: string;
  updatedAt: string;
  archived: boolean;
}

export interface HubSpotActivity {
  id: string;
  properties: {
    hs_timestamp: string;
    hs_activity_type: string;
    hs_call_title?: string;
    hs_call_body?: string;
    hs_call_duration?: string;
    hs_email_subject?: string;
    hs_email_text?: string;
    [key: string]: any;
  };
  createdAt: string;
  updatedAt: string;
}

export interface HubSpotOwner {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  userId: number;
  createdAt: string;
  updatedAt: string;
  archived: boolean;
}

export interface HubSpotWebhookPayload {
  objectId: number;
  propertyName: string;
  propertyValue: string;
  changeSource: string;
  eventId: number;
  subscriptionId: number;
  portalId: number;
  appId: number;
  occurredAt: number;
  subscriptionType: string;
  attemptNumber: number;
}

export interface HubSpotPaginatedResponse<T> {
  results: T[];
  paging?: {
    next?: {
      after: string;
      link: string;
    };
  };
}

export interface HubSpotAssociation {
  id: string;
  type: string;
}

export enum HubSpotDealStage {
  APPOINTMENT_SCHEDULED = 'appointmentscheduled',
  QUALIFIED_TO_BUY = 'qualifiedtobuy',
  PRESENTATION_SCHEDULED = 'presentationscheduled',
  DECISION_MAKER_BOUGHT_IN = 'decisionmakerboughtin',
  CONTRACT_SENT = 'contractsent',
  CLOSED_WON = 'closedwon',
  CLOSED_LOST = 'closedlost',
}

export enum HubSpotForecastCategory {
  PIPELINE = 'PIPELINE',
  BEST_CASE = 'BEST_CASE',
  COMMIT = 'COMMIT',
  CLOSED = 'CLOSED',
}
