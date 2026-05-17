import { Injectable } from '@nestjs/common';
import { M02SalesEngagementRepository } from '../repositories/m02.repository';
import { EventPublisherService } from '../../../platform-core/events/event-publisher.service';

@Injectable()
export class M02SalesEngagementService {
  constructor(
    private readonly repo: M02SalesEngagementRepository,
    private readonly events: EventPublisherService,
  ) {}

  async findAll(tenantId: string) {
    return this.repo.findAll(tenantId);
  }

  async create(dto: any, tenantId: string) {
    const record = await this.repo.create({ ...dto, tenantId });
    await this.events.publish('email.sent', { tenantId, recordId: record.id });
    return record;
  }
}
