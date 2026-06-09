import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { AxiosError } from 'axios';
import {
  HubSpotDeal,
  HubSpotContact,
  HubSpotActivity,
  HubSpotOwner,
  HubSpotPaginatedResponse,
  HubSpotAssociation,
} from '@/interfaces/hubspot-types.interface';

@Injectable()
export class HubSpotClientService {
  private readonly logger = new Logger(HubSpotClientService.name);
  private readonly accessToken: string;
  private readonly apiUrl: string;
  private readonly rateLimit: {
    max: number;
    window: number;
    requests: number[];
  };

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.accessToken =
      this.configService.get<string>('HUBSPOT_ACCESS_TOKEN') ||
      this.configService.get<string>('HUBSPOT_API_KEY') ||
      '';
    this.apiUrl = this.configService.get<string>('HUBSPOT_API_URL') || 'https://api.hubapi.com';
    this.rateLimit = {
      max: this.configService.get<number>('HUBSPOT_RATE_LIMIT_MAX', 100),
      window: this.configService.get<number>('HUBSPOT_RATE_LIMIT_WINDOW', 10000),
      requests: [],
    };
  }

  isConfigured(): boolean {
    return Boolean(this.accessToken);
  }

  private async checkRateLimit(): Promise<void> {
    const now = Date.now();
    this.rateLimit.requests = this.rateLimit.requests.filter(
      (timestamp) => now - timestamp < this.rateLimit.window,
    );

    if (this.rateLimit.requests.length >= this.rateLimit.max) {
      const oldestRequest = this.rateLimit.requests[0];
      const waitTime = this.rateLimit.window - (now - oldestRequest);
      this.logger.warn(`Rate limit reached. Waiting ${waitTime}ms`);
      await new Promise((resolve) => setTimeout(resolve, waitTime));
      return this.checkRateLimit();
    }

    this.rateLimit.requests.push(now);
  }

  private async request<T>(
    method: 'GET' | 'POST' | 'PATCH' | 'DELETE',
    endpoint: string,
    data?: any,
    params?: any,
  ): Promise<T> {
    await this.checkRateLimit();

    try {
      const response = await firstValueFrom(
        this.httpService.request<T>({
          method,
          url: `${this.apiUrl}${endpoint}`,
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
          },
          data,
          params,
        }),
      );

      return (response as { data: T }).data;
    } catch (error) {
      this.handleError(error as AxiosError);
    }
  }

  private handleError(error: AxiosError): never {
    const status = error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR;
    const message = (error.response?.data as any)?.message || error.message;

    this.logger.error(`HubSpot API Error: ${message}`, error.stack);

    throw new HttpException(
      {
        statusCode: status,
        message: `HubSpot API Error: ${message}`,
        error: 'HubSpot Integration Error',
      },
      status,
    );
  }

  // ==================== DEALS ====================

  async getDeals(
    limit: number = 100,
    after?: string,
    properties?: string[],
  ): Promise<HubSpotPaginatedResponse<HubSpotDeal>> {
    const defaultProperties = [
      'dealname',
      'dealstage',
      'amount',
      'closedate',
      'pipeline',
      'hs_forecast_category',
      'hs_forecast_probability',
      'hubspot_owner_id',
      'hs_lastmodifieddate',
      'createdate',
    ];

    return this.request<HubSpotPaginatedResponse<HubSpotDeal>>(
      'GET',
      '/crm/v3/objects/deals',
      null,
      {
        limit,
        after,
        properties: properties || defaultProperties,
      },
    );
  }

  async getDealById(dealId: string, properties?: string[]): Promise<HubSpotDeal> {
    const defaultProperties = [
      'dealname',
      'dealstage',
      'amount',
      'closedate',
      'pipeline',
      'hs_forecast_category',
      'hs_forecast_probability',
      'hubspot_owner_id',
      'hs_lastmodifieddate',
      'createdate',
    ];

    return this.request<HubSpotDeal>(
      'GET',
      `/crm/v3/objects/deals/${dealId}`,
      null,
      {
        properties: properties || defaultProperties,
      },
    );
  }

  async createDeal(properties: Record<string, any>): Promise<HubSpotDeal> {
    return this.request<HubSpotDeal>('POST', '/crm/v3/objects/deals', {
      properties,
    });
  }

  async updateDeal(
    dealId: string,
    properties: Record<string, any>,
    idProperty?: string,
  ): Promise<HubSpotDeal> {
    return this.request<HubSpotDeal>(
      'PATCH',
      `/crm/v3/objects/deals/${dealId}`,
      {
        properties,
      },
      idProperty ? { idProperty } : undefined,
    );
  }

  async findDealsByExactName(dealName: string): Promise<HubSpotDeal[]> {
    return this.searchDeals([
      {
        filters: [
          {
            propertyName: 'dealname',
            operator: 'EQ',
            value: dealName,
          },
        ],
      },
    ]);
  }

  async getDealAssociations(
    dealId: string,
    toObjectType: 'contacts' | 'companies',
  ): Promise<HubSpotAssociation[]> {
    const response = await this.request<{ results: HubSpotAssociation[] }>(
      'GET',
      `/crm/v3/objects/deals/${dealId}/associations/${toObjectType}`,
    );
    return response.results;
  }

  // ==================== CONTACTS ====================

  async getContacts(
    limit: number = 100,
    after?: string,
  ): Promise<HubSpotPaginatedResponse<HubSpotContact>> {
    return this.request<HubSpotPaginatedResponse<HubSpotContact>>(
      'GET',
      '/crm/v3/objects/contacts',
      null,
      {
        limit,
        after,
        properties: ['firstname', 'lastname', 'email', 'jobtitle', 'phone', 'company'],
      },
    );
  }

  async getContactById(contactId: string): Promise<HubSpotContact> {
    return this.request<HubSpotContact>('GET', `/crm/v3/objects/contacts/${contactId}`, null, {
      properties: ['firstname', 'lastname', 'email', 'jobtitle', 'phone', 'company'],
    });
  }

  async getContactsByDeal(dealId: string): Promise<HubSpotContact[]> {
    const associations = await this.getDealAssociations(dealId, 'contacts');
    const contacts = await Promise.all(
      associations.map((assoc) => this.getContactById(assoc.id)),
    );
    return contacts;
  }

  // ==================== ACTIVITIES ====================

  async getCallsForDeal(dealId: string): Promise<HubSpotActivity[]> {
    const response = await this.request<HubSpotPaginatedResponse<HubSpotActivity>>(
      'GET',
      `/crm/v3/objects/calls`,
      null,
      {
        limit: 100,
        properties: ['hs_timestamp', 'hs_call_title', 'hs_call_body', 'hs_call_duration'],
      },
    );
    return response.results;
  }

  async getEmailsForDeal(dealId: string): Promise<HubSpotActivity[]> {
    const response = await this.request<HubSpotPaginatedResponse<HubSpotActivity>>(
      'GET',
      `/crm/v3/objects/emails`,
      null,
      {
        limit: 100,
        properties: ['hs_timestamp', 'hs_email_subject', 'hs_email_text'],
      },
    );
    return response.results;
  }

  // ==================== OWNERS ====================

  async getOwners(): Promise<HubSpotOwner[]> {
    const response = await this.request<{ results: HubSpotOwner[] }>('GET', '/crm/v3/owners');
    return response.results;
  }

  async getOwnerById(ownerId: string): Promise<HubSpotOwner> {
    return this.request<HubSpotOwner>('GET', `/crm/v3/owners/${ownerId}`);
  }

  // ==================== SEARCH ====================

  async searchDeals(filters: any): Promise<HubSpotDeal[]> {
    const response = await this.request<HubSpotPaginatedResponse<HubSpotDeal>>(
      'POST',
      '/crm/v3/objects/deals/search',
      {
        filterGroups: filters,
        properties: [
          'dealname',
          'dealstage',
          'amount',
          'closedate',
          'pipeline',
          'hs_forecast_category',
          'hubspot_owner_id',
        ],
        limit: 100,
      },
    );
    return response.results;
  }

  // ==================== BATCH OPERATIONS ====================

  async batchGetDeals(dealIds: string[]): Promise<HubSpotDeal[]> {
    const response = await this.request<{ results: HubSpotDeal[] }>(
      'POST',
      '/crm/v3/objects/deals/batch/read',
      {
        properties: [
          'dealname',
          'dealstage',
          'amount',
          'closedate',
          'pipeline',
          'hs_forecast_category',
          'hubspot_owner_id',
        ],
        inputs: dealIds.map((id) => ({ id })),
      },
    );
    return response.results;
  }
}
