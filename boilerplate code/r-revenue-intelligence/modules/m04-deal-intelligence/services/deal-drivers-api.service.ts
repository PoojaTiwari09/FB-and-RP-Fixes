import { Injectable, NotFoundException } from '@nestjs/common';
import { DealDriversApiRepository } from '../repositories/deal-drivers-api.repository';
import { DealCatalogService } from './deal-catalog.service';
import { DealDriverEntity } from '../entities/deal-driver.entity';
import type {
  CreateDealDriverDto,
  UpdateDealDriverDto,
  DealDriverRecord,
} from '../interfaces/deal-driver.types';

@Injectable()
export class DealDriversApiService {
  constructor(
    private readonly repo: DealDriversApiRepository,
    private readonly catalog: DealCatalogService,
  ) {}

  private async attachDealContext(record: DealDriverRecord): Promise<DealDriverRecord> {
    try {
      const deal = await this.catalog.findDealById(record.dealId);
      const board = await this.catalog.resolveBoardForDeal(record.dealId);
      return {
        ...record,
        dealName: String(deal.dealName || deal.name || ''),
        boardName: board?.boardName,
        boardId: record.boardId ?? board?.boardId ?? null,
      };
    } catch {
      return record;
    }
  }

  async list(filters: { dealId?: string; boardId?: string }) {
    const rows = await this.repo.findMany(filters);
    return Promise.all(
      rows.map(async (r) => this.attachDealContext(DealDriverEntity.fromPrisma(r))),
    );
  }

  async getById(id: string) {
    const row = await this.repo.findById(id);
    if (!row) throw new NotFoundException(`Deal driver ${id} not found`);
    return this.attachDealContext(DealDriverEntity.fromPrisma(row));
  }

  async create(dto: CreateDealDriverDto) {
    await this.catalog.assertDealExists(dto.dealId);
    if (!dto.boardId) {
      const board = await this.catalog.resolveBoardForDeal(dto.dealId);
      if (board) dto.boardId = board.boardId;
    }
    const row = await this.repo.create('default', dto);
    return this.attachDealContext(DealDriverEntity.fromPrisma(row));
  }

  async update(id: string, dto: UpdateDealDriverDto) {
    const existing = await this.repo.findById(id);
    if (!existing) throw new NotFoundException(`Deal driver ${id} not found`);
    const row = await this.repo.update(id, dto);
    return this.attachDealContext(DealDriverEntity.fromPrisma(row));
  }

  async remove(id: string) {
    const existing = await this.repo.findById(id);
    if (!existing) throw new NotFoundException(`Deal driver ${id} not found`);
    await this.repo.delete(id);
    return { deleted: true, id };
  }

  async listByDealId(dealId: string) {
    await this.catalog.assertDealExists(dealId);
    return this.list({ dealId });
  }
}
