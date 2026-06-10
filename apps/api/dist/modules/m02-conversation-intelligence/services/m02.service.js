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
Object.defineProperty(exports, "__esModule", { value: true });
exports.M02ConversationIntelligenceService = void 0;
const common_1 = require("@nestjs/common");
const m02_repository_1 = require("../repositories/m02.repository");
const hybrid_search_service_1 = require("./hybrid-search.service");
const event_publisher_service_1 = require("../../platform-core/events/event-publisher.service");
const search_interface_1 = require("../interfaces/search.interface");
let M02ConversationIntelligenceService = class M02ConversationIntelligenceService {
    repo;
    searchService;
    events;
    constructor(repo, searchService, events) {
        this.repo = repo;
        this.searchService = searchService;
        this.events = events;
    }
    async searchConversations(dto, tenantId) {
        const parsedDto = search_interface_1.SearchQuerySchema.parse(dto);
        const rawConversations = await this.repo.findAllConversations(tenantId);
        let filteredCorpus = rawConversations;
        if (parsedDto.sentiment) {
            filteredCorpus = filteredCorpus.filter(c => c.sentiment === parsedDto.sentiment);
        }
        if (parsedDto.topic) {
            filteredCorpus = filteredCorpus.filter(c => c.topics?.includes(parsedDto.topic));
        }
        if (parsedDto.agent) {
            filteredCorpus = filteredCorpus.filter(c => c.agentName?.toLowerCase().includes(parsedDto.agent.toLowerCase()));
        }
        if (parsedDto.channel) {
            filteredCorpus = filteredCorpus.filter(c => c.channel === parsedDto.channel);
        }
        const queryText = parsedDto.query || '';
        const textResults = await this.searchService.executeTextSearch(filteredCorpus, queryText, tenantId);
        const semanticResults = await this.searchService.executeSemanticSearch(filteredCorpus, queryText, tenantId);
        const blendedResults = this.searchService.blendHybridResults(textResults, semanticResults, 0.5, 0.5);
        const page = parsedDto.page || 1;
        const limit = parsedDto.limit || 10;
        const startIndex = (page - 1) * limit;
        return blendedResults.slice(startIndex, startIndex + limit);
    }
    async getConversations(filters, tenantId) {
        const parsedFilters = search_interface_1.SearchQuerySchema.parse(filters);
        let corpus = await this.repo.findAllConversations(tenantId);
        if (parsedFilters.sentiment) {
            corpus = corpus.filter(c => c.sentiment === parsedFilters.sentiment);
        }
        if (parsedFilters.topic) {
            corpus = corpus.filter(c => c.topics?.includes(parsedFilters.topic));
        }
        if (parsedFilters.agent) {
            corpus = corpus.filter(c => c.agentName?.toLowerCase().includes(parsedFilters.agent.toLowerCase()));
        }
        if (parsedFilters.channel) {
            corpus = corpus.filter(c => c.channel === parsedFilters.channel);
        }
        const page = parsedFilters.page || 1;
        const limit = parsedFilters.limit || 10;
        const totalCount = corpus.length;
        const paginated = corpus.slice((page - 1) * limit, page * limit);
        return {
            conversations: paginated,
            totalCount,
            page,
            limit
        };
    }
    async getConversationById(id, tenantId) {
        return this.repo.findConversationById(id, tenantId);
    }
    async createSavedSearch(dto, tenantId, userId) {
        const parsedDto = search_interface_1.SavedSearchSchema.parse(dto);
        return this.repo.createSavedSearch(parsedDto, tenantId, userId);
    }
    async getSavedSearches(tenantId, userId) {
        return this.repo.findSavedSearches(tenantId, userId);
    }
    async findAll(tenantId) {
        return this.repo.findAllConversations(tenantId);
    }
    async create(dto, tenantId) {
        const record = await this.repo.createSyncLog({ ...dto, entityType: 'transcript' }, tenantId);
        await this.events.publish('call.scored', { tenantId, recordId: record.id });
        return record;
    }
};
exports.M02ConversationIntelligenceService = M02ConversationIntelligenceService;
exports.M02ConversationIntelligenceService = M02ConversationIntelligenceService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [m02_repository_1.M02ConversationIntelligenceRepository,
        hybrid_search_service_1.HybridSearchService,
        event_publisher_service_1.EventPublisherService])
], M02ConversationIntelligenceService);
//# sourceMappingURL=m02.service.js.map