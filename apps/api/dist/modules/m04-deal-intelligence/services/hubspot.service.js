"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var HubSpotService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.HubSpotService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
let HubSpotService = HubSpotService_1 = class HubSpotService {
    configService;
    logger = new common_1.Logger(HubSpotService_1.name);
    baseUrl = 'https://api.hubapi.com/crm/v3';
    accessToken;
    lastRequestTime = 0;
    minRequestInterval = 200;
    ownerColors = [
        '#DC2626', '#7C3AED', '#059669', '#D97706', '#2563EB',
        '#DB2777', '#0891B2', '#7C2D12', '#4338CA', '#065F46',
    ];
    getOwnerColor(ownerName) {
        let hash = 0;
        for (let i = 0; i < ownerName.length; i++) {
            hash = ownerName.charCodeAt(i) + ((hash << 5) - hash);
        }
        const index = Math.abs(hash) % this.ownerColors.length;
        return this.ownerColors[index];
    }
    async delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    async rateLimitDelay() {
        const now = Date.now();
        const timeSinceLastRequest = now - this.lastRequestTime;
        if (timeSinceLastRequest < this.minRequestInterval) {
            await this.delay(this.minRequestInterval - timeSinceLastRequest);
        }
        this.lastRequestTime = Date.now();
    }
    constructor(configService) {
        this.configService = configService;
        this.accessToken = this.configService.get('HUBSPOT_ACCESS_TOKEN') || '';
        if (!this.accessToken) {
            this.logger.warn('HUBSPOT_ACCESS_TOKEN not set. HubSpot API calls will fail.');
        }
    }
    async fetchFromHubSpot(endpoint, options = {}) {
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
        }
        catch (error) {
            this.logger.error(`Failed to fetch from HubSpot: ${error?.message || error}`);
            throw error;
        }
    }
    async getAllDeals(limit = 100) {
        try {
            const data = await this.fetchFromHubSpot(`/objects/deals?limit=${limit}&properties=dealname,amount,dealstage,pipeline,closedate,createdate,hs_lastmodifieddate,hubspot_owner_id,forecast_category,probability,dealtype`);
            const owners = await this.getOwners();
            this.logger.log(`Fetched ${owners.length} owners from HubSpot`);
            if (owners.length > 0) {
                this.logger.log(`Owner IDs sample: ${owners.slice(0, 3).map(o => `${o.id}=${o.firstName} ${o.lastName}`).join(', ')}`);
            }
            const ownerMap = new Map(owners.map(o => [String(o.id), o]));
            const dealOwnerIds = data.results
                .map(d => d.properties.hubspot_owner_id)
                .filter(id => !!id)
                .map(id => String(id));
            const uniqueDealOwnerIds = [...new Set(dealOwnerIds)];
            this.logger.log(`Deals have ${uniqueDealOwnerIds.length} unique owner IDs: ${uniqueDealOwnerIds.slice(0, 5).join(', ')}`);
            const deals = await Promise.all(data.results.map(async (deal) => {
                const rawOwnerId = deal.properties.hubspot_owner_id;
                const ownerId = rawOwnerId ? String(rawOwnerId) : '';
                let owner = ownerId ? ownerMap.get(ownerId) || null : null;
                if (!owner && ownerId) {
                    this.logger.warn(`No owner in batch map for hubspot_owner_id=${ownerId} on deal ${deal.id}, trying individual lookup...`);
                    try {
                        owner = await this.getOwnerById(ownerId);
                        if (owner) {
                            this.logger.log(`Individual lookup succeeded for owner ${ownerId}: ${owner.firstName} ${owner.lastName}`);
                        }
                        else {
                            this.logger.warn(`Individual lookup also failed for owner ${ownerId}`);
                        }
                    }
                    catch (e) {
                        this.logger.error(`Individual lookup error for owner ${ownerId}:`, e);
                    }
                }
                return this.transformDeal(deal, owner, []);
            }));
            return deals;
        }
        catch (error) {
            this.logger.error('Error fetching deals from HubSpot:', error);
            throw error;
        }
    }
    async getDealsByPipeline(pipeline) {
        try {
            const allDeals = await this.getAllDeals();
            return allDeals.filter(deal => deal.pipeline === pipeline);
        }
        catch (error) {
            this.logger.error(`Error fetching deals for pipeline ${pipeline}:`, error);
            throw error;
        }
    }
    async getDealById(dealId) {
        try {
            const deal = await this.fetchFromHubSpot(`/objects/deals/${dealId}?properties=dealname,amount,dealstage,pipeline,closedate,createdate,hs_lastmodifieddate,hubspot_owner_id,forecast_category,probability,dealtype`);
            if (!deal)
                return null;
            const ownerId = deal.properties.hubspot_owner_id || '';
            let owner = null;
            try {
                owner = await this.getOwnerById(ownerId);
            }
            catch (e) {
            }
            return this.transformDeal(deal, owner, []);
        }
        catch (error) {
            this.logger.error(`Error fetching deal ${dealId}:`, error);
            throw error;
        }
    }
    async getOwners() {
        const allOwners = [];
        let after = undefined;
        try {
            do {
                const url = after
                    ? `https://api.hubapi.com/crm/v3/owners?after=${after}`
                    : 'https://api.hubapi.com/crm/v3/owners';
                const response = await fetch(url, {
                    headers: {
                        'Authorization': `Bearer ${this.accessToken}`,
                    },
                });
                if (!response.ok) {
                    this.logger.error(`getOwners failed: HTTP ${response.status} ${response.statusText}`);
                    return allOwners;
                }
                const data = await response.json();
                const page = data.results || [];
                allOwners.push(...page);
                after = data.paging?.next?.after;
            } while (after);
            this.logger.log(`getOwners returned ${allOwners.length} total results`);
            return allOwners;
        }
        catch (error) {
            this.logger.error('Error fetching owners:', error);
            return allOwners;
        }
    }
    async getOwnerById(ownerId) {
        if (!ownerId)
            return null;
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
        }
        catch (error) {
            this.logger.error(`Error fetching owner ${ownerId}:`, error);
            return null;
        }
    }
    async getAssociatedContacts(dealId) {
        try {
            const associations = await this.fetchFromHubSpot(`/objects/deals/${dealId}/associations/contacts`);
            if (!associations.results || associations.results.length === 0) {
                return [];
            }
            const contacts = await Promise.all(associations.results.map(async (assoc) => {
                try {
                    const contact = await this.fetchFromHubSpot(`/objects/contacts/${assoc.toObjectId}?properties=firstname,lastname,email,phone`);
                    return {
                        contactId: contact.id,
                        name: `${contact.properties.firstname || ''} ${contact.properties.lastname || ''}`.trim() || 'Unknown',
                        email: contact.properties.email || '',
                        phone: contact.properties.phone || '',
                    };
                }
                catch (e) {
                    return null;
                }
            }));
            return contacts.filter(c => c !== null);
        }
        catch (error) {
            this.logger.error(`Error fetching contacts for deal ${dealId}:`, error);
            return [];
        }
    }
    async getPipelines() {
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
            return data.results?.map((p) => p.id) || ['default'];
        }
        catch (error) {
            this.logger.error('Error fetching pipelines:', error);
            return ['default'];
        }
    }
    generateDealBoardsFromDeals(deals) {
        const pipelineGroups = new Map();
        deals.forEach(deal => {
            const pipeline = deal.pipeline || 'default';
            if (!pipelineGroups.has(pipeline)) {
                pipelineGroups.set(pipeline, []);
            }
            pipelineGroups.get(pipeline).push(deal);
        });
        const boards = [];
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
    transformDeal(deal, owner, contacts) {
        const props = deal.properties;
        const aiScore = this.calculateAIScore(props);
        const warnings = this.calculateWarnings(props);
        const meddpiccScore = this.calculateMEDDPICCScore(props, contacts);
        const amountNum = parseFloat(props.amount || '0');
        let amountStr = '$0';
        if (amountNum >= 1000) {
            amountStr = `$${(amountNum / 1000).toFixed(0)}K`;
        }
        else {
            amountStr = `$${amountNum}`;
        }
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
            activityData: Array(10).fill(0),
        };
    }
    calculateAIScore(props) {
        let score = 50;
        const amount = parseFloat(props.amount || '0');
        if (amount > 100000)
            score += 20;
        else if (amount > 50000)
            score += 15;
        else if (amount > 10000)
            score += 10;
        const probability = parseInt(props.probability || '0');
        score += probability * 0.3;
        if (props.closedate)
            score += 10;
        return Math.min(100, Math.round(score));
    }
    calculateWarnings(props) {
        let warnings = 0;
        if (!props.closedate)
            warnings++;
        const probability = parseInt(props.probability || '0');
        if (probability < 30)
            warnings++;
        const amount = parseFloat(props.amount || '0');
        if (amount > 100000 && probability < 50)
            warnings++;
        if (!props.dealname || props.dealname === 'Untitled Deal')
            warnings++;
        return Math.min(warnings, 5);
    }
    calculateMEDDPICCScore(props, contacts) {
        let score = 0;
        if (props.amount)
            score += 15;
        if (props.hubspot_owner_id)
            score += 15;
        if (props.dealstage)
            score += 10;
        if (props.probability)
            score += 10;
        if (props.dealname && props.dealname.length > 10)
            score += 15;
        if (contacts.length > 0)
            score += 15;
        if (props.closedate)
            score += 10;
        return Math.min(100, score);
    }
    mapDealStage(stage) {
        const stageMap = {
            'appointmentscheduled': 'Discovery',
            'qualifiedtobuy': 'Demo',
            'presentationscheduled': 'Proposal',
            'decisionmakerboughtin': 'Negotiation',
            'contractsent': 'Negotiation',
            'closedwon': 'Closed Won',
            'closedlost': 'Closed Lost',
            'discovery': 'Discovery',
            'demo': 'Demo',
            'proposal': 'Proposal',
            'negotiation': 'Negotiation',
        };
        return stageMap[stage.toLowerCase()] || 'Discovery';
    }
    mapForecastCategory(category) {
        const categoryMap = {
            'commit': 'Commit',
            'mostlikely': 'Most Likely',
            'bestcase': 'Best Case',
            'pipeline': 'Pipeline',
            'closed': 'Closed',
        };
        return categoryMap[category.toLowerCase()] || 'Pipeline';
    }
    getStageProbability(stage) {
        const probabilityMap = {
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
    getPipelineDisplayName(pipeline) {
        const nameMap = {
            'default': 'Sales Pipeline',
            'sales': 'Sales Pipeline',
            'marketing': 'Marketing Pipeline',
            'partner': 'Partner Pipeline',
        };
        return nameMap[pipeline.toLowerCase()] || `${pipeline.charAt(0).toUpperCase() + pipeline.slice(1)} Pipeline`;
    }
    stageIdCache = null;
    async getPipelineStageMap() {
        if (this.stageIdCache)
            return this.stageIdCache;
        try {
            const data = await this.fetchFromHubSpot('/pipelines/deals/default/stages');
            const stages = data.results || [];
            this.logger.log(`Fetched ${stages.length} pipeline stages from HubSpot`);
            const stageMap = {};
            for (const stage of stages) {
                stageMap[stage.label.toLowerCase()] = stage.id;
                this.logger.log(`HubSpot stage: "${stage.label}" = ${stage.id}`);
            }
            stageMap['closed won'] = 'closedwon';
            stageMap['closed lost'] = 'closedlost';
            this.stageIdCache = stageMap;
            return stageMap;
        }
        catch (error) {
            this.logger.warn('Failed to fetch pipeline stages, using fallback mapping:', error);
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
    async updateDeal(dealId, updates) {
        this.logger.log(`Updating HubSpot deal ${dealId} with:`, updates);
        const properties = {};
        if (updates.stage) {
            const stageMap = await this.getPipelineStageMap();
            const stageId = stageMap[updates.stage.toLowerCase()];
            if (stageId) {
                properties.dealstage = stageId;
                this.logger.log(`Mapping stage "${updates.stage}" to HubSpot ID: ${stageId}`);
            }
            else {
                this.logger.warn(`No HubSpot stage mapping found for "${updates.stage}", sending as-is`);
                properties.dealstage = updates.stage;
            }
        }
        if (updates.amount) {
            properties.amount = updates.amount;
        }
        try {
            const data = await this.fetchFromHubSpot(`/objects/deals/${dealId}`, {
                method: 'PATCH',
                body: JSON.stringify({ properties }),
            });
            this.logger.log(`Successfully updated deal ${dealId}`);
            return data;
        }
        catch (error) {
            this.logger.error(`Failed to update deal in HubSpot:`, error);
            throw error;
        }
    }
};
exports.HubSpotService = HubSpotService;
exports.HubSpotService = HubSpotService = HubSpotService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], HubSpotService);
//# sourceMappingURL=hubspot.service.js.map