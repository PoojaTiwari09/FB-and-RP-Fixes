"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SavedSearchSchema = exports.SearchQuerySchema = exports.SavedSearchDto = exports.SearchQueryDto = void 0;
const zod_1 = require("zod");
class SearchQueryDto {
    query;
    agent;
    sentiment;
    topic;
    channel;
    page;
    limit;
    datePreset;
    startDate;
    endDate;
}
exports.SearchQueryDto = SearchQueryDto;
class SavedSearchDto {
    name;
    queryString;
    filters;
}
exports.SavedSearchDto = SavedSearchDto;
exports.SearchQuerySchema = zod_1.z.object({
    query: zod_1.z.string().optional().default(''),
    agent: zod_1.z.string().optional().default(''),
    sentiment: zod_1.z.enum(['Positive', 'Neutral', 'Negative', '']).optional(),
    topic: zod_1.z.string().optional().default(''),
    channel: zod_1.z.enum(['call', 'email', '']).optional(),
    page: zod_1.z.preprocess((val) => Number(val) || 1, zod_1.z.number().min(1)).optional().default(1),
    limit: zod_1.z.preprocess((val) => Number(val) || 10, zod_1.z.number().min(1)).optional().default(10),
    datePreset: zod_1.z.string().optional().default(''),
    startDate: zod_1.z.string().optional().default(''),
    endDate: zod_1.z.string().optional().default(''),
});
exports.SavedSearchSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, 'Name is required'),
    queryString: zod_1.z.string().optional().default(''),
    filters: zod_1.z.record(zod_1.z.any()).optional().default({}),
});
//# sourceMappingURL=search.interface.js.map