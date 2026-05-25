import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { DealActivity, ActivityType } from '@/entities/deal-activity.entity';
import { Deal } from '@/entities/deal.entity';
import {
  CreateActivityDto,
  UpdateActivityDto,
  ActivityResponseDto,
  ActivityQueryDto,
  ActivityTimelineDto,
} from '@/schemas/activity.dto';

@Injectable()
export class DealActivityService {
  constructor(
    @InjectRepository(DealActivity)
    private readonly activityRepository: Repository<DealActivity>,
    @InjectRepository(Deal)
    private readonly dealRepository: Repository<Deal>,
  ) {}

  /**
   * Get activity timeline for a deal
   */
  async getTimeline(dealId: string, query: ActivityQueryDto): Promise<ActivityTimelineDto> {
    const deal = await this.dealRepository.findOne({ where: { id: dealId } });
    if (!deal) {
      throw new NotFoundException('Deal not found');
    }

    const queryBuilder = this.activityRepository
      .createQueryBuilder('activity')
      .where('activity.dealId = :dealId', { dealId });

    // Apply filters
    if (query.type) {
      queryBuilder.andWhere('activity.type = :type', { type: query.type });
    }

    if (query.startDate || query.endDate) {
      const startDate = query.startDate ? new Date(query.startDate) : new Date('1970-01-01');
      const endDate = query.endDate ? new Date(query.endDate) : new Date('2100-12-31');
      queryBuilder.andWhere('activity.activityDate BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      });
    }

    // Get total count
    const total = await queryBuilder.getCount();

    // Get activities with pagination
    const page = query.page ?? 1;
    const limit = query.limit ?? 50;
    
    const activities = await queryBuilder
      .orderBy('activity.activityDate', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getMany();

    // Get activities by type
    const byTypeQuery = await this.activityRepository
      .createQueryBuilder('activity')
      .select('activity.type', 'type')
      .addSelect('COUNT(*)', 'count')
      .where('activity.dealId = :dealId', { dealId })
      .groupBy('activity.type')
      .getRawMany();

    const byType = byTypeQuery.reduce((acc, item) => {
      acc[item.type] = parseInt(item.count);
      return acc;
    }, {} as Record<ActivityType, number>);

    // Get last activity date
    const lastActivity = await this.activityRepository.findOne({
      where: { dealId },
      order: { activityDate: 'DESC' },
    });

    return {
      total,
      byType,
      activities: activities.map((a) => this.toResponseDto(a)),
      lastActivityDate: lastActivity?.activityDate,
    };
  }

  /**
   * Get activities for a deal
   */
  async getActivities(dealId: string, query: ActivityQueryDto): Promise<ActivityResponseDto[]> {
    const deal = await this.dealRepository.findOne({ where: { id: dealId } });
    if (!deal) {
      throw new NotFoundException('Deal not found');
    }

    const page = query.page ?? 1;
    const limit = query.limit ?? 50;

    const queryBuilder = this.activityRepository
      .createQueryBuilder('activity')
      .where('activity.dealId = :dealId', { dealId });

    if (query.type) {
      queryBuilder.andWhere('activity.type = :type', { type: query.type });
    }

    if (query.startDate || query.endDate) {
      const startDate = query.startDate ? new Date(query.startDate) : new Date('1970-01-01');
      const endDate = query.endDate ? new Date(query.endDate) : new Date('2100-12-31');
      queryBuilder.andWhere('activity.activityDate BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      });
    }

    const activities = await queryBuilder
      .orderBy('activity.activityDate', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getMany();

    return activities.map((a) => this.toResponseDto(a));
  }

  /**
   * Get a single activity
   */
  async getActivity(dealId: string, activityId: string): Promise<ActivityResponseDto> {
    const activity = await this.activityRepository.findOne({
      where: { id: activityId, dealId },
    });

    if (!activity) {
      throw new NotFoundException('Activity not found');
    }

    return this.toResponseDto(activity);
  }

  /**
   * Create an activity
   */
  async createActivity(
    dealId: string,
    dto: CreateActivityDto,
    userId?: string,
    userName?: string,
  ): Promise<ActivityResponseDto> {
    const deal = await this.dealRepository.findOne({ where: { id: dealId } });
    if (!deal) {
      throw new NotFoundException('Deal not found');
    }

    const activity = this.activityRepository.create({
      dealId,
      type: dto.type,
      subject: dto.subject,
      summary: dto.summary,
      activityDate: dto.activityDate ? new Date(dto.activityDate) : new Date(),
      contactId: dto.contactId,
      contactName: dto.contactName,
      durationMinutes: dto.durationMinutes,
      crmActivityId: dto.crmActivityId || `manual-${Date.now()}`,
      crmData: dto.crmData,
    });

    const saved = await this.activityRepository.save(activity);
    return this.toResponseDto(saved);
  }

  /**
   * Update an activity
   */
  async updateActivity(
    dealId: string,
    activityId: string,
    dto: UpdateActivityDto,
  ): Promise<ActivityResponseDto> {
    const activity = await this.activityRepository.findOne({
      where: { id: activityId, dealId },
    });

    if (!activity) {
      throw new NotFoundException('Activity not found');
    }

    if (dto.subject !== undefined) {
      activity.subject = dto.subject;
    }

    if (dto.summary !== undefined) {
      activity.summary = dto.summary;
    }

    if (dto.activityDate !== undefined) {
      activity.activityDate = new Date(dto.activityDate);
    }

    if (dto.contactId !== undefined) {
      activity.contactId = dto.contactId;
    }

    if (dto.contactName !== undefined) {
      activity.contactName = dto.contactName;
    }

    if (dto.durationMinutes !== undefined) {
      activity.durationMinutes = dto.durationMinutes;
    }

    const updated = await this.activityRepository.save(activity);
    return this.toResponseDto(updated);
  }

  /**
   * Delete an activity
   */
  async deleteActivity(dealId: string, activityId: string): Promise<void> {
    const activity = await this.activityRepository.findOne({
      where: { id: activityId, dealId },
    });

    if (!activity) {
      throw new NotFoundException('Activity not found');
    }

    await this.activityRepository.remove(activity);
  }

  /**
   * Sync activities from HubSpot
   */
  async syncFromHubSpot(dealId: string, hubspotActivities: any[]): Promise<number> {
    let synced = 0;

    for (const hsActivity of hubspotActivities) {
      // Check if activity already exists
      const existing = await this.activityRepository.findOne({
        where: {
          dealId,
          crmActivityId: hsActivity.id,
        },
      });

      if (existing) {
        continue; // Skip if already synced
      }

      // Map HubSpot activity type to our ActivityType
      const type = this.mapHubSpotActivityType(hsActivity.type);

      const activity = this.activityRepository.create({
        dealId,
        type,
        subject: hsActivity.metadata?.subject || hsActivity.type,
        summary: hsActivity.metadata?.body || hsActivity.metadata?.notes,
        activityDate: new Date(hsActivity.createdAt),
        crmActivityId: hsActivity.id,
        crmData: hsActivity,
      });

      await this.activityRepository.save(activity);
      synced++;
    }

    return synced;
  }

  /**
   * Map HubSpot activity type to our ActivityType
   */
  private mapHubSpotActivityType(hsType: string): ActivityType {
    const typeMap: Record<string, ActivityType> = {
      EMAIL: ActivityType.EMAIL,
      CALL: ActivityType.CALL,
      MEETING: ActivityType.MEETING,
      NOTE: ActivityType.NOTE,
      TASK: ActivityType.TASK,
    };

    return typeMap[hsType?.toUpperCase()] || ActivityType.NOTE;
  }

  /**
   * Convert entity to response DTO
   */
  private toResponseDto(activity: DealActivity): ActivityResponseDto {
    return {
      id: activity.id,
      dealId: activity.dealId,
      type: activity.type,
      subject: activity.subject ?? undefined,
      summary: activity.summary ?? undefined,
      contactId: activity.contactId ?? undefined,
      contactName: activity.contactName ?? undefined,
      activityDate: activity.activityDate,
      durationMinutes: activity.durationMinutes ?? undefined,
      crmActivityId: activity.crmActivityId,
      crmData: activity.crmData ?? undefined,
      createdAt: activity.createdAt,
    };
  }
}
