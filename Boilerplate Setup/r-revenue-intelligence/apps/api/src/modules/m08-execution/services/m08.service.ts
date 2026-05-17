import { Injectable } from '@nestjs/common';
import { M08ExecutionRepository } from '../repositories/m08.repository';
import { EventPublisherService } from '../../../platform-core/events/event-publisher.service';

@Injectable()
export class M08ExecutionService {
  constructor(
    private readonly repo: M08ExecutionRepository,
    private readonly events: EventPublisherService,
  ) {}

  async findAll(tenantId: string) {
    return this.repo.findAll(tenantId);
  }

  async create(dto: any, tenantId: string) {
    const record = await this.repo.create({ ...dto, tenantId });
    await this.events.publish('workflow.executed', { tenantId, recordId: record.id });
    return record;
  }
}
