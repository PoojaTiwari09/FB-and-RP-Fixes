import { Injectable } from '@nestjs/common';
import { M10CoachingRepository } from '../repositories/m10.repository';
import { EventPublisherService } from '../../../platform-core/events/event-publisher.service';

@Injectable()
export class M10CoachingService {
  constructor(
    private readonly repo: M10CoachingRepository,
    private readonly events: EventPublisherService,
  ) {}

  async findAll(tenantId: string) {
    return this.repo.findAll(tenantId);
  }

  async create(dto: any, tenantId: string) {
    const record = await this.repo.create({ ...dto, tenantId });
    await this.events.publish('coaching.recommendation.created', { tenantId, recordId: record.id });
    return record;
  }
}
