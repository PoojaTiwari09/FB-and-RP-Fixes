import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  HubSpotDeal,
  HubSpotDealsResponse,
  TransformedDeal,
  DealBoard,
  HubSpotOwner,
} from '../interfaces/hubspot.types';

@Injectable()
export class HubSpotService {
  private readonly logger = new Logger(HubSpotService.name);
  private readonly baseUrl = 'https://api.hubapi.com/crm/v3';
  private readonly accessToken: string;
  private lastRequestTime = 0;
  private readonly minRequestInterval = 200; // 200ms between requests

  // Deterministic avatar colors for owners
  private readonly ownerColors = [
    '#DC2626', '#7C3AED', '#059669', '#D97706', '#2563EB',
    '#DB2777', '#0891B2', '#7C2D12', '#4338CA', '#065F46',
  ];

  private getOwnerColor(ownerName: string): string {
    let hash = 0;
    for (let i = 0; i < ownerName.length; i++) {
      hash = ownerName.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % this.ownerColors.length;
    return this.ownerColors[index];
  }

  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private async rateLimitDelay(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    if (timeSinceLastRequest < this.minRequestInterval) {
      await this.delay(this.minRequestInterval - timeSinceLastRequest);
    }
    this.lastRequestTime = Date.now();
  }

  constructor(private configService: ConfigService) {
    this.accessToken = this.configService.get<string>('HUBSPOT_ACCESS_TOKEN') || '';
    if (!this.accessToken) {
      this.logger.warn('HUBSPOT_ACCESS_TOKEN not set. HubSpot API calls will fail.');
    }
  }

  private async fetchFromHubSpot(endpoint: string, options: RequestInit = {}): Promise<any> {
    await this.rateLimitDelay();
    const url = `${this.baseUrl}${endpoint}`;

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      this.logger.log(`HubSpot API response status: ${response.status}`);

      if (!response.ok) {
        this.logger.error(`HubSpot API error: ${response.status}`);
        throw new Error(`HubSpot API error: ${response.status}`);
      }

      return await response.json();
    } catch (error: any) {
      this.logger.error(`Failed to fetch from HubSpot: ${error?.message || error}`);
      throw error;
    }
  }

  async getAllDeals(limit: number = 100): Promise<TransformedDeal[]> {
    try {
      const data: HubSpotDealsResponse = await this.fetchFromHubSpot(
        `/objects/deals?limit=${limit}&properties=dealname,amount,dealstage,pipeline,closedate,createdate,hs_lastmodifieddate,hubspot_owner_id,forecast_category,probability,dealtype`
      );

      // Get owners to map owner names
      const owners = await this.getOwners();
      this.logger.log(`Fetched ${owners.length} owners from HubSpot`);
      // Log first few owner IDs for debugging
      if (owners.length > 0) {
        this.logger.log(`Owner IDs sample: ${owners.slice(0, 3).map(o => `${o.id}=${o.firstName} ${o.lastName}`).join(', ')}`);
      }
      // HubSpot may return owner IDs as numbers — normalize to strings
      const ownerMap = new Map(owners.map(o => [String(o.id), o]));

      // Collect unique owner IDs from deals for debugging
      const dealOwnerIds = data.results
        .map(d => d.properties.hubspot_owner_id)
        .filter(id => !!id)
        .map(id => String(id));
      const uniqueDealOwnerIds = [...new Set(dealOwnerIds)];
      this.logger.log(`Deals have ${uniqueDealOwnerIds.length} unique owner IDs: ${uniqueDealOwnerIds.slice(0, 5).join(', ')}`);

      // Transform deals (skip contact fetching to avoid rate limits)
      const deals = await Promise.all(data.results.map(async (deal) => {
        const rawOwnerId = deal.properties.hubspot_owner_id;
        const ownerId = rawOwnerId ? String(rawOwnerId) : '';
        let owner = ownerId ? ownerMap.get(ownerId) || null : null;

        // Fallback: if batch getOwners didn't return this owner, try individual lookup
        if (!owner && ownerId) {
          this.logger.warn(`No owner in batch map for hubspot_owner_id=${ownerId} on deal ${deal.id}, trying individual lookup...`);
          try {
            owner = await this.getOwnerById(ownerId);
            if (owner) {
              this.logger.log(`Individual lookup succeeded for owner ${ownerId}: ${owner.firstName} ${owner.lastName}`);
            } else {
              this.logger.warn(`Individual lookup also failed for owner ${ownerId}`);
            }
          } catch (e) {
            this.logger.error(`Individual lookup error for owner ${ownerId}:`, e);
          }
        }
        return this.transformDeal(deal, owner, []);
      }));

      return deals;
    } catch (error) {
      this.logger.error('Error fetching deals from HubSpot:', error);
      throw error;
    }
  }

  async getDealsByPipeline(pipeline: string): Promise<TransformedDeal[]> {
    try {
      const allDeals = await this.getAllDeals();
      return allDeals.filter(deal => deal.pipeline === pipeline);
    } catch (error) {
      this.logger.error(`Error fetching deals for pipeline ${pipeline}:`, error);
      throw error;
    }
  }

  async getDealById(dealId: string): Promise<TransformedDeal | null> {
    try {
      const deal: HubSpotDeal = await this.fetchFromHubSpot(
        `/objects/deals/${dealId}?properties=dealname,amount,dealstage,pipeline,closedate,createdate,hs_lastmodifieddate,hubspot_owner_id,forecast_category,probability,dealtype`
      );

      if (!deal) return null;

      const ownerId = deal.properties.hubspot_owner_id || '';
      let owner: HubSpotOwner | null = null;
      
      try {
        owner = await this.getOwnerById(ownerId);
      } catch (e) {
        // Owner fetch failed, use default
      }

      // Skip fetching contacts to avoid rate limits
      return this.transformDeal(deal, owner, []);
    } catch (error) {
      this.logger.error(`Error fetching deal ${dealId}:`, error);
      throw error;
    }
  }

  async getOwners(): Promise<HubSpotOwner[]> {
    const allOwners: HubSpotOwner[] = [];
    let after: string | undefined = undefined;

    try {
      do {
        const url: string = after
          ? `https://api.hubapi.com/crm/v3/owners?after=${after}`
          : 'https://api.hubapi.com/crm/v3/owners';

        const response: Response = await fetch(url, {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
          },
        });

        if (!response.ok) {
          this.logger.error(`getOwners failed: HTTP ${response.status} ${response.statusText}`);
          return allOwners;
        }

        const data: any = await response.json();
        const page = data.results || [];
        allOwners.push(...page);

        after = data.paging?.next?.after;
      } while (after);

      this.logger.log(`getOwners returned ${allOwners.length} total results`);
      return allOwners;
    } catch (error) {
      this.logger.error('Error fetching owners:', error);
      return allOwners;
    }
  }

  async getOwnerById(ownerId: string): Promise<HubSpotOwner | null> {
    if (!ownerId) return null;
    
    try {
      const response = await fetch(`https://api.hubapi.com/crm/v3/owners/${ownerId}`, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
        },
      });

      if (!response.ok) {
        return null;
      }

      return await response.json();
    } catch (error) {
      this.logger.error(`Error fetching owner ${ownerId}:`, error);
      return null;
    }
  }

  async getAssociatedContacts(dealId: string): Promise<any[]> {
    try {
      const associations = await this.fetchFromHubSpot(
        `/objects/deals/${dealId}/associations/contacts`
      );

      if (!associations.results || associations.results.length === 0) {
        return [];
      }

      // Get contact details for each associated contact
      const contacts = await Promise.all(
        associations.results.map(async (assoc: any) => {
          try {
            const contact = await this.fetchFromHubSpot(
              `/objects/contacts/${assoc.toObjectId}?properties=firstname,lastname,email,phone`
            );
            return {
              contactId: contact.id,
              name: `${contact.properties.firstname || ''} ${contact.properties.lastname || ''}`.trim() || 'Unknown',
              email: contact.properties.email || '',
              phone: contact.properties.phone || '',
            };
          } catch (e) {
            return null;
          }
        })
      );

      return contacts.filter(c => c !== null);
    } catch (error) {
      this.logger.error(`Error fetching contacts for deal ${dealId}:`, error);
      return [];
    }
  }

  async getPipelines(): Promise<string[]> {
    try {
      const response = await fetch('https://api.hubapi.com/crm/v3/pipelines/deals', {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
        },
      });

      if (!response.ok) {
        return ['default'];
      }

      const data = await response.json();
      return data.results?.map((p: any) => p.id) || ['default'];
    } catch (error) {
      this.logger.error('Error fetching pipelines:', error);
      return ['default'];
    }
  }

  generateDealBoardsFromDeals(deals: TransformedDeal[]): DealBoard[] {
    // Group deals by pipeline
    const pipelineGroups = new Map<string, TransformedDeal[]>();
    
    deals.forEach(deal => {
      const pipeline = deal.pipeline || 'default';
      if (!pipelineGroups.has(pipeline)) {
        pipelineGroups.set(pipeline, []);
      }
      pipelineGroups.get(pipeline)!.push(deal);
    });

    // Create a board for each pipeline
    const boards: DealBoard[] = [];
    let boardId = 1;

    pipelineGroups.forEach((pipelineDeals, pipeline) => {
      const totalAmount = pipelineDeals.reduce((sum, d) => sum + d.amount, 0);
      const uniqueOwners = new Set(pipelineDeals.map(d => d.ownerId));
      
      boards.push({
        boardId: boardId.toString(),
        name: this.getPipelineDisplayName(pipeline),
        description: `Deals in ${this.getPipelineDisplayName(pipeline)} pipeline`,
        owner: pipelineDeals[0]?.ownerName || 'Unassigned',
        ownerId: pipelineDeals[0]?.ownerId || '',
        lastModified: new Date().toISOString(),
        dealCount: pipelineDeals.length,
        totalAmount,
        canEdit: true,
        pipeline,
      });
      boardId++;
    });

    // If no boards created, add a default one
    if (boards.length === 0) {
      boards.push({
        boardId: '1',
        name: 'All Deals',
        description: 'All HubSpot deals',
        owner: 'System',
        ownerId: '',
        lastModified: new Date().toISOString(),
        dealCount: deals.length,
        totalAmount: deals.reduce((sum, d) => sum + d.amount, 0),
        canEdit: true,
        pipeline: 'default',
      });
    }

    return boards;
  }

  private transformDeal(
    deal: HubSpotDeal,
    owner: HubSpotOwner | null,
    contacts: any[]
  ): TransformedDeal {
    const props = deal.properties;

    // Calculate AI score based on deal properties (mock algorithm)
    const aiScore = this.calculateAIScore(props);

    // Count warnings (deals without close date, low probability, etc.)
    const warnings = this.calculateWarnings(props);

    // Calculate MEDDPICC score (0-100)
    const meddpiccScore = this.calculateMEDDPICCScore(props, contacts);

    // Format amount as string for frontend
    const amountNum = parseFloat(props.amount || '0');
    let amountStr = '$0';
    if (amountNum >= 1000) {
      amountStr = `$${(amountNum / 1000).toFixed(0)}K`;
    } else {
      amountStr = `$${amountNum}`;
    }

    // Build owner details from HubSpot owner object
    const ownerName = owner ? `${owner.firstName} ${owner.lastName}`.trim() || 'Unassigned' : 'Unassigned';
    const ownerEmail = owner?.email || '';
    const initials = ownerName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    const ownerColor = ownerName !== 'Unassigned' ? this.getOwnerColor(ownerName) : '#9CA3AF';

    return {
      id: deal.id,
      dealId: deal.id,
      dealName: props.dealname || 'Untitled Deal',
      name: props.dealname || 'Untitled Deal',
      amount: amountNum,
      amountDisplay: amountStr,
      amountNum: amountNum,
      stage: this.mapDealStage(props.dealstage || ''),
      category: this.mapForecastCategory(props.forecast_category || ''),
      pipeline: props.pipeline || 'default',
      closeDate: props.closedate || '',
      createDate: props.createdate || deal.createdAt,
      ownerId: props.hubspot_owner_id || '',
      ownerName,
      assignedRep: ownerName,
      ownerEmail,
      owner: {
        name: ownerName,
        email: ownerEmail,
        initials: initials,
        color: ownerColor,
      },
      forecastCategory: this.mapForecastCategory(props.forecast_category || ''),
      probability: parseInt(props.probability || '0') || this.getStageProbability(props.dealstage || ''),
      dealType: props.dealtype || 'New Business',
      contacts: contacts.length,
      aiScore,
      aiScorePercent: aiScore,
      aiWarningCount: warnings,
      warnings,
      meddpiccPercent: meddpiccScore,
      meddpiccScore,
      playbookScore: meddpiccScore,
      playbookColor: meddpiccScore >= 75 ? 'green' : meddpiccScore >= 50 ? 'orange' : 'red',
      aiSuggestedNextStep: 'Schedule follow-up call',
      lastActivity: props.hs_lastmodifieddate || deal.updatedAt,
      nextStep: props.hs_nextstep || '',
      // Activity data for charts (mock values for now)
      activityData: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    };
  }

  private calculateAIScore(props: any): number {
    let score = 50; // Base score
    
    // Higher amount = higher score
    const amount = parseFloat(props.amount || '0');
    if (amount > 100000) score += 20;
    else if (amount > 50000) score += 15;
    else if (amount > 10000) score += 10;
    
    // Probability bonus
    const probability = parseInt(props.probability || '0');
    score += probability * 0.3;
    
    // Has close date = more likely to close
    if (props.closedate) score += 10;
    
    // Cap at 100
    return Math.min(100, Math.round(score));
  }

  private calculateWarnings(props: any): number {
    let warnings = 0;
    
    // No close date
    if (!props.closedate) warnings++;
    
    // Low probability
    const probability = parseInt(props.probability || '0');
    if (probability < 30) warnings++;
    
    // High amount with low probability
    const amount = parseFloat(props.amount || '0');
    if (amount > 100000 && probability < 50) warnings++;
    
    // No deal name
    if (!props.dealname || props.dealname === 'Untitled Deal') warnings++;
    
    return Math.min(warnings, 5);
  }

  private calculateMEDDPICCScore(props: any, contacts: any[]): number {
    let score = 0;
    
    // Metrics - has amount
    if (props.amount) score += 15;
    
    // Economic Buyer - owner assigned
    if (props.hubspot_owner_id) score += 15;
    
    // Decision Criteria - has stage
    if (props.dealstage) score += 10;
    
    // Decision Process - has probability
    if (props.probability) score += 10;
    
    // Identify Pain - deal name meaningful
    if (props.dealname && props.dealname.length > 10) score += 15;
    
    // Champion - has contacts
    if (contacts.length > 0) score += 15;
    
    // Competition - has close date
    if (props.closedate) score += 10;
    
    return Math.min(100, score);
  }

  private mapDealStage(stage: string): string {
    const stageMap: Record<string, string> = {
      // HubSpot internal stages
      'appointmentscheduled': 'Discovery',
      'qualifiedtobuy': 'Demo',
      'presentationscheduled': 'Proposal',
      'decisionmakerboughtin': 'Negotiation',
      'contractsent': 'Negotiation',
      'closedwon': 'Closed Won',
      'closedlost': 'Closed Lost',
      // Direct matches from UI
      'discovery': 'Discovery',
      'demo': 'Demo',
      'proposal': 'Proposal',
      'negotiation': 'Negotiation',
    };
    
    return stageMap[stage.toLowerCase()] || 'Discovery';
  }

  private mapForecastCategory(category: string): string {
    const categoryMap: Record<string, string> = {
      'commit': 'Commit',
      'mostlikely': 'Most Likely',
      'bestcase': 'Best Case',
      'pipeline': 'Pipeline',
      'closed': 'Closed',
    };
    
    return categoryMap[category.toLowerCase()] || 'Pipeline';
  }

  private getStageProbability(stage: string): number {
    const probabilityMap: Record<string, number> = {
      'appointmentscheduled': 10,
      'qualifiedtobuy': 20,
      'presentationscheduled': 40,
      'decisionmakerboughtin': 60,
      'contractsent': 80,
      'closedwon': 100,
      'closedlost': 0,
    };
    
    return probabilityMap[stage.toLowerCase()] || 20;
  }

  private getPipelineDisplayName(pipeline: string): string {
    const nameMap: Record<string, string> = {
      'default': 'Sales Pipeline',
      'sales': 'Sales Pipeline',
      'marketing': 'Marketing Pipeline',
      'partner': 'Partner Pipeline',
    };
    
    return nameMap[pipeline.toLowerCase()] || `${pipeline.charAt(0).toUpperCase() + pipeline.slice(1)} Pipeline`;
  }

  private stageIdCache: Record<string, string> | null = null;

  private async getPipelineStageMap(): Promise<Record<string, string>> {
    if (this.stageIdCache) return this.stageIdCache;

    try {
      // Fetch pipeline stages from HubSpot
      const data = await this.fetchFromHubSpot('/pipelines/deals/default/stages');
      const stages = data.results || [];

      this.logger.log(`Fetched ${stages.length} pipeline stages from HubSpot`);

      // Build mapping from stage label (lowercase) to stage ID
      const stageMap: Record<string, string> = {};
      for (const stage of stages) {
        stageMap[stage.label.toLowerCase()] = stage.id;
        this.logger.log(`HubSpot stage: "${stage.label}" = ${stage.id}`);
      }

      // Add closed won/lost which may not be in pipeline stages
      stageMap['closed won'] = 'closedwon';
      stageMap['closed lost'] = 'closedlost';

      this.stageIdCache = stageMap;
      return stageMap;
    } catch (error) {
      this.logger.warn('Failed to fetch pipeline stages, using fallback mapping:', error);
      // Fallback mapping based on known HubSpot default pipeline
      return {
        'qualification': '3778172665',
        'discovery': '3778172661',
        'demo': '3778172662',
        'proposal': '3778172663',
        'negotiation': '3778172664',
        'closed won': 'closedwon',
        'closed lost': 'closedlost',
      };
    }
  }

  async updateDeal(
    dealId: string,
    updates: {
      stage?: string;
      forecastCategory?: string;
      amount?: string;
      nextStep?: string;
      meddpiccPercent?: number;
    }
  ): Promise<any> {
    this.logger.log(`Updating HubSpot deal ${dealId} with:`, updates);

    // Build HubSpot API patch body - only use standard HubSpot properties
    const properties: Record<string, any> = {};

    // Map stage to HubSpot dealstage using dynamic pipeline stage mapping
    if (updates.stage) {
      const stageMap = await this.getPipelineStageMap();
      const stageId = stageMap[updates.stage.toLowerCase()];

      if (stageId) {
        properties.dealstage = stageId;
        this.logger.log(`Mapping stage "${updates.stage}" to HubSpot ID: ${stageId}`);
      } else {
        this.logger.warn(`No HubSpot stage mapping found for "${updates.stage}", sending as-is`);
        properties.dealstage = updates.stage;
      }
    }

    // Map amount (standard HubSpot property)
    if (updates.amount) {
      properties.amount = updates.amount;
    }

    // Note: forecastCategory, nextStep, and meddpiccPercent are skipped
    // because these properties don't exist in your HubSpot portal.

    try {
      const data = await this.fetchFromHubSpot(`/objects/deals/${dealId}`, {
        method: 'PATCH',
        body: JSON.stringify({ properties }),
      });

      this.logger.log(`Successfully updated deal ${dealId}`);
      return data;
    } catch (error) {
      this.logger.error(`Failed to update deal in HubSpot:`, error);
      throw error;
    }
  }
}
