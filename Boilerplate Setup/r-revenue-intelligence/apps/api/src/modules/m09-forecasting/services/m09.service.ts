import { Injectable } from '@nestjs/common';
import { M09ForecastingRepository } from '../repositories/m09.repository';
import { EventPublisherService } from '../../../platform-core/events/event-publisher.service';

@Injectable()
export class M09ForecastingService {
  constructor(
    private readonly repo: M09ForecastingRepository,
    private readonly events: EventPublisherService,
  ) {}

  async findAll(tenantId: string) {
    return this.repo.findAll(tenantId);
  }

  async create(dto: any, tenantId: string) {
    const record = await this.repo.create({ ...dto, tenantId });
    await this.events.publish('forecast.submitted', { tenantId, recordId: record.id });
    return record;
  }
}
