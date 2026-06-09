import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

/**
 * Tracker (keyword detection) service for M02.
 *
 * All Prisma access is delegate-safe — the unified `@rri/database` PrismaClient
 * does not yet expose `m02Tracker` / `m02TrackerDetection` models, so we probe
 * before invoking. When the delegates are missing, the service falls back to an
 * in-memory store keyed by tenantId so the API and frontend remain functional
 * for local development and smoke testing.
 */
@Injectable()
export class TrackerService {
  private readonly logger = new Logger(TrackerService.name);

  // In-memory store for environments without the M02 Prisma models.
  private static memTrackers: any[] = [];
  private static memDetections: any[] = [];

  constructor(private prisma: PrismaService) {}

  private get trackerDelegate(): any | null {
    return (this.prisma as any)?.m02Tracker ?? (this.prisma as any)?.tracker ?? null;
  }

  private get detectionDelegate(): any | null {
    return (
      (this.prisma as any)?.m02TrackerDetection ??
      (this.prisma as any)?.trackerDetection ??
      null
    );
  }

  async createTracker(data: {
    tenantId: string;
    name: string;
    keywords: string[];
    isActive?: boolean;
    speakerScope?: string;
    timingCondition?: string;
    timingMinutes?: number;
  }) {
    if (!this.trackerDelegate?.create) {
      const created = {
        id: `mock-${Date.now()}`,
        ...data,
        isActive: data.isActive ?? true,
        createdAt: new Date(),
      };
      TrackerService.memTrackers.push(created);
      return created;
    }
    return this.trackerDelegate.create({ data });
  }

  async getTrackers(tenantId: string) {
    if (!this.trackerDelegate?.findMany) {
      return TrackerService.memTrackers
        .filter((t) => t.tenantId === tenantId)
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    }
    return this.trackerDelegate.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateTracker(id: string, tenantId: string, data: any) {
    if (!this.trackerDelegate?.update) {
      const idx = TrackerService.memTrackers.findIndex(
        (t) => t.id === id && t.tenantId === tenantId,
      );
      if (idx === -1) return null;
      TrackerService.memTrackers[idx] = { ...TrackerService.memTrackers[idx], ...data };
      return TrackerService.memTrackers[idx];
    }
    return this.trackerDelegate.update({ where: { id, tenantId }, data });
  }

  async deleteTracker(id: string, tenantId: string) {
    if (!this.trackerDelegate?.delete) {
      const before = TrackerService.memTrackers.length;
      TrackerService.memTrackers = TrackerService.memTrackers.filter(
        (t) => !(t.id === id && t.tenantId === tenantId),
      );
      return { success: TrackerService.memTrackers.length < before };
    }
    return this.trackerDelegate.delete({ where: { id, tenantId } });
  }

  async addKeywordsToTracker(trackerId: string, tenantId: string, keywords: string[]) {
    if (!this.trackerDelegate?.findUnique || !this.trackerDelegate?.update) {
      const t = TrackerService.memTrackers.find(
        (x) => x.id === trackerId && x.tenantId === tenantId,
      );
      if (!t) throw new Error('Tracker not found');
      t.keywords = Array.from(new Set([...(t.keywords || []), ...keywords]));
      return t;
    }
    const tracker = await this.trackerDelegate.findUnique({
      where: { id: trackerId, tenantId },
    });
    if (!tracker) throw new Error('Tracker not found');
    const newKeywords = Array.from(new Set([...tracker.keywords, ...keywords]));
    return this.trackerDelegate.update({
      where: { id: trackerId, tenantId },
      data: { keywords: newKeywords },
    });
  }

  /**
   * Scan a transcript for tracker keyword matches.
   * Delegate-safe — silently no-ops when M02 Prisma models are unavailable.
   */
  async scanTranscriptForTrackers(
    tenantId: string,
    entityId: string,
    entityType: 'call' | 'email',
    transcript: string,
    diarizedTranscript?: any[],
  ) {
    if (!this.trackerDelegate?.findMany) {
      this.logger.debug('scanTranscriptForTrackers skipped: tracker Prisma delegate unavailable');
      return [];
    }
    const trackers = await this.trackerDelegate.findMany({
      where: { tenantId, isActive: true },
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
        
        // Check if keyword exists in transcript
        if (transcriptLower.includes(keywordLower)) {
          // Find all occurrences with context
          const occurrences = this.findKeywordOccurrences(transcript, keyword);
          
          for (const occurrence of occurrences) {
            // Check speaker scope if diarized transcript is available
            let speakerMatch = true;
            if (tracker.speakerScope && diarizedTranscript) {
              speakerMatch = this.checkSpeakerScope(
                occurrence.position,
                tracker.speakerScope,
                diarizedTranscript
              );
            }

            // Check timing condition if specified
            let timingMatch = true;
            if (tracker.timingCondition && diarizedTranscript) {
              timingMatch = this.checkTimingCondition(
                occurrence.position,
                tracker.timingCondition,
                tracker.timingMinutes,
                diarizedTranscript
              );
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
      await this.detectionDelegate.createMany({ data: detections, skipDuplicates: true });
    } else if (detections.length > 0) {
      TrackerService.memDetections.push(...detections);
    }

    this.logger.log(
      `Scanned ${entityType} ${entityId}: found ${detections.length} tracker detections`,
    );
    return detections;
  }

  /**
   * Find all occurrences of a keyword in transcript with context
   */
  private findKeywordOccurrences(transcript: string, keyword: string) {
    const occurrences = [];
    const keywordLower = keyword.toLowerCase();
    const transcriptLower = transcript.toLowerCase();
    let position = 0;

    while (position !== -1) {
      position = transcriptLower.indexOf(keywordLower, position);
      
      if (position !== -1) {
        // Extract context (50 chars before and after)
        const start = Math.max(0, position - 50);
        const end = Math.min(transcript.length, position + keyword.length + 50);
        const context = transcript.substring(start, end);
        
        occurrences.push({
          position,
          context,
          timestamp: null, // Will be calculated if diarized transcript is available
        });
        
        position += keyword.length;
      }
    }

    return occurrences;
  }

  /**
   * Check if the occurrence matches the speaker scope
   */
  private checkSpeakerScope(
    position: number,
    speakerScope: string,
    diarizedTranscript: any[]
  ): boolean {
    // Find which turn contains this position
    let currentPosition = 0;
    for (const turn of diarizedTranscript) {
      const turnLength = turn.text.length;
      if (position >= currentPosition && position < currentPosition + turnLength) {
        const speakerLower = turn.speaker.toLowerCase();
        
        if (speakerScope === 'agent') {
          return speakerLower.includes('agent') || speakerLower.includes('sales') || speakerLower.includes('rep');
        } else if (speakerScope === 'customer') {
          return speakerLower.includes('customer') || speakerLower.includes('client') || speakerLower.includes('prospect');
        }
        
        return true;
      }
      currentPosition += turnLength;
    }
    
    return true; // Default to match if can't determine
  }

  /**
   * Check if the occurrence matches the timing condition
   */
  private checkTimingCondition(
    position: number,
    timingCondition: string,
    timingMinutes: number,
    diarizedTranscript: any[]
  ): boolean {
    if (!timingMinutes) return true;

    // Find which turn contains this position and check its timestamp
    let currentPosition = 0;
    for (const turn of diarizedTranscript) {
      const turnLength = turn.text.length;
      if (position >= currentPosition && position < currentPosition + turnLength) {
        const turnStart = turn.start || 0;
        
        if (timingCondition === 'within_first') {
          return turnStart <= timingMinutes * 60;
        } else if (timingCondition === 'after') {
          return turnStart >= timingMinutes * 60;
        }
        
        return true;
      }
      currentPosition += turnLength;
    }
    
    return true; // Default to match if can't determine
  }

  async getDetectionsForConversation(
    tenantId: string,
    entityId: string,
    entityType: 'call' | 'email',
  ) {
    if (!this.detectionDelegate?.findMany) {
      return TrackerService.memDetections.filter(
        (d) => d.tenantId === tenantId && d.entityId === entityId && d.entityType === entityType,
      );
    }
    return this.detectionDelegate.findMany({
      where: { tenantId, entityId, entityType },
      include: { tracker: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getAllDetections(tenantId: string) {
    if (!this.detectionDelegate?.findMany) {
      return TrackerService.memDetections.filter((d) => d.tenantId === tenantId);
    }
    return this.detectionDelegate.findMany({
      where: { tenantId },
      include: { tracker: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getTrackerStats(tenantId: string) {
    const trackerD = this.trackerDelegate;
    const detectionD = this.detectionDelegate;

    if (!trackerD?.count || !detectionD?.count) {
      const trackers = TrackerService.memTrackers.filter((t) => t.tenantId === tenantId);
      const detections = TrackerService.memDetections.filter((d) => d.tenantId === tenantId);
      const monthAgo = new Date();
      monthAgo.setDate(monthAgo.getDate() - 30);
      return {
        totalTrackers: trackers.length,
        activeTrackers: trackers.filter((t) => t.isActive !== false).length,
        totalDetections: detections.length,
        detectionsThisMonth: detections.filter(
          (d) => new Date(d.createdAt).getTime() >= monthAgo.getTime(),
        ).length,
      };
    }

    const [totalTrackers, activeTrackers, totalDetections, detectionsThisMonth] = await Promise.all([
      trackerD.count({ where: { tenantId } }),
      trackerD.count({ where: { tenantId, isActive: true } }),
      detectionD.count({ where: { tenantId } }),
      detectionD.count({
        where: {
          tenantId,
          createdAt: { gte: new Date(new Date().setDate(new Date().getDate() - 30)) },
        },
      }),
    ]);

    return { totalTrackers, activeTrackers, totalDetections, detectionsThisMonth };
  }
}
