import { Injectable } from '@nestjs/common';
import { M06InsightGenerationRepository } from '../repositories/m06.repository';
import { EventPublisherService } from '../../../platform-core/events/event-publisher.service';

@Injectable()
export class M06InsightGenerationService {
  constructor(
    private readonly repo: M06InsightGenerationRepository,
    private readonly events: EventPublisherService,
  ) {}

  async findAll(tenantId: string) {
    return this.repo.findAll(tenantId);
  }

  async create(dto: any, tenantId: string) {
    const record = await this.repo.create({ ...dto, tenantId });
    await this.events.publish('call.summary.generated', { tenantId, recordId: record.id });
    return record;
  }
}
