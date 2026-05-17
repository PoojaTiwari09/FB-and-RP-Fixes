import { Injectable } from '@nestjs/common';
import { M05SmartTrackingRepository } from '../repositories/m05.repository';
import { EventPublisherService } from '../../../platform-core/events/event-publisher.service';

@Injectable()
export class M05SmartTrackingService {
  constructor(
    private readonly repo: M05SmartTrackingRepository,
    private readonly events: EventPublisherService,
  ) {}

  async findAll(tenantId: string) {
    return this.repo.findAll(tenantId);
  }

  async create(dto: any, tenantId: string) {
    const record = await this.repo.create({ ...dto, tenantId });
    await this.events.publish('tracker.detection.created', { tenantId, recordId: record.id });
    return record;
  }
}
