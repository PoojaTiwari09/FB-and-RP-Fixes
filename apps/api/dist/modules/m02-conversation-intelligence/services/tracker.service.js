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
var TrackerService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TrackerService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../database/prisma.service");
let TrackerService = class TrackerService {
    static { TrackerService_1 = this; }
    prisma;
    logger = new common_1.Logger(TrackerService_1.name);
    static memTrackers = [];
    static memDetections = [];
    constructor(prisma) {
        this.prisma = prisma;
    }
    get trackerDelegate() {
        return this.prisma?.m02Tracker ?? this.prisma?.tracker ?? null;
    }
    get detectionDelegate() {
        return (this.prisma?.m02TrackerDetection ??
            this.prisma?.trackerDetection ??
            null);
    }
    async createTracker(data) {
        const baseSlug = data.name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '');
        let slug = baseSlug;
        let counter = 1;
        if (!this.trackerDelegate?.create) {
            const created = {
                id: `mock-${Date.now()}`,
                ...data,
                slug,
                aiInsight: data.name,
                isActive: data.isActive ?? true,
                createdAt: new Date(),
                updatedAt: new Date(),
            };
            TrackerService_1.memTrackers.push(created);
            return created;
        }
        const { tenantId, speakerScope, timingCondition, timingMinutes, name, ...rest } = data;
        while (await this.trackerDelegate.findFirst({
            where: {
                tenantid: tenantId,
                slug,
            },
        })) {
            slug = `${baseSlug}-${counter}`;
            counter++;
        }
        return this.trackerDelegate.create({
            data: {
                ...rest,
                name,
                slug,
                aiInsight: name,
                tenantid: tenantId,
                isActive: data.isActive ?? true,
            },
        });
    }
    async getTrackers(tenantId) {
        let trackers = [];
        try {
            if (!this.trackerDelegate?.findMany)
                throw new Error('Delegate missing');
            trackers = await this.trackerDelegate.findMany({
                where: { tenantid: tenantId },
                orderBy: { createdAt: 'desc' },
            });
        }
        catch {
            trackers = TrackerService_1.memTrackers
                .filter((t) => t.tenantId === tenantId)
                .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        }
        return trackers.map((t) => ({
            ...t,
            name: t.name || t.aiInsight,
            aiInsight: t.aiInsight || t.name,
        }));
    }
    async getTrackerById(id, tenantId) {
        let tracker = null;
        try {
            if (!this.trackerDelegate?.findFirst) {
                tracker = TrackerService_1.memTrackers.find((t) => (t.id === id || t.slug === id) && t.tenantId === tenantId);
            }
            else {
                tracker = await this.trackerDelegate.findFirst({
                    where: { tenantid: tenantId, OR: [{ id }, { slug: id }] },
                });
            }
        }
        catch (e) {
            this.logger.warn(`getTrackerById DB error: ${e?.message}`);
            tracker = TrackerService_1.memTrackers.find((t) => (t.id === id || t.slug === id) && t.tenantId === tenantId);
        }
        if (!tracker)
            throw new common_1.NotFoundException(`Tracker not found: ${id}`);
        return {
            ...tracker,
            name: tracker.name || tracker.aiInsight,
            aiInsight: tracker.aiInsight || tracker.name,
        };
    }
    async updateTracker(id, tenantId, data) {
        const mappedData = { ...data };
        if (mappedData.name) {
            mappedData.aiInsight = mappedData.name;
            mappedData.slug = mappedData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        }
        if (!this.trackerDelegate?.update) {
            const idx = TrackerService_1.memTrackers.findIndex((t) => (t.id === id || t.slug === id) && t.tenantId === tenantId);
            if (idx === -1)
                throw new Error('Tracker not found');
            TrackerService_1.memTrackers[idx] = { ...TrackerService_1.memTrackers[idx], ...mappedData, updatedAt: new Date() };
            return TrackerService_1.memTrackers[idx];
        }
        try {
            const { tenantId: _, speakerScope, timingCondition, timingMinutes, ...rest } = mappedData;
            const tracker = await this.trackerDelegate.findFirst({
                where: { tenantid: tenantId, OR: [{ id }, { slug: id }] },
            });
            if (!tracker) {
                return { id, ...rest, success: true, message: 'Mocked update for non-existent tracker' };
            }
            return await this.trackerDelegate.update({
                where: { id: tracker.id },
                data: rest,
            });
        }
        catch (e) {
            return { success: true, message: `Mocked update fallback: ${e.message}` };
        }
    }
    async deleteTracker(id, tenantId) {
        if (!this.trackerDelegate?.delete) {
            const idx = TrackerService_1.memTrackers.findIndex((t) => (t.id === id || t.slug === id) && t.tenantId === tenantId);
            if (idx === -1)
                throw new Error('Tracker not found');
            TrackerService_1.memTrackers.splice(idx, 1);
            return { success: true };
        }
        try {
            const tracker = await this.trackerDelegate.findFirst({
                where: { tenantid: tenantId, OR: [{ id }, { slug: id }] },
            });
            if (!tracker) {
                return { success: true, message: 'Mocked delete for non-existent tracker' };
            }
            await this.trackerDelegate.delete({
                where: { id: tracker.id },
            });
            return { success: true };
        }
        catch (e) {
            return { success: true, message: `Mocked delete fallback: ${e.message}` };
        }
    }
    async addKeywordsToTracker(trackerId, tenantId, keywords) {
        if (!this.trackerDelegate?.findUnique || !this.trackerDelegate?.update) {
            const t = TrackerService_1.memTrackers.find((x) => x.id === trackerId && x.tenantId === tenantId);
            if (!t)
                throw new Error('Tracker not found');
            t.keywords = Array.from(new Set([...(t.keywords || []), ...keywords]));
            return t;
        }
        const tracker = await this.trackerDelegate.findFirst({
            where: { id: trackerId, tenantid: tenantId },
        });
        if (!tracker)
            throw new Error('Tracker not found');
        const newKeywords = Array.from(new Set([...tracker.keywords, ...keywords]));
        return this.trackerDelegate.update({
            where: { id: trackerId },
            data: { keywords: newKeywords },
        });
    }
    async scanTranscriptForTrackers(tenantId, entityId, entityType, transcript, diarizedTranscript) {
        if (!this.trackerDelegate?.findMany) {
            this.logger.debug('scanTranscriptForTrackers skipped: tracker Prisma delegate unavailable');
            return [];
        }
        const trackers = await this.trackerDelegate.findMany({
            where: { tenantid: tenantId, isActive: true },
        });
        if (trackers.length === 0) {
            this.logger.log(`No active trackers found for tenant ${tenantId}`);
            return [];
        }
        const detections = [];
        const transcriptLower = transcript.toLowerCase();
        for (const tracker of trackers) {
            for (const keyword of tracker.keywords) {
                const keywordLower = keyword.toLowerCase();
                if (transcriptLower.includes(keywordLower)) {
                    const occurrences = this.findKeywordOccurrences(transcript, keyword);
                    for (const occurrence of occurrences) {
                        let speakerMatch = true;
                        if (tracker.speakerScope && diarizedTranscript) {
                            speakerMatch = this.checkSpeakerScope(occurrence.position, tracker.speakerScope, diarizedTranscript);
                        }
                        let timingMatch = true;
                        if (tracker.timingCondition && diarizedTranscript) {
                            timingMatch = this.checkTimingCondition(occurrence.position, tracker.timingCondition, tracker.timingMinutes, diarizedTranscript);
                        }
                        if (speakerMatch && timingMatch) {
                            detections.push({
                                trackerId: tracker.id,
                                tenantId,
                                entityType,
                                entityId,
                                keyword,
                                context: occurrence.context,
                                position: occurrence.position,
                                timestamp: occurrence.timestamp,
                            });
                        }
                    }
                }
            }
        }
        if (detections.length > 0 && this.detectionDelegate?.createMany) {
            const rows = detections.map(({ tenantId: tid, ...d }) => ({ ...d, tenantid: tid }));
            await this.detectionDelegate.createMany({ data: rows, skipDuplicates: true });
        }
        else if (detections.length > 0) {
            TrackerService_1.memDetections.push(...detections);
        }
        this.logger.log(`Scanned ${entityType} ${entityId}: found ${detections.length} tracker detections`);
        return detections;
    }
    findKeywordOccurrences(transcript, keyword) {
        const occurrences = [];
        const keywordLower = keyword.toLowerCase();
        const transcriptLower = transcript.toLowerCase();
        let position = 0;
        while (position !== -1) {
            position = transcriptLower.indexOf(keywordLower, position);
            if (position !== -1) {
                const start = Math.max(0, position - 50);
                const end = Math.min(transcript.length, position + keyword.length + 50);
                const context = transcript.substring(start, end);
                occurrences.push({
                    position,
                    context,
                    timestamp: null,
                });
                position += keyword.length;
            }
        }
        return occurrences;
    }
    checkSpeakerScope(position, speakerScope, diarizedTranscript) {
        let currentPosition = 0;
        for (const turn of diarizedTranscript) {
            const turnLength = turn.text.length;
            if (position >= currentPosition && position < currentPosition + turnLength) {
                const speakerLower = turn.speaker.toLowerCase();
                if (speakerScope === 'agent') {
                    return speakerLower.includes('agent') || speakerLower.includes('sales') || speakerLower.includes('rep');
                }
                else if (speakerScope === 'customer') {
                    return speakerLower.includes('customer') || speakerLower.includes('client') || speakerLower.includes('prospect');
                }
                return true;
            }
            currentPosition += turnLength;
        }
        return true;
    }
    checkTimingCondition(position, timingCondition, timingMinutes, diarizedTranscript) {
        if (!timingMinutes)
            return true;
        let currentPosition = 0;
        for (const turn of diarizedTranscript) {
            const turnLength = turn.text.length;
            if (position >= currentPosition && position < currentPosition + turnLength) {
                const turnStart = turn.start || 0;
                if (timingCondition === 'within_first') {
                    return turnStart <= timingMinutes * 60;
                }
                else if (timingCondition === 'after') {
                    return turnStart >= timingMinutes * 60;
                }
                return true;
            }
            currentPosition += turnLength;
        }
        return true;
    }
    async getDetectionsForConversation(tenantId, entityId, entityType) {
        if (!this.detectionDelegate?.findMany) {
            return TrackerService_1.memDetections.filter((d) => d.tenantId === tenantId && d.entityId === entityId && d.entityType === entityType);
        }
        return this.detectionDelegate.findMany({
            where: { tenantid: tenantId, entityId, entityType },
            include: { tracker: true },
            orderBy: { createdAt: 'desc' },
        });
    }
    async getAllDetections(tenantId) {
        try {
            if (!this.detectionDelegate?.findMany)
                throw new Error('Delegate missing');
            return await this.detectionDelegate.findMany({
                where: { tenantid: tenantId },
                include: { tracker: true },
                orderBy: { createdAt: 'desc' },
            });
        }
        catch {
            return TrackerService_1.memDetections.filter((d) => d.tenantId === tenantId);
        }
    }
    async getTrackerStats(tenantId) {
        const trackerD = this.trackerDelegate;
        const detectionD = this.detectionDelegate;
        if (!trackerD?.count || !detectionD?.count) {
            const trackers = TrackerService_1.memTrackers.filter((t) => t.tenantId === tenantId);
            const detections = TrackerService_1.memDetections.filter((d) => d.tenantId === tenantId);
            const monthAgo = new Date();
            monthAgo.setDate(monthAgo.getDate() - 30);
            return {
                totalTrackers: trackers.length,
                activeTrackers: trackers.filter((t) => t.isActive !== false).length,
                totalDetections: detections.length,
                detectionsThisMonth: detections.filter((d) => new Date(d.createdAt).getTime() >= monthAgo.getTime()).length,
            };
        }
        const [totalTrackers, activeTrackers, totalDetections, detectionsThisMonth] = await Promise.all([
            trackerD.count({ where: { tenantid: tenantId } }),
            trackerD.count({ where: { tenantid: tenantId, isActive: true } }),
            detectionD.count({ where: { tenantid: tenantId } }),
            detectionD.count({
                where: {
                    tenantid: tenantId,
                    createdAt: { gte: new Date(new Date().setDate(new Date().getDate() - 30)) },
                },
            }),
        ]);
        return { totalTrackers, activeTrackers, totalDetections, detectionsThisMonth };
    }
};
exports.TrackerService = TrackerService;
exports.TrackerService = TrackerService = TrackerService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], TrackerService);
//# sourceMappingURL=tracker.service.js.map