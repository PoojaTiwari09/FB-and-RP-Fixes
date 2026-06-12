import { Injectable } from '@nestjs/common';
import { Deal, DealStage, ForecastCategory } from '@m04/entities';
import { InjectRepository } from '../database/inject-repository';
import { Between, In, M04EntityRepository } from '../database/m04-prisma.repository';

export interface DealFilters {
  ownerId?: string;
  stage?: DealStage;
  forecastCategory?: ForecastCategory;
  minAmount?: number;
  maxAmount?: number;
  closeDateFrom?: Date;
  closeDateTo?: Date;
  isHighRisk?: boolean;
  search?: string;
}

@Injectable()
export class DealRepository {
  constructor(
    @InjectRepository(Deal)
    private readonly dealRepository: M04EntityRepository<Deal>,
  ) {}

  async create(deal: Partial<Deal>): Promise<Deal> {
    const newDeal = this.dealRepository.create(deal);
    return this.dealRepository.save(newDeal) as Promise<Deal>;
  }

  async findById(id: string, relations: string[] = []): Promise<Deal | null> {
    return this.dealRepository.findOne({
      where: { id },
      relations,
    });
  }

  async findByCrmId(crmDealId: string): Promise<Deal | null> {
    return this.dealRepository.findOne({
      where: { crmDealId },
    });
  }

  async findAll(
    filters: DealFilters,
    page: number = 1,
    limit: number = 25,
  ): Promise<[Deal[], number]> {
    const skip = (page - 1) * limit;
    const queryBuilder = this.dealRepository.createQueryBuilder('deal');

    if (filters.ownerId) {
      queryBuilder.andWhere('deal.ownerId = :ownerId', { ownerId: filters.ownerId });
    }

    if (filters.stage) {
      queryBuilder.andWhere('deal.stage = :stage', { stage: filters.stage });
    }

    if (filters.forecastCategory) {
      queryBuilder.andWhere('deal.forecastCategory = :forecastCategory', {
        forecastCategory: filters.forecastCategory,
      });
    }

    if (filters.minAmount !== undefined) {
      queryBuilder.andWhere('deal.amount >= :minAmount', { minAmount: filters.minAmount });
    }

    if (filters.maxAmount !== undefined) {
      queryBuilder.andWhere('deal.amount <= :maxAmount', { maxAmount: filters.maxAmount });
    }

    if (filters.closeDateFrom) {
      queryBuilder.andWhere('deal.closeDate >= :closeDateFrom', {
        closeDateFrom: filters.closeDateFrom,
      });
    }

    if (filters.closeDateTo) {
      queryBuilder.andWhere('deal.closeDate <= :closeDateTo', {
        closeDateTo: filters.closeDateTo,
      });
    }

    if (filters.isHighRisk !== undefined) {
      queryBuilder.andWhere('deal.isHighRisk = :isHighRisk', { isHighRisk: filters.isHighRisk });
    }

    if (filters.search) {
      queryBuilder.andWhere(
        '(deal.name ILIKE :search OR deal.accountName ILIKE :search)',
        { search: `%${filters.search}%` },
      );
    }

    queryBuilder.orderBy('deal.updatedAt', 'DESC').skip(skip).take(limit);

    return queryBuilder.getManyAndCount();
  }

  async findByBoardFilters(
    boardFilters: any[],
    page: number = 1,
    limit: number = 25,
  ): Promise<[Deal[], number]> {
    const skip = (page - 1) * limit;
    const queryBuilder = this.dealRepository.createQueryBuilder('deal');

    boardFilters.forEach((filter, index) => {
      const paramName = `filter_${index}`;

      switch (filter.operator) {
        case 'EQUALS':
          queryBuilder.andWhere(`deal.${filter.fieldName} = :${paramName}`, {
            [paramName]: filter.value,
          });
          break;
        case 'NOT_EQUALS':
          queryBuilder.andWhere(`deal.${filter.fieldName} != :${paramName}`, {
            [paramName]: filter.value,
          });
          break;
        case 'GREATER_THAN':
          queryBuilder.andWhere(`deal.${filter.fieldName} > :${paramName}`, {
            [paramName]: filter.value,
          });
          break;
        case 'LESS_THAN':
          queryBuilder.andWhere(`deal.${filter.fieldName} < :${paramName}`, {
            [paramName]: filter.value,
          });
          break;
        case 'IN':
          queryBuilder.andWhere(`deal.${filter.fieldName} IN (:...${paramName})`, {
            [paramName]: filter.value,
          });
          break;
        case 'CONTAINS':
          queryBuilder.andWhere(`deal.${filter.fieldName} ILIKE :${paramName}`, {
            [paramName]: `%${filter.value}%`,
          });
          break;
      }
    });

    queryBuilder.orderBy('deal.updatedAt', 'DESC').skip(skip).take(limit);

    return queryBuilder.getManyAndCount();
  }

  async update(id: string, updates: Partial<Deal>): Promise<Deal | null> {
    await this.dealRepository.update(id, updates);
    return this.findById(id);
  }

  async delete(id: string): Promise<void> {
    await this.dealRepository.delete(id);
  }

  async getDealsForOwner(ownerId: string, limit: number = 100): Promise<Deal[]> {
    return this.dealRepository.find({
      where: { ownerId },
      order: { updatedAt: 'DESC' },
      take: limit,
    });
  }

  async getHighRiskDeals(limit: number = 10): Promise<Deal[]> {
    return this.dealRepository.find({
      where: { isHighRisk: true },
      order: { amount: 'DESC' },
      take: limit,
    });
  }

  async getDealsClosingSoon(days: number = 30): Promise<Deal[]> {
    const today = new Date();
    const futureDate = new Date();
    futureDate.setDate(today.getDate() + days);

    return this.dealRepository.find({
      where: {
        closeDate: Between(today, futureDate),
        stage: In([DealStage.PROPOSAL, DealStage.NEGOTIATION]),
      },
      order: { closeDate: 'ASC' },
    });
  }

  async getDealsByForecastCategory(category: ForecastCategory): Promise<Deal[]> {
    return this.dealRepository.find({
      where: { forecastCategory: category },
      order: { amount: 'DESC' },
    });
  }

  async calculateTotalValue(filters: DealFilters): Promise<number> {
    const queryBuilder = this.dealRepository.createQueryBuilder('deal');

    if (filters.ownerId) {
      queryBuilder.andWhere('deal.ownerId = :ownerId', { ownerId: filters.ownerId });
    }

    if (filters.forecastCategory) {
      queryBuilder.andWhere('deal.forecastCategory = :forecastCategory', {
        forecastCategory: filters.forecastCategory,
      });
    }

    const result = await queryBuilder.select('SUM(deal.amount)', 'total').getRawOne();

    return parseFloat(String(result?.total || '0'));
  }

  async countByStage(): Promise<Record<string, number>> {
    const results = await this.dealRepository
      .createQueryBuilder('deal')
      .select('deal.stage', 'stage')
      .addSelect('COUNT(*)', 'count')
      .groupBy('deal.stage')
      .getRawMany();

    return results.reduce<Record<string, number>>((acc, row) => {
      acc[String(row.stage)] = parseInt(String(row.count), 10);
      return acc;
    }, {});
  }
}
