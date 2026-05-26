import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class TrackerService {
  private readonly logger = new Logger(TrackerService.name);

  constructor(private prisma: PrismaService) {}

  private get trackerDelegate(): { create?: Function; findMany?: Function } | undefined {
    return (this.prisma as any).m02Tracker;
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
      this.logger.warn('m02Tracker table not in schema — returning in-memory tracker for smoke/dev');
      return { id: `mock-${Date.now()}`, ...data, isActive: data.isActive ?? true, createdAt: new Date() };
    }
    return this.trackerDelegate.create({ data });
  }

  async getTrackers(tenantId: string) {
    if (!this.trackerDelegate?.findMany) return [];
    return this.trackerDelegate.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateTracker(id: string, tenantId: string, data: any) {
    return this.prisma.m02Tracker.update({
      where: { id, tenantId },
      data,
    });
  }

  async deleteTracker(id: string, tenantId: string) {
    return this.prisma.m02Tracker.delete({
      where: { id, tenantId },
    });
  }

  async addKeywordsToTracker(trackerId: string, tenantId: string, keywords: string[]) {
    const tracker = await this.prisma.m02Tracker.findUnique({
      where: { id: trackerId, tenantId },
    });

    if (!tracker) throw new Error('Tracker not found');

    const newKeywords = Array.from(new Set([...tracker.keywords, ...keywords]));

    return this.prisma.m02Tracker.update({
      where: { id: trackerId, tenantId },
      data: { keywords: newKeywords },
    });
  }

  /**
   * Scan a transcript for tracker keyword matches
   */
  async scanTranscriptForTrackers(
    tenantId: string,
    entityId: string,
    entityType: 'call' | 'email',
    transcript: string,
    diarizedTranscript?: any[]
  ) {
    // Get all active trackers for the tenant
    const trackers = await this.prisma.m02Tracker.findMany({
      where: { 
        tenantId,
        isActive: true 
      },
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

    // Save detections to database
    if (detections.length > 0) {
      await this.prisma.m02TrackerDetection.createMany({
        data: detections,
        skipDuplicates: true,
      });
    }

    this.logger.log(`Scanned ${entityType} ${entityId}: found ${detections.length} tracker detections`);
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

  /**
   * Get detections for a specific conversation
   */
  async getDetectionsForConversation(
    tenantId: string,
    entityId: string,
    entityType: 'call' | 'email'
  ) {
    const detections = await this.prisma.m02TrackerDetection.findMany({
      where: {
        tenantId,
        entityId,
        entityType,
      },
      include: {
        tracker: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return detections;
  }

  /**
   * Get all detections for a tenant (for dashboard)
   */
  async getAllDetections(tenantId: string) {
    return this.prisma.m02TrackerDetection.findMany({
      where: { tenantId },
      include: {
        tracker: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  /**
   * Get tracker statistics
   */
  async getTrackerStats(tenantId: string) {
    const totalTrackers = await this.prisma.m02Tracker.count({
      where: { tenantId },
    });

    const activeTrackers = await this.prisma.m02Tracker.count({
      where: { 
        tenantId,
        isActive: true 
      },
    });

    const totalDetections = await this.prisma.m02TrackerDetection.count({
      where: { tenantId },
    });

    const detectionsThisMonth = await this.prisma.m02TrackerDetection.count({
      where: {
        tenantId,
        createdAt: {
          gte: new Date(new Date().setDate(new Date().getDate() - 30)),
        },
      },
    });

    return {
      totalTrackers,
      activeTrackers,
      totalDetections,
      detectionsThisMonth,
    };
  }
}
